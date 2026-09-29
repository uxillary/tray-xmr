use super::diagnostics::{DiagnosticRing, RedactionSecrets};
use super::domain::{DiagnosticSource, DiagnosticSummary, EngineError, EngineErrorKind};
use std::ffi::OsString;
use std::io::{self, Read};
use std::path::Path;
use std::process::{Child, Command, ExitStatus, Stdio};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

const MAX_CAPTURE_LINE: usize = 2 * 1024;

pub struct SupervisedChild {
    child: Child,
    diagnostics: Arc<Mutex<DiagnosticRing>>,
    readers: Vec<JoinHandle<()>>,
    #[cfg(windows)]
    job: Option<JobObject>,
}

impl SupervisedChild {
    pub fn spawn(
        executable: &Path,
        arguments: &[OsString],
        working_directory: &Path,
        redaction: RedactionSecrets,
    ) -> Result<Self, EngineError> {
        if !executable.is_absolute() || !working_directory.is_absolute() {
            return Err(EngineError {
                kind: EngineErrorKind::SpawnFailed,
                message: "Executable and working directory must be absolute paths".into(),
            });
        }

        let mut command = Command::new(executable);
        command
            .args(arguments)
            .current_dir(working_directory)
            .env_clear()
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        let mut child = command.spawn().map_err(|_| EngineError {
            kind: EngineErrorKind::SpawnFailed,
            message: "The verified engine process could not be started".into(),
        })?;

        #[cfg(windows)]
        let job = match JobObject::assign(child.id()) {
            Ok(job) => Some(job),
            Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(EngineError {
                    kind: EngineErrorKind::SpawnFailed,
                    message: "The engine could not be assigned to its cleanup job".into(),
                });
            }
        };

        let diagnostics = Arc::new(Mutex::new(DiagnosticRing::new(
            100,
            32 * 1024,
            redaction.clone(),
        )));
        let stdout_reader = spawn_reader(
            child.stdout.take(),
            DiagnosticSource::Stdout,
            Arc::clone(&diagnostics),
            redaction.clone(),
        );
        let stderr_reader = spawn_reader(
            child.stderr.take(),
            DiagnosticSource::Stderr,
            Arc::clone(&diagnostics),
            redaction,
        );

        Ok(Self {
            child,
            diagnostics,
            readers: [stdout_reader, stderr_reader]
                .into_iter()
                .flatten()
                .collect(),
            #[cfg(windows)]
            job,
        })
    }

    pub fn id(&self) -> u32 {
        self.child.id()
    }

    pub fn diagnostics(&self) -> Vec<DiagnosticSummary> {
        self.diagnostics
            .lock()
            .map(|ring| ring.snapshot())
            .unwrap_or_default()
    }

    pub fn try_wait(&mut self) -> io::Result<Option<ExitStatus>> {
        let status = self.child.try_wait()?;
        if status.is_some() {
            self.join_readers();
        }
        Ok(status)
    }

    pub fn stop_with<F>(
        &mut self,
        request_graceful: F,
        timeout: Duration,
    ) -> Result<ExitStatus, EngineError>
    where
        F: FnOnce(&mut Child) -> io::Result<()>,
    {
        let _ = request_graceful(&mut self.child);
        let deadline = Instant::now() + timeout;
        loop {
            if let Some(status) = self.child.try_wait().map_err(|_| EngineError {
                kind: EngineErrorKind::StopFailed,
                message: "Could not check the engine process state".into(),
            })? {
                self.join_readers();
                return Ok(status);
            }
            if Instant::now() >= deadline {
                break;
            }
            thread::sleep(Duration::from_millis(10));
        }

        #[cfg(windows)]
        if let Some(job) = self.job.take() {
            drop(job); // Closing the owning job terminates the process and descendants.
        } else {
            self.child.kill().map_err(|_| EngineError {
                kind: EngineErrorKind::StopFailed,
                message: "Could not terminate the owned engine process".into(),
            })?;
        }
        #[cfg(not(windows))]
        self.child.kill().map_err(|_| EngineError {
            kind: EngineErrorKind::StopFailed,
            message: "Could not terminate the owned engine process".into(),
        })?;
        let status = self.child.wait().map_err(|_| EngineError {
            kind: EngineErrorKind::StopFailed,
            message: "Could not reap the terminated engine process".into(),
        })?;
        self.join_readers();
        Ok(status)
    }

    fn join_readers(&mut self) {
        for reader in self.readers.drain(..) {
            let _ = reader.join();
        }
    }
}

