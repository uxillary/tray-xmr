use super::diagnostics::{DiagnosticRing, RedactionSecrets};
use super::domain::StartupTiming;
use super::domain::{DiagnosticSource, DiagnosticSummary, EngineError, EngineErrorKind};
use std::ffi::OsString;
use std::io::{self, Read};
use std::path::Path;
#[cfg(not(windows))]
use std::process::Child;
#[cfg(windows)]
use std::process::ExitStatus;
#[cfg(not(windows))]
use std::process::{Command, ExitStatus, Stdio};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

const MAX_CAPTURE_LINE: usize = 2 * 1024;

pub struct SupervisedChild {
    #[cfg(not(windows))]
    child: Child,
    #[cfg(windows)]
    child: WindowsChild,
    diagnostics: Arc<Mutex<DiagnosticRing>>,
    readers: Vec<JoinHandle<()>>,
    startup_timings: Vec<StartupTiming>,
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

        #[cfg(not(windows))]
        let (mut child, stdout, stderr, startup_timings) = {
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
                message: "The supervised process could not be started".into(),
            })?;
            (child, child.stdout.take(), child.stderr.take(), Vec::new())
        };
        #[cfg(windows)]
        let (child, stdout, stderr, job, startup_timings) =
            spawn_suspended_in_job(executable, arguments, working_directory)?;

        let diagnostics = Arc::new(Mutex::new(DiagnosticRing::new(
            100,
            32 * 1024,
            redaction.clone(),
        )));
        let stdout_reader = spawn_reader(
            stdout,
            DiagnosticSource::Stdout,
            Arc::clone(&diagnostics),
            redaction.clone(),
        );
        let stderr_reader = spawn_reader(
            stderr,
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
            startup_timings,
            #[cfg(windows)]
            job: Some(job),
        })
    }

    pub fn id(&self) -> u32 {
        self.child.id()
    }

    pub fn close_stdin(&mut self) {
        #[cfg(windows)]
        self.child.close_stdin();
        #[cfg(not(windows))]
        {
            self.child.stdin.take();
        }
    }

    pub fn diagnostics(&self) -> Vec<DiagnosticSummary> {
        self.diagnostics
            .lock()
            .map(|ring| ring.snapshot())
            .unwrap_or_default()
    }

    pub fn startup_timings(&self) -> &[StartupTiming] {
        &self.startup_timings
    }

    pub fn try_wait(&mut self) -> io::Result<Option<ExitStatus>> {
        let status = self.child.try_wait()?;
        if status.is_some() {
            #[cfg(windows)]
            drop(self.job.take()); // Close descendants before waiting for pipe EOF.
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
        F: FnOnce(&mut Self) -> io::Result<()>,
    {
        let _ = request_graceful(self);
        let deadline = Instant::now() + timeout;
        loop {
            if let Some(status) = self.try_wait().map_err(|_| EngineError {
                kind: EngineErrorKind::StopFailed,
                message: "Could not check the engine process state".into(),
            })? {
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
        #[cfg(windows)]
        drop(self.job.take()); // Also reap descendants after an already-exited parent.
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

fn classify_windows_creation_error(code: u32) -> EngineError {
    let (kind, message) = match code {
        2 | 3 => (
            EngineErrorKind::ArtifactUnavailable,
            "The mining engine is no longer available. Windows Security or another security product may have removed it.",
        ),
        5 => (
            EngineErrorKind::SecurityBlocked,
            "Windows prevented the mining engine from starting.",
        ),
        _ => (
            EngineErrorKind::SpawnFailed,
            "The mining engine could not be started safely.",
        ),
    };
    EngineError {
        kind,
        message: format!("{message} (Windows error {code})"),
    }
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
struct WindowsChild {
    process: std::os::windows::io::OwnedHandle,
    stdin: Option<std::fs::File>,
    pid: u32,
    status: Option<ExitStatus>,
}

#[cfg(windows)]
impl WindowsChild {
    fn id(&self) -> u32 {
        self.pid
    }
    fn close_stdin(&mut self) {
        self.stdin.take();
    }
    fn try_wait(&mut self) -> io::Result<Option<ExitStatus>> {
        use std::os::windows::io::AsRawHandle;
        use windows_sys::Win32::System::Threading::{GetExitCodeProcess, WaitForSingleObject};
        if let Some(status) = self.status {
            return Ok(Some(status));
        }
        let handle = self.process.as_raw_handle() as windows_sys::Win32::Foundation::HANDLE;
        let wait = unsafe { WaitForSingleObject(handle, 0) };
        if wait == windows_sys::Win32::Foundation::WAIT_TIMEOUT {
            return Ok(None);
        }
        if wait != windows_sys::Win32::Foundation::WAIT_OBJECT_0 {
            return Err(io::Error::last_os_error());
        }
        let mut code = 259; // STILL_ACTIVE
        if unsafe { GetExitCodeProcess(handle, &mut code) } == 0 {
            return Err(io::Error::last_os_error());
        }
        use std::os::windows::process::ExitStatusExt;
        let status = ExitStatus::from_raw(code);
        self.status = Some(status);
        Ok(Some(status))
    }
    fn kill(&mut self) -> io::Result<()> {
        use std::os::windows::io::AsRawHandle;
        let handle = self.process.as_raw_handle() as windows_sys::Win32::Foundation::HANDLE;
        if unsafe { windows_sys::Win32::System::Threading::TerminateProcess(handle, 1) } == 0 {
            let _ = self.try_wait()?;
            if self.status.is_some() {
                return Ok(());
            }
            return Err(io::Error::last_os_error());
        }
        Ok(())
    }
    fn wait(&mut self) -> io::Result<ExitStatus> {
        use std::os::windows::io::AsRawHandle;
        let handle = self.process.as_raw_handle() as windows_sys::Win32::Foundation::HANDLE;
        let wait =
            unsafe { windows_sys::Win32::System::Threading::WaitForSingleObject(handle, u32::MAX) };
        if wait != windows_sys::Win32::Foundation::WAIT_OBJECT_0 {
            return Err(io::Error::last_os_error());
        }
        self.try_wait()?.ok_or_else(io::Error::last_os_error)
    }
}

#[cfg(windows)]
fn spawn_suspended_in_job(
    executable: &Path,
    arguments: &[OsString],
    working_directory: &Path,
) -> Result<
    (
        WindowsChild,
        Option<std::fs::File>,
        Option<std::fs::File>,
        JobObject,
        Vec<StartupTiming>,
    ),
    EngineError,
> {
    use std::ffi::c_void;
    use std::os::windows::ffi::OsStrExt;
    use std::os::windows::io::{AsRawHandle, FromRawHandle, OwnedHandle};
    use windows_sys::Win32::Foundation::{SetHandleInformation, HANDLE, HANDLE_FLAG_INHERIT};
    use windows_sys::Win32::Security::SECURITY_ATTRIBUTES;
    use windows_sys::Win32::System::Pipes::CreatePipe;
    use windows_sys::Win32::System::Threading::{
        CreateProcessW, DeleteProcThreadAttributeList, InitializeProcThreadAttributeList,
        ResumeThread, UpdateProcThreadAttribute, PROCESS_INFORMATION,
        PROC_THREAD_ATTRIBUTE_HANDLE_LIST, STARTF_USESTDHANDLES, STARTUPINFOEXW,
    };
    let error = || EngineError {
        kind: EngineErrorKind::SpawnFailed,
        message: "The process could not be created and assigned safely".into(),
    };
    unsafe fn pipe() -> io::Result<(OwnedHandle, OwnedHandle)> {
        let mut read = std::ptr::null_mut();
        let mut write = std::ptr::null_mut();
        let mut attrs = SECURITY_ATTRIBUTES {
            nLength: std::mem::size_of::<SECURITY_ATTRIBUTES>() as u32,
            lpSecurityDescriptor: std::ptr::null_mut(),
            bInheritHandle: 1,
        };
        if CreatePipe(&mut read, &mut write, &mut attrs, 0) == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok((
            OwnedHandle::from_raw_handle(read as _),
            OwnedHandle::from_raw_handle(write as _),
        ))
    }
    let job = JobObject::create().map_err(|_| error())?;
    let (child_stdin, parent_stdin) = unsafe { pipe().map_err(|_| error())? };
    let (parent_stdout, child_stdout) = unsafe { pipe().map_err(|_| error())? };
    let (parent_stderr, child_stderr) = unsafe { pipe().map_err(|_| error())? };
    unsafe {
        for handle in [&parent_stdin, &parent_stdout, &parent_stderr] {
            if SetHandleInformation(handle.as_raw_handle() as HANDLE, HANDLE_FLAG_INHERIT, 0) == 0 {
                return Err(error());
            }
        }
    }
    let mut startup: STARTUPINFOEXW = unsafe { std::mem::zeroed() };
    startup.StartupInfo.cb = std::mem::size_of::<STARTUPINFOEXW>() as u32;
    startup.StartupInfo.dwFlags = STARTF_USESTDHANDLES;
    startup.StartupInfo.hStdInput = child_stdin.as_raw_handle() as HANDLE;
    startup.StartupInfo.hStdOutput = child_stdout.as_raw_handle() as HANDLE;
    startup.StartupInfo.hStdError = child_stderr.as_raw_handle() as HANDLE;
    let inherited = [
        startup.StartupInfo.hStdInput,
        startup.StartupInfo.hStdOutput,
        startup.StartupInfo.hStdError,
    ];
    let mut attr_size = 0usize;
    unsafe {
        InitializeProcThreadAttributeList(std::ptr::null_mut(), 1, 0, &mut attr_size);
    }
    if attr_size == 0 {
        return Err(error());
    }
    let mut attr_storage = vec![0usize; attr_size.div_ceil(std::mem::size_of::<usize>())];
    let attrs = attr_storage.as_mut_ptr()
        as windows_sys::Win32::System::Threading::LPPROC_THREAD_ATTRIBUTE_LIST;
    if unsafe { InitializeProcThreadAttributeList(attrs, 1, 0, &mut attr_size) } == 0 {
        return Err(error());
    }
    struct AttributeList(
        windows_sys::Win32::System::Threading::LPPROC_THREAD_ATTRIBUTE_LIST,
        Vec<usize>,
    );
    impl Drop for AttributeList {
        fn drop(&mut self) {
            unsafe {
                DeleteProcThreadAttributeList(self.0);
            }
            let _ = &self.1;
        }
    }
    let attrs = AttributeList(attrs, attr_storage);
    startup.lpAttributeList = attrs.0;
    if unsafe {
        UpdateProcThreadAttribute(
            attrs.0,
            0,
            PROC_THREAD_ATTRIBUTE_HANDLE_LIST as usize,
            inherited.as_ptr() as *const c_void,
            std::mem::size_of_val(&inherited),
            std::ptr::null_mut(),
            std::ptr::null(),
        )
    } == 0
    {
        return Err(error());
    }
    let mut info: PROCESS_INFORMATION = unsafe { std::mem::zeroed() };
    let mut command = quote_windows_arg(executable.as_os_str());
    for arg in arguments {
        if arg.encode_wide().any(|unit| unit == 0) {
            return Err(error());
        }
        command.push(b' ' as u16);
        command.extend(quote_windows_arg(arg));
    }
    command.push(0);
    let app: Vec<u16> = executable
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let cwd: Vec<u16> = working_directory
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let env: [u16; 2] = [0, 0];
    let create_started = Instant::now();
    let created = unsafe {
        CreateProcessW(
            app.as_ptr(),
            command.as_mut_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            1,
            windows_creation_flags(),
            env.as_ptr() as *const c_void,
            cwd.as_ptr(),
            &startup as *const STARTUPINFOEXW
                as *const windows_sys::Win32::System::Threading::STARTUPINFOW,
            &mut info,
        )
    };
    let creation_error = if created == 0 {
        unsafe { windows_sys::Win32::Foundation::GetLastError() }
    } else {
        0
    };
    // Closing the parent's child-side pipe copies is essential for EOF.
    drop(child_stdin);
    drop(child_stdout);
    drop(child_stderr);
    if created == 0 {
        let code = creation_error;
        return Err(classify_windows_creation_error(code));
    }
    let mut startup_timings = vec![StartupTiming {
        stage: "ProcessCreation".into(),
        elapsed_ms: create_started.elapsed().as_millis().min(u64::MAX as u128) as u64,
    }];
    if info.hProcess.is_null() || info.hThread.is_null() {
        unsafe {
            if !info.hProcess.is_null() {
                windows_sys::Win32::System::Threading::TerminateProcess(info.hProcess, 1);
                windows_sys::Win32::System::Threading::WaitForSingleObject(info.hProcess, u32::MAX);
                windows_sys::Win32::Foundation::CloseHandle(info.hProcess);
            } else if info.dwProcessId != 0 {
                let process = windows_sys::Win32::System::Threading::OpenProcess(
                    windows_sys::Win32::System::Threading::PROCESS_TERMINATE | 0x0010_0000, // SYNCHRONIZE
                    0,
                    info.dwProcessId,
                );
                if !process.is_null() {
                    windows_sys::Win32::System::Threading::TerminateProcess(process, 1);
                    windows_sys::Win32::System::Threading::WaitForSingleObject(process, u32::MAX);
                    windows_sys::Win32::Foundation::CloseHandle(process);
                }
            }
            if !info.hThread.is_null() {
                windows_sys::Win32::Foundation::CloseHandle(info.hThread);
            }
        }
        return Err(error());
    }
    let process = unsafe { OwnedHandle::from_raw_handle(info.hProcess as _) };
    let thread = unsafe { OwnedHandle::from_raw_handle(info.hThread as _) };
    let job_started = Instant::now();
    if unsafe { job.assign(info.hProcess) }.is_err() {
        unsafe {
            windows_sys::Win32::System::Threading::TerminateProcess(info.hProcess, 1);
            windows_sys::Win32::System::Threading::WaitForSingleObject(info.hProcess, u32::MAX);
        }
        drop(thread);
        drop(process);
        return Err(error());
    }
    startup_timings.push(StartupTiming {
        stage: "JobAssignment".into(),
        elapsed_ms: job_started.elapsed().as_millis().min(u64::MAX as u128) as u64,
    });
    let resume_started = Instant::now();
    if unsafe { ResumeThread(info.hThread) } == u32::MAX {
        unsafe {
            windows_sys::Win32::System::Threading::TerminateProcess(info.hProcess, 1);
            windows_sys::Win32::System::Threading::WaitForSingleObject(info.hProcess, u32::MAX);
        }
        drop(thread);
        drop(process);
        return Err(error());
    }
    startup_timings.push(StartupTiming {
        stage: "ProcessResume".into(),
        elapsed_ms: resume_started.elapsed().as_millis().min(u64::MAX as u128) as u64,
    });
    drop(thread);
    let child = WindowsChild {
        process,
        stdin: Some(std::fs::File::from(parent_stdin)),
        pid: info.dwProcessId,
        status: None,
    };
    let stdout = Some(std::fs::File::from(parent_stdout));
    let stderr = Some(std::fs::File::from(parent_stderr));
    Ok((child, stdout, stderr, job, startup_timings))
}

#[cfg(windows)]
fn windows_creation_flags() -> u32 {
    use windows_sys::Win32::System::Threading::{
        CREATE_NO_WINDOW, CREATE_SUSPENDED, CREATE_UNICODE_ENVIRONMENT,
        EXTENDED_STARTUPINFO_PRESENT,
    };
    CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT | EXTENDED_STARTUPINFO_PRESENT | CREATE_NO_WINDOW
}

#[cfg(windows)]
fn quote_windows_arg(arg: &std::ffi::OsStr) -> Vec<u16> {
    use std::os::windows::ffi::OsStrExt;
    let value: Vec<u16> = arg.encode_wide().collect();
    if !value.is_empty()
        && !value
            .iter()
            .any(|&c| c == b' ' as u16 || c == b'\t' as u16 || c == b'"' as u16)
    {
        return value;
    }
    let mut out = vec![b'"' as u16];
    let mut slashes = 0;
    for ch in value {
        if ch == b'\\' as u16 {
            slashes += 1;
        } else if ch == b'"' as u16 {
            out.extend(std::iter::repeat(b'\\' as u16).take(slashes * 2 + 1));
            out.push(b'"' as u16);
            slashes = 0;
        } else {
            out.extend(std::iter::repeat(b'\\' as u16).take(slashes));
            slashes = 0;
            out.push(ch);
        }
    }
    out.extend(std::iter::repeat(b'\\' as u16).take(slashes * 2));
    out.push(b'"' as u16);
    out
}

#[cfg(windows)]
struct JobObject(windows_sys::Win32::Foundation::HANDLE);

// The job handle is an owned kernel handle; moving it between supervisor threads is safe.
#[cfg(windows)]
unsafe impl Send for JobObject {}

#[cfg(windows)]
impl JobObject {
    fn create() -> Result<Self, ()> {
        use std::mem::{size_of, zeroed};
        use windows_sys::Win32::Foundation::{CloseHandle, GetLastError};
        use windows_sys::Win32::System::JobObjects::{
            CreateJobObjectW, JobObjectExtendedLimitInformation, SetInformationJobObject,
            JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
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
            Ok(Self(job))
        }
    }

    unsafe fn assign(&self, process: windows_sys::Win32::Foundation::HANDLE) -> Result<(), ()> {
        if windows_sys::Win32::System::JobObjects::AssignProcessToJobObject(self.0, process) == 0 {
            Err(())
        } else {
            Ok(())
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
    use std::time::Duration;

    #[cfg(windows)]
    #[test]
    fn windows_launch_keeps_suspended_job_safe_flags_and_suppresses_console() {
        use windows_sys::Win32::System::Threading::{
            CREATE_NO_WINDOW, CREATE_SUSPENDED, EXTENDED_STARTUPINFO_PRESENT,
        };
        let flags = super::windows_creation_flags();
        assert_ne!(flags & CREATE_NO_WINDOW, 0);
        assert_ne!(flags & CREATE_SUSPENDED, 0);
        assert_ne!(flags & EXTENDED_STARTUPINFO_PRESENT, 0);
    }

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

    #[test]
    #[ignore]
    fn fixture_descendant_entrypoint() {
        loop {
            std::thread::sleep(Duration::from_secs(1));
        }
    }

    #[cfg(windows)]
    #[test]
    #[ignore]
    fn fixture_parent_with_descendant_entrypoint() {
        use std::io::{Read, Write};
        use std::process::{Command, Stdio};
        let descendant = Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "mining::process::tests::fixture_descendant_entrypoint",
                "--nocapture",
                "--ignored",
            ])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        use windows_sys::Win32::System::JobObjects::IsProcessInJob;
        use windows_sys::Win32::System::Threading::{
            GetCurrentProcess, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION,
        };
        let mut parent_in_job = 0;
        let mut descendant_in_job = 0;
        unsafe {
            assert_ne!(
                IsProcessInJob(
                    GetCurrentProcess(),
                    std::ptr::null_mut(),
                    &mut parent_in_job
                ),
                0
            );
            let process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, descendant.id());
            assert!(!process.is_null());
            assert_ne!(
                IsProcessInJob(process, std::ptr::null_mut(), &mut descendant_in_job),
                0
            );
            windows_sys::Win32::Foundation::CloseHandle(process);
        }
        println!(
            "DESCENDANT_PID={};PARENT_IN_JOB={};DESCENDANT_IN_JOB={}",
            descendant.id(),
            parent_in_job,
            descendant_in_job
        );
        let _ = io::stdout().flush();
        let mut buffer = [0; 1];
        let _ = io::stdin().read(&mut buffer);
        std::mem::forget(descendant); // Job Object, not Rust Drop, owns its lifetime.
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
                |child: &mut SupervisedChild| {
                    child.close_stdin();
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
    #[test]
    fn closing_supervisor_handle_reaps_parent_and_descendant() {
        let executable = std::env::current_exe().unwrap();
        let mut child = SupervisedChild::spawn(
            &executable,
            &[
                "--exact".into(),
                "mining::process::tests::fixture_parent_with_descendant_entrypoint".into(),
                "--nocapture".into(),
                "--ignored".into(),
            ],
            &std::env::current_dir().unwrap(),
            RedactionSecrets::new([]),
        )
        .unwrap();
        let parent_pid = child.id();
        let deadline = std::time::Instant::now() + Duration::from_secs(3);
        let descendant_pid = loop {
            if let Some((pid, parent_owned, descendant_owned)) =
                child.diagnostics().iter().find_map(|line| {
                    let mut fields = line.message.split(';');
                    let pid = fields
                        .next()?
                        .strip_prefix("DESCENDANT_PID=")?
                        .parse::<u32>()
                        .ok()?;
                    let parent_owned = fields.next()? == "PARENT_IN_JOB=1";
                    let descendant_owned = fields.next()? == "DESCENDANT_IN_JOB=1";
                    Some((pid, parent_owned, descendant_owned))
                })
            {
                assert!(
                    parent_owned && descendant_owned,
                    "parent and descendant must inherit Job Object ownership"
                );
                break pid;
            }
            assert!(
                std::time::Instant::now() < deadline,
                "fixture did not report descendant PID"
            );
            std::thread::sleep(Duration::from_millis(10));
        };
        assert!(windows_process_is_running(parent_pid));
        assert!(windows_process_is_running(descendant_pid));
        drop(child.job.take()); // Equivalent to abrupt owner loss: kill-on-close is kernel enforced.
        let _ = child.child.wait();
        assert!(!windows_process_is_running(parent_pid));
        let deadline = std::time::Instant::now() + Duration::from_secs(3);
        while windows_process_is_running(descendant_pid) && std::time::Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(10));
        }
        assert!(!windows_process_is_running(descendant_pid));
    }

    #[cfg(windows)]
    #[test]
    fn graceful_parent_exit_closes_job_and_reaps_descendant() {
        let executable = std::env::current_exe().unwrap();
        let mut child = SupervisedChild::spawn(
            &executable,
            &[
                "--exact".into(),
                "mining::process::tests::fixture_parent_with_descendant_entrypoint".into(),
                "--nocapture".into(),
                "--ignored".into(),
            ],
            &std::env::current_dir().unwrap(),
            RedactionSecrets::new([]),
        )
        .unwrap();
        let parent_pid = child.id();
        let deadline = std::time::Instant::now() + Duration::from_secs(3);
        let descendant_pid = loop {
            if let Some((pid, parent_owned, descendant_owned)) =
                child.diagnostics().iter().find_map(|line| {
                    let mut fields = line.message.split(';');
                    let pid = fields
                        .next()?
                        .strip_prefix("DESCENDANT_PID=")?
                        .parse::<u32>()
                        .ok()?;
                    Some((
                        pid,
                        fields.next()? == "PARENT_IN_JOB=1",
                        fields.next()? == "DESCENDANT_IN_JOB=1",
                    ))
                })
            {
                assert!(parent_owned && descendant_owned);
                break pid;
            }
            assert!(
                std::time::Instant::now() < deadline,
                "fixture did not report descendant PID"
            );
            std::thread::sleep(Duration::from_millis(10));
        };
        assert!(windows_process_is_running(parent_pid));
        assert!(windows_process_is_running(descendant_pid));

        let status = child
            .stop_with(
                |child| {
                    child.close_stdin();
                    Ok(())
                },
                Duration::from_secs(2),
            )
            .expect("graceful parent exit should close its Job Object");
        assert!(status.success());
        assert!(!windows_process_is_running(parent_pid));
        let deadline = std::time::Instant::now() + Duration::from_secs(3);
        while windows_process_is_running(descendant_pid) && std::time::Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(10));
        }
        assert!(!windows_process_is_running(descendant_pid));
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

    #[test]
    fn windows_creation_errors_are_classified_without_product_attribution() {
        let denied = super::classify_windows_creation_error(5);
        assert_eq!(
            denied.kind,
            crate::mining::domain::EngineErrorKind::SecurityBlocked
        );
        assert!(denied.message.contains("Windows prevented"));
        assert!(!denied.message.contains("Defender"));
        let missing = super::classify_windows_creation_error(2);
        assert_eq!(
            missing.kind,
            crate::mining::domain::EngineErrorKind::ArtifactUnavailable
        );
        assert!(missing.message.contains("may have removed it"));
        let other = super::classify_windows_creation_error(1234);
        assert_eq!(
            other.kind,
            crate::mining::domain::EngineErrorKind::SpawnFailed
        );
        assert!(other.message.contains("1234"));
    }

    #[cfg(windows)]
    #[test]
    fn missing_executable_has_a_safe_windows_specific_error_category() {
        let missing =
            std::env::temp_dir().join(format!("ember-missing-{}.exe", std::process::id()));
        let error = match SupervisedChild::spawn(
            &missing,
            &[],
            &std::env::current_dir().unwrap(),
            RedactionSecrets::new([]),
        ) {
            Ok(_) => panic!("missing executable started"),
            Err(error) => error,
        };
        assert_eq!(
            error.kind,
            crate::mining::domain::EngineErrorKind::ArtifactUnavailable
        );
        assert!(error.message.contains("no longer available"));
    }
}
