//! Private, per-session runtime configuration storage.
use super::domain::StartupTiming;
use anyhow::{bail, Context, Result};
use std::{
    fs::{self, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Command, Output, Stdio},
    thread,
    time::{Duration, Instant},
};

const SESSION_ID_BYTES: usize = 16;

pub struct RuntimeSession {
    root: PathBuf,
    directory: PathBuf,
    config: PathBuf,
    creation_timings: Vec<StartupTiming>,
    cleaned: bool,
}

impl RuntimeSession {
    pub fn create(ember_data_dir: &Path, config_json: &str) -> Result<Self> {
        let mut creation_timings = Vec::new();
        ensure_no_reparse(ember_data_dir)?;
        let root = ember_data_dir.join("runtime");
        fs::create_dir_all(&root).context("Could not create Ember runtime storage")?;
        ensure_no_reparse(ember_data_dir)?;
        ensure_no_reparse(&root)?;
        let acl_started = std::time::Instant::now();
        apply_private_acl(&root)?;
        creation_timings.push(timing("RuntimeRootAcl", acl_started));

        let mut random = [0u8; SESSION_ID_BYTES];
        getrandom::fill(&mut random).context("Could not create a private session identifier")?;
        let directory = root.join(hex::encode(random));
        fs::create_dir(&directory).context("Could not create a fresh runtime session")?;
        let result = (|| {
            let acl_started = std::time::Instant::now();
            apply_private_acl(&directory)?;
            creation_timings.push(timing("SessionAcl", acl_started));
            let config = directory.join("config.json");
            let write_started = std::time::Instant::now();
            let mut file = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&config)
                .context("Could not create the runtime configuration")?;
            file.write_all(config_json.as_bytes())?;
            file.sync_all()?;
            creation_timings.push(timing("RuntimeConfigWrite", write_started));
            let acl_started = std::time::Instant::now();
            apply_private_acl(&config)?;
            creation_timings.push(timing("RuntimeConfigAcl", acl_started));
            Ok(Self {
                root: root.clone(),
                directory: directory.clone(),
                config,
                creation_timings: creation_timings.clone(),
                cleaned: false,
            })
        })();
        if result.is_err() {
            let _ = remove_session_safely(&root, &directory);
        }
        result
    }

    pub fn config_path(&self) -> &Path {
        &self.config
    }

    pub fn working_directory(&self) -> &Path {
        &self.directory
    }

    pub fn creation_timings(&self) -> &[StartupTiming] {
        &self.creation_timings
    }

    pub fn cleanup(mut self) -> Result<()> {
        remove_session_safely(&self.root, &self.directory)?;
        self.cleaned = true;
        Ok(())
    }
}

fn timing(stage: &str, started: std::time::Instant) -> StartupTiming {
    StartupTiming {
        stage: stage.to_owned(),
        elapsed_ms: started.elapsed().as_millis().min(u64::MAX as u128) as u64,
    }
}

impl Drop for RuntimeSession {
    fn drop(&mut self) {
        if !self.cleaned {
            let _ = remove_session_safely(&self.root, &self.directory);
        }
    }
}

/// Delete only direct session directories below the verified runtime root.
pub fn cleanup_stale(ember_data_dir: &Path) -> Result<usize> {
    if !ember_data_dir.exists() {
        return Ok(0);
    }
    ensure_no_reparse(ember_data_dir)?;
    let root = ember_data_dir.join("runtime");
    if !root.exists() {
        return Ok(0);
    }
    ensure_no_reparse(&root)?;
    apply_private_acl(&root)?;
    let mut removed = 0;
    for entry in fs::read_dir(&root)? {
        let entry = entry?;
        let name = entry.file_name();
        let Some(name) = name.to_str() else { continue };
        if !valid_session_id(name) {
            continue;
        }
        let path = entry.path();
        if entry.file_type()?.is_dir() {
            remove_session_safely(&root, &path)?;
            removed += 1;
        }
    }
    Ok(removed)
}

fn valid_session_id(value: &str) -> bool {
    value.len() == SESSION_ID_BYTES * 2
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

fn remove_session_safely(root: &Path, directory: &Path) -> Result<()> {
    ensure_no_reparse(root)?;
    ensure_no_reparse(directory)?;
    if directory.parent() != Some(root)
        || !valid_session_id(
            directory
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or_default(),
        )
    {
        bail!("Runtime cleanup target is outside the session root");
    }
    reject_reparse_tree(directory)?;
    fs::remove_dir_all(directory).context("Could not remove the private runtime session")
}

fn reject_reparse_tree(path: &Path) -> Result<()> {
    ensure_no_reparse(path)?;
    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            reject_reparse_tree(&entry?.path())?;
        }
    }
    Ok(())
}

fn ensure_no_reparse(path: &Path) -> Result<()> {
    use std::os::windows::fs::MetadataExt;
    let metadata = fs::symlink_metadata(path)?;
    if metadata.file_attributes() & 0x400 != 0 {
        bail!("Reparse paths are not allowed in runtime storage");
    }
    Ok(())
}