impl Drop for SupervisedChild {
    fn drop(&mut self) {
        if self.child.try_wait().ok().flatten().is_none() {
            #[cfg(windows)]
            if let Some(job) = self.job.take() {
                drop(job); // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            } else {
                let _ = self.child.kill();
            }
            #[cfg(not(windows))]
            let _ = self.child.kill();
        }
        let _ = self.child.wait();
        self.join_readers();
    }
}

fn spawn_reader(
    stream: Option<impl Read + Send + 'static>,
    source: DiagnosticSource,
    ring: Arc<Mutex<DiagnosticRing>>,
    redaction: RedactionSecrets,
) -> Option<JoinHandle<()>> {
    stream.map(|mut stream| {
        thread::spawn(move || {
            let mut chunk = [0u8; 1024];
            let mut line = Vec::with_capacity(MAX_CAPTURE_LINE);
            let mut truncated = false;
            loop {
                let count = match stream.read(&mut chunk) {
                    Ok(0) | Err(_) => break,
                    Ok(count) => count,
                };
                for byte in &chunk[..count] {
                    if *byte == b'\n' {
                        push_line(&ring, source, &redaction, &line, truncated);
                        line.clear();
                        truncated = false;
                    } else if line.len() < MAX_CAPTURE_LINE {
                        line.push(*byte);
                    } else {
                        truncated = true;
                    }
                }
            }
            if !line.is_empty() || truncated {
                push_line(&ring, source, &redaction, &line, truncated);
            }
        })
    })
}

fn push_line(
    ring: &Mutex<DiagnosticRing>,
    source: DiagnosticSource,
    redaction: &RedactionSecrets,
    bytes: &[u8],
    truncated: bool,
) {
    let line = String::from_utf8_lossy(bytes);
    let suffix = if truncated { " [truncated]" } else { "" };
    let safe = redaction.redact(&format!("{line}{suffix}"));
    if let Ok(mut ring) = ring.lock() {
        ring.push(source, &safe);
    }
}

#[cfg(windows)]
struct JobObject(windows_sys::Win32::Foundation::HANDLE);

// The job handle is an owned kernel handle; moving it between supervisor threads is safe.
#[cfg(windows)]
unsafe impl Send for JobObject {}

#[cfg(windows)]
impl JobObject {
    fn assign(process_id: u32) -> Result<Self, ()> {
        use std::mem::{size_of, zeroed};
        use windows_sys::Win32::Foundation::{CloseHandle, GetLastError};
        use windows_sys::Win32::System::JobObjects::{
            AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
            SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
            JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
        };
        use windows_sys::Win32::System::Threading::{
            OpenProcess, PROCESS_SET_QUOTA, PROCESS_TERMINATE,
        };

        unsafe {
            let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
            if job.is_null() {
                let _ = GetLastError();
                return Err(());
            }
            let mut limits: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = zeroed();
            limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            let set = SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                &mut limits as *mut _ as *mut _,
                size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            );
            if set == 0 {
                CloseHandle(job);
                return Err(());
            }
            let process = OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, 0, process_id);
            if process.is_null() {
                CloseHandle(job);
                return Err(());
            }
            let assigned = AssignProcessToJobObject(job, process);
            CloseHandle(process);
            if assigned == 0 {
                CloseHandle(job);
                return Err(());
            }
            Ok(Self(job))
        }
    }
}

#[cfg(windows)]
impl Drop for JobObject {
    fn drop(&mut self) {
        unsafe { windows_sys::Win32::Foundation::CloseHandle(self.0) };
    }
}

#[cfg(test)]
mod tests {
    use super::SupervisedChild;
    use crate::mining::diagnostics::RedactionSecrets;
    use std::ffi::OsString;
    use std::io;
    use std::path::PathBuf;
    use std::process::Child;
    use std::time::Duration;