/// Protect the runtime tree from inherited grants. The current user, LocalSystem,
/// and built-in Administrators receive full control; inherited ACEs are removed.
fn apply_private_acl(path: &Path) -> Result<()> {
    let system_root = std::env::var_os("SystemRoot").context("Windows system path unavailable")?;
    let system32 = PathBuf::from(system_root).join("System32");
    let whoami = system32.join("whoami.exe");
    let icacls = system32.join("icacls.exe");
    let output = run_bounded_output(
        Command::new(whoami)
            .args(["/user", "/fo", "csv", "/nh"])
            .env_clear(),
        Duration::from_secs(5),
    )
    .context("Could not resolve the current Windows user SID")?;
    if !output.status.success() {
        bail!("Could not resolve the current Windows user SID");
    }
    let line = String::from_utf8(output.stdout)?;
    let sid = line
        .trim()
        .split(',')
        .nth(1)
        .map(|part| part.trim().trim_matches('"'))
        .filter(|sid| {
            sid.starts_with("S-1-")
                && sid.bytes().all(|byte| {
                    byte.is_ascii_digit() || byte == b'-' || (byte >= b'S' && byte <= b'X')
                })
        })
        .context("Current Windows user SID was invalid")?;
    let is_directory = fs::metadata(path)?.is_dir();
    let inherit = if is_directory { "(OI)(CI)" } else { "" };
    let user_grant = format!("*{sid}:{inherit}F");
    let system_grant = format!("*S-1-5-18:{inherit}F");
    let admin_grant = format!("*S-1-5-32-544:{inherit}F");
    let result = run_bounded_output(
        Command::new(icacls)
            .arg(path)
            .args(["/inheritance:r", "/grant:r"])
            .arg(&user_grant)
            .arg(system_grant)
            .arg(admin_grant)
            .env_clear(),
        Duration::from_secs(5),
    )
    .context("Could not restrict runtime storage permissions")?;
    if !result.status.success() {
        bail!("Could not restrict runtime storage permissions");
    }
    Ok(())
}

fn run_bounded_output(command: &mut Command, timeout: Duration) -> Result<Output> {
    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let mut child = command
        .spawn()
        .context("Could not start Windows permission command")?;
    let deadline = Instant::now() + timeout;
    let status = loop {
        if let Some(status) = child.try_wait()? {
            break status;
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            let kill_deadline = Instant::now() + Duration::from_secs(2);
            while Instant::now() < kill_deadline {
                if let Some(status) = child.try_wait()? {
                    return Err(anyhow::anyhow!(
                        "Windows permission command exceeded its time limit (exit code {:?})",
                        status.code()
                    ));
                }
                thread::sleep(Duration::from_millis(10));
            }
            bail!("Windows permission command did not stop within the bounded cleanup period");
        }
        thread::sleep(Duration::from_millis(10));
    };
    let mut stdout = Vec::new();
    if let Some(mut pipe) = child.stdout.take() {
        pipe.read_to_end(&mut stdout)?;
    }
    Ok(Output {
        status,
        stdout,
        stderr: Vec::new(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn scratch() -> PathBuf {
        let path = std::env::temp_dir().join(format!(
            "ember-runtime-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    #[ignore]
    fn fixture_runtime_hang() {
        loop {
            thread::sleep(Duration::from_secs(1));
        }
    }

    #[test]
    fn permission_commands_have_a_bounded_wait_and_cleanup() {
        let mut command = Command::new(std::env::current_exe().unwrap());
        command.args([
            "--exact",
            "mining::runtime::tests::fixture_runtime_hang",
            "--ignored",
            "--nocapture",
        ]);
        let started = Instant::now();
        assert!(run_bounded_output(&mut command, Duration::from_millis(50)).is_err());
        assert!(started.elapsed() < Duration::from_secs(2));
    }

    #[test]
    fn session_config_is_created_and_removed_on_drop() {
        let root = scratch();
        let session = RuntimeSession::create(&root, "{\"private\":true}").unwrap();
        let config_path = session.config_path().to_owned();
        assert_eq!(
            fs::read_to_string(&config_path).unwrap(),
            "{\"private\":true}"
        );
        assert!(session
            .working_directory()
            .starts_with(root.join("runtime")));
        drop(session);
        assert!(!config_path.exists());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn startup_cleanup_removes_only_valid_stale_session_directories() {
        let root = scratch();
        let runtime = root.join("runtime");
        fs::create_dir_all(runtime.join("0123456789abcdef0123456789abcdef")).unwrap();
        fs::create_dir_all(runtime.join("user-data")).unwrap();
        assert_eq!(cleanup_stale(&root).unwrap(), 1);
        assert!(!runtime.join("0123456789abcdef0123456789abcdef").exists());
        assert!(runtime.join("user-data").exists());
        fs::remove_dir_all(root).unwrap();
    }
}