    #[test]
    #[ignore]
    fn fixture_process_entrypoint() {
        // Invoked only as a child test-harness process by the tests below.
        use std::io::Read;
        println!("fixture TEST_ONLY_PUBLIC_ADDRESS_DO_NOT_USE fixture-private-token C:\\Users\\Fixture\\AppData");
        let mut stdin = io::stdin();
        let mut buffer = [0u8; 16];
        while stdin.read(&mut buffer).unwrap_or(0) > 0 {}
    }

    #[test]
    #[ignore]
    fn fixture_exit_entrypoint() {
        std::thread::sleep(Duration::from_millis(80));
    }

    fn fixture_args() -> Vec<OsString> {
        vec![
            OsString::from("--exact"),
            OsString::from("mining::process::tests::fixture_process_entrypoint"),
            OsString::from("--nocapture"),
            OsString::from("--ignored"),
        ]
    }

    fn spawn_fixture() -> SupervisedChild {
        let executable = std::env::current_exe().unwrap();
        let working = std::env::current_dir().unwrap();
        SupervisedChild::spawn(
            &executable,
            &fixture_args(),
            &working,
            RedactionSecrets::new([
                "fixture-private-token".to_owned(),
                "TEST_ONLY_PUBLIC_ADDRESS_DO_NOT_USE".to_owned(),
                "C:\\Users\\Fixture".to_owned(),
            ]),
        )
        .unwrap()
    }

    #[test]
    fn graceful_stop_and_forced_fallback_reap_fixture() {
        let mut graceful = spawn_fixture();
        let pid = graceful.id();
        let status = graceful
            .stop_with(
                |child: &mut Child| {
                    drop(child.stdin.take());
                    Ok(())
                },
                Duration::from_secs(1),
            )
            .unwrap();
        assert!(status.success());
        assert!(graceful.try_wait().unwrap().is_some());
        let diagnostics = graceful.diagnostics();
        assert!(!diagnostics.is_empty());
        assert!(diagnostics.iter().all(|entry| {
            !entry.message.contains("fixture-private-token")
                && !entry.message.contains("TEST_ONLY_PUBLIC_ADDRESS")
                && !entry.message.contains("C:\\Users\\Fixture")
        }));

        let mut forced = spawn_fixture();
        let status = forced
            .stop_with(|_| Ok(()), Duration::from_millis(30))
            .unwrap();
        let _forced_status = status;
        assert_ne!(pid, forced.id());
        assert!(forced.try_wait().unwrap().is_some());
    }

    #[cfg(windows)]
    #[test]
    fn windows_owned_job_closes_and_reaps_child() {
        let child = spawn_fixture();
        let pid = child.id();
        assert!(
            child.job.is_some(),
            "spawn must fail unless assignment succeeds"
        );
        drop(child); // Drop closes the kill-on-close Job Object, then waits/reaps.
        assert!(!windows_process_is_running(pid));
    }

    #[cfg(windows)]
    fn windows_process_is_running(pid: u32) -> bool {
        use windows_sys::Win32::Foundation::{CloseHandle, WAIT_TIMEOUT};
        use windows_sys::Win32::System::Threading::{OpenProcess, WaitForSingleObject};

        unsafe {
            let process = OpenProcess(0x0010_0000, 0, pid);
            if process.is_null() {
                return false;
            }
            let running = WaitForSingleObject(process, 0) == WAIT_TIMEOUT;
            CloseHandle(process);
            running
        }
    }

    #[test]
    fn supervisor_rejects_relative_executable_paths() {
        let result = SupervisedChild::spawn(
            &PathBuf::from("not-absolute.exe"),
            &[],
            &std::env::current_dir().unwrap(),
            RedactionSecrets::new([]),
        );
        let error = match result {
            Ok(_) => panic!("relative executable unexpectedly started"),
            Err(error) => error,
        };
        assert_eq!(
            error.kind,
            crate::mining::domain::EngineErrorKind::SpawnFailed
        );
    }
}
