use super::diagnostics::RedactionSecrets;
use super::domain::{
    EngineArtifact, EngineAvailability, EngineError, EngineErrorKind, EngineLifecycleState,
    EngineStatus, LifecycleMachine, MiningTelemetry, StartupStage, StartupTiming, StopReason,
    ValidatedMiningConfig,
};
use super::process::SupervisedChild;
use super::xmrig::ApiClientError;
use std::ffi::OsString;
use std::io;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

const STOP_GRACE: Duration = Duration::from_secs(2);
const MAX_STARTUP_TIMINGS: usize = 64;
#[cfg(not(test))]
const READINESS_ATTEMPTS: usize = 120;
#[cfg(test)]
const READINESS_ATTEMPTS: usize = 20;
#[cfg(not(test))]
const READINESS_INTERVAL: Duration = Duration::from_millis(500);
#[cfg(test)]
const READINESS_INTERVAL: Duration = Duration::from_millis(5);

struct SupervisorInner {
    lifecycle: LifecycleMachine,
    availability: EngineAvailability,
    process: Option<SupervisedChild>,
    telemetry: Option<MiningTelemetry>,
    error: Option<EngineError>,
    diagnostics: Vec<super::domain::DiagnosticSummary>,
    shutting_down: bool,
    startup_stage: Option<StartupStage>,
    startup_started: Option<Instant>,
    startup_stage_started: Option<Instant>,
    startup_timings: Vec<StartupTiming>,
}

pub struct EngineSupervisor {
    inner: Mutex<SupervisorInner>,
    operation: Mutex<()>,
    cancel_startup: AtomicBool,
}

impl Default for EngineSupervisor {
    fn default() -> Self {
        Self::new()
    }
}

impl EngineSupervisor {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(SupervisorInner {
                lifecycle: LifecycleMachine::new(EngineLifecycleState::NotConfigured),
                availability: EngineAvailability::Unavailable,
                process: None,
                telemetry: None,
                error: None,
                diagnostics: Vec::new(),
                shutting_down: false,
                startup_stage: None,
                startup_started: None,
                startup_stage_started: None,
                startup_timings: Vec::new(),
            }),
            operation: Mutex::new(()),
            cancel_startup: AtomicBool::new(false),
        }
    }

    pub fn status(&self) -> EngineStatus {
        self.inner
            .lock()
            .map(|inner| EngineStatus {
                availability: inner.availability.clone(),
                state: inner.lifecycle.state(),
                process_id: inner.process.as_ref().map(SupervisedChild::id),
                error: inner.error.clone(),
                diagnostics: inner.diagnostics.clone(),
                startup_stage: inner.startup_stage,
                startup_elapsed_ms: inner
                    .startup_started
                    .map(|at| at.elapsed().as_millis().min(u64::MAX as u128) as u64),
                startup_timings: inner.startup_timings.clone(),
            })
            .unwrap_or_else(|_| EngineStatus {
                availability: EngineAvailability::Unavailable,
                state: EngineLifecycleState::Error,
                process_id: None,
                error: Some(EngineError {
                    kind: EngineErrorKind::Internal,
                    message: "Mining supervisor state is unavailable".into(),
                }),
                diagnostics: Vec::new(),
                startup_stage: None,
                startup_elapsed_ms: None,
                startup_timings: Vec::new(),
            })
    }

    pub fn begin_startup(&self, stage: StartupStage) {
        self.cancel_startup.store(false, Ordering::Release);
        if let Ok(mut inner) = self.inner.lock() {
            let now = Instant::now();
            inner.startup_stage = Some(stage);
            inner.startup_started = Some(now);
            inner.startup_stage_started = Some(now);
            inner.startup_timings.clear();
        }
    }

    pub fn cancel_startup(&self) {
        self.cancel_startup.store(true, Ordering::Release);
    }

    pub fn set_startup_stage(&self, stage: StartupStage) {
        if let Ok(mut inner) = self.inner.lock() {
            if inner.startup_stage == Some(stage) {
                return;
            }
            let now = Instant::now();
            if let (Some(previous), Some(started)) =
                (inner.startup_stage, inner.startup_stage_started)
            {
                inner.startup_timings.push(StartupTiming {
                    stage: format!("{:?}", previous),
                    elapsed_ms: started.elapsed().as_millis().min(u64::MAX as u128) as u64,
                });
                if inner.startup_timings.len() > MAX_STARTUP_TIMINGS {
                    inner.startup_timings.remove(0);
                }
            }
            inner.startup_stage = Some(stage);
            inner.startup_stage_started = Some(now);
        }
    }

    pub fn finish_startup(&self) {
        if let Ok(mut inner) = self.inner.lock() {
            if let (Some(stage), Some(started)) = (inner.startup_stage, inner.startup_stage_started)
            {
                inner.startup_timings.push(StartupTiming {
                    stage: format!("{:?}", stage),
                    elapsed_ms: started.elapsed().as_millis().min(u64::MAX as u128) as u64,
                });
                if inner.startup_timings.len() > MAX_STARTUP_TIMINGS {
                    inner.startup_timings.remove(0);
                }
            }
            inner.startup_stage = None;
            inner.startup_stage_started = None;
            inner.startup_started = None;
        }
    }

    pub fn record_startup_timings(&self, timings: &[StartupTiming]) {
        if let Ok(mut inner) = self.inner.lock() {
            inner.startup_timings.extend_from_slice(timings);
            if inner.startup_timings.len() > MAX_STARTUP_TIMINGS {
                let excess = inner.startup_timings.len() - MAX_STARTUP_TIMINGS;
                inner.startup_timings.drain(0..excess);
            }
        }
    }

    fn record_startup_milestone(&self, name: &str) {
        if let Ok(mut inner) = self.inner.lock() {
            if let Some(started) = inner.startup_started {
                inner.startup_timings.push(StartupTiming {
                    stage: name.to_owned(),
                    elapsed_ms: started.elapsed().as_millis().min(u64::MAX as u128) as u64,
                });
                if inner.startup_timings.len() > MAX_STARTUP_TIMINGS {
                    inner.startup_timings.remove(0);
                }
            }
        }
    }

    pub fn record_startup_duration(&self, name: &str, elapsed_ms: u64) {
        if let Ok(mut inner) = self.inner.lock() {
            inner.startup_timings.push(StartupTiming {
                stage: name.to_owned(),
                elapsed_ms,
            });
            if inner.startup_timings.len() > MAX_STARTUP_TIMINGS {
                inner.startup_timings.remove(0);
            }
        }
    }

    pub fn telemetry(&self) -> Option<MiningTelemetry> {
        self.inner
            .lock()
            .ok()
            .and_then(|inner| inner.telemetry.clone())
    }

    pub fn update_telemetry(&self, telemetry: MiningTelemetry) {
        if let Ok(mut inner) = self.inner.lock() {
            if inner.lifecycle.state() == EngineLifecycleState::Mining {
                inner.telemetry = Some(telemetry);
            }
        }
    }

    pub fn configure_ready(
        &self,
        artifact: &EngineArtifact,
        config: &ValidatedMiningConfig,
    ) -> Result<(), EngineError> {
        if !artifact.is_verified()
            || artifact.engine_name() != "XMRig"
            || artifact.version() != config.engine_version
        {
            return self.fail(EngineError {
                kind: EngineErrorKind::UntrustedArtifact,
                message:
                    "A verified, version-matched XMRig artifact and configuration are required"
                        .into(),
            });
        }
        let mut inner = self.inner.lock().map_err(|_| lock_error())?;
        if inner.process.is_some() {
            return Err(EngineError {
                kind: EngineErrorKind::InvalidTransition,
                message: "Cannot reconfigure while an owned process exists".into(),
            });
        }
        inner.lifecycle.transition(EngineLifecycleState::Ready)?;
        inner.availability = EngineAvailability::Available(artifact.version().to_owned());
        inner.error = None;
        inner.diagnostics.clear();
        Ok(())
    }

    pub fn start_with<S, P>(
        &self,
        artifact: &EngineArtifact,
        config: &ValidatedMiningConfig,
        executable: &Path,
        arguments: &[OsString],
        working_directory: &Path,
        redaction: RedactionSecrets,
        mut spawn: S,
        mut poll_api: P,
    ) -> Result<(), EngineError>
    where
        S: FnMut(
            &Path,
            &[OsString],
            &Path,
            RedactionSecrets,
        ) -> Result<SupervisedChild, EngineError>,
        P: FnMut() -> Result<MiningTelemetry, ApiClientError>,
    {
        let _operation = self.operation.lock().map_err(|_| lock_error())?;
        if artifact.engine_name() != "XMRig" || !artifact.is_verified() {
            return self.fail(EngineError {
                kind: EngineErrorKind::UntrustedArtifact,
                message: "A verified XMRig artifact is required before start".into(),
            });
        }
        if artifact.installed_path() != executable {
            return self.fail(EngineError {
                kind: EngineErrorKind::UntrustedArtifact,
                message: "Requested executable does not match verified artifact metadata".into(),
            });
        }
        if config.engine_version != artifact.version() {
            return self.fail(EngineError {
                kind: EngineErrorKind::InvalidConfiguration,
                message: "Validated configuration version does not match the verified engine"
                    .into(),
            });
        }

        {
            let mut inner = self.inner.lock().map_err(|_| lock_error())?;
            if inner.process.is_some()
                || inner.shutting_down
                || !matches!(
                    inner.lifecycle.state(),
                    EngineLifecycleState::Ready | EngineLifecycleState::Stopped
                )
            {
                return Err(EngineError {
                    kind: EngineErrorKind::InvalidTransition,
                    message: "Engine is not in a startable state".into(),
                });
            }
            inner.lifecycle.transition(EngineLifecycleState::Starting)?;
            inner.availability = EngineAvailability::Available(artifact.version().to_owned());
            inner.telemetry = None;
            inner.error = None;
            inner.diagnostics.clear();
            if inner.startup_started.is_none() {
                inner.startup_started = Some(Instant::now());
            }
        }

        let redaction = redaction.with_values([
            config.config.public_address.clone(),
            config.config.api.access_token.clone(),
            working_directory.to_string_lossy().into_owned(),
            executable.to_string_lossy().into_owned(),
        ]);
        self.set_startup_stage(StartupStage::StartingXmrig);
        let mut child = match spawn(executable, arguments, working_directory, redaction) {
            Ok(child) => child,
            Err(error) => return self.fail(error),
        };
        self.set_startup_stage(StartupStage::WaitingForMiner);
        self.record_startup_timings(child.startup_timings());
        let mut saw_summary = false;
        let mut saw_randomx = false;
        let mut saw_hashrate = false;
        for attempt in 0..READINESS_ATTEMPTS {
            if self.cancel_startup.load(Ordering::Acquire) {
                let _ = child.stop_with(|_| Ok(()), Duration::from_millis(0));
                drop(child);
                return self.fail(EngineError {
                    kind: EngineErrorKind::StartupCancelled,
                    message: "Mining startup was stopped at your request.".into(),
                });
            }
            let child_status = match child.try_wait() {
                Ok(status) => status,
                Err(_) => {
                    let _ = child.stop_with(|_| Ok(()), Duration::from_millis(0));
                    drop(child);
                    return self.fail(EngineError {
                        kind: EngineErrorKind::UnexpectedExit,
                        message: "Could not check whether the engine exited during startup".into(),
                    });
                }
            };
            if let Some(exit) = child_status {
                let safe_exit = format!(
                    "The mining engine stopped before Ember could connect to it (exit code {:?}).",
                    exit.code()
                );
                let diagnostics = child.diagnostics();
                drop(child);
                let error = EngineError {
                    kind: EngineErrorKind::UnexpectedExit,
                    message: safe_exit,
                };
                self.fail::<()>(error.clone())?;
                self.set_diagnostics(diagnostics);
                return Err(error);
            }

            let response = poll_api();
            if let Ok(telemetry) = &response {
                if !saw_summary {
                    self.record_startup_milestone("FirstAuthenticatedSummaryAtMs");
                    saw_summary = true;
                }
                if telemetry
                    .supported_algorithms
                    .iter()
                    .any(|algorithm| algorithm == "rx/0")
                    && !saw_randomx
                {
                    self.record_startup_milestone("RandomXAlgorithmAdvertisedAtMs");
                    saw_randomx = true;
                }
                if telemetry.short_hashrate.is_some_and(|rate| rate > 0.0) && !saw_hashrate {
                    self.record_startup_milestone("FirstPositiveHashrateAtMs");
                    saw_hashrate = true;
                }
            }
            match response {
                Ok(telemetry)
                    if telemetry.engine_version.as_deref() == Some(artifact.version())
                        && super::xmrig::XmrigAdapter::is_ready_to_mine(&telemetry) =>
                {
                    self.record_startup_milestone("MiningReadinessAtMs");
                    let mut inner = self.inner.lock().map_err(|_| lock_error())?;
                    inner.lifecycle.transition(EngineLifecycleState::Mining)?;
                    inner.telemetry = Some(telemetry);
                    inner.process = Some(child);
                    if let (Some(stage), Some(started)) =
                        (inner.startup_stage, inner.startup_stage_started)
                    {
                        inner.startup_timings.push(StartupTiming {
                            stage: format!("{:?}", stage),
                            elapsed_ms: started.elapsed().as_millis().min(u64::MAX as u128) as u64,
                        });
                    }
                    inner.startup_stage = None;
                    inner.startup_started = None;
                    inner.startup_stage_started = None;
                    return Ok(());
                }
                Ok(telemetry)
                    if telemetry.engine_version.as_deref() != Some(artifact.version()) =>
                {
                    drop(child);
                    return self.fail(EngineError {
                        kind: EngineErrorKind::ApiRejected,
                        message: "Local API engine identity did not match the verified artifact"
                            .into(),
                    });
                }
                Ok(_) => self.set_startup_stage(StartupStage::WaitingForMiner),
                Err(error) => {
                    if matches!(
                        error,
                        ApiClientError::UnexpectedVersion | ApiClientError::Unauthorized
                    ) {
                        drop(child);
                        return self.fail(EngineError {
                            kind: EngineErrorKind::ApiRejected,
                            message: "Local API identity or access policy was rejected".into(),
                        });
                    }
                    let _ = error;
                }
            }
            if attempt + 1 < READINESS_ATTEMPTS {
                thread::sleep(READINESS_INTERVAL);
            }
        }

        let diagnostics = child.diagnostics();
        let _ = child.stop_with(|_| Ok(()), Duration::from_millis(100));
        let final_diagnostics = child.diagnostics();
        drop(child);
        {
            let mut inner = self.inner.lock().map_err(|_| lock_error())?;
            inner.lifecycle.transition(EngineLifecycleState::Error)?;
            inner.error = Some(EngineError {
                kind: EngineErrorKind::ApiUnavailable,
                message: "Local API was not ready before the deadline".into(),
            });
            if let (Some(stage), Some(started)) = (inner.startup_stage, inner.startup_stage_started)
            {
                inner.startup_timings.push(StartupTiming {
                    stage: format!("{:?}", stage),
                    elapsed_ms: started.elapsed().as_millis().min(u64::MAX as u128) as u64,
                });
            }
            inner.startup_stage = None;
            inner.startup_started = None;
            inner.startup_stage_started = None;
            inner.diagnostics = if final_diagnostics.is_empty() {
                diagnostics
            } else {
                final_diagnostics
            };
        }
        Err(EngineError {
            kind: EngineErrorKind::ApiUnavailable,
            message: "Local API readiness timed out; the owned process was stopped".into(),
        })
    }

    pub fn poll_unexpected_exit(&self) -> Result<Option<i32>, EngineError> {
        let mut inner = self.inner.lock().map_err(|_| lock_error())?;
        let Some(child) = inner.process.as_mut() else {
            return Ok(None);
        };
        let Some(status) = child.try_wait().map_err(|_| EngineError {
            kind: EngineErrorKind::Internal,
            message: "Could not inspect the owned engine process".into(),
        })?
        else {
            return Ok(None);
        };
        let code = status.code();
        let diagnostics = child.diagnostics();
        inner.process.take();
        inner.lifecycle.transition(EngineLifecycleState::Error)?;
        inner.error = Some(EngineError {
            kind: EngineErrorKind::UnexpectedExit,
            message: format!(
                "Engine exited unexpectedly (code {code:?}); no restart was attempted"
            ),
        });
        inner.diagnostics = diagnostics;
        inner.telemetry = None;
        Ok(code)
    }

    pub fn stop_with<F>(&self, _reason: StopReason, graceful: F) -> Result<(), EngineError>
    where
        F: FnOnce(&mut SupervisedChild) -> io::Result<()>,
    {
        let _operation = self.operation.lock().map_err(|_| lock_error())?;
        self.stop_owned_process(graceful)
    }

    fn stop_owned_process<F>(&self, graceful: F) -> Result<(), EngineError>
    where
        F: FnOnce(&mut SupervisedChild) -> io::Result<()>,
    {
        let mut inner = self.inner.lock().map_err(|_| lock_error())?;
        if inner.process.is_none() {
            return Ok(()); // Explicitly idempotent when this supervisor owns no process.
        }
        match inner.lifecycle.state() {
            EngineLifecycleState::Mining | EngineLifecycleState::Paused => {
                inner.lifecycle.transition(EngineLifecycleState::Stopping)?;
            }
            EngineLifecycleState::Starting | EngineLifecycleState::Stopping => {}
            _ => {
                return Err(EngineError {
                    kind: EngineErrorKind::InvalidTransition,
                    message: "Engine state cannot be stopped through this path".into(),
                })
            }
        }

        let mut process = inner.process.take().expect("checked owned process");
        match process.stop_with(graceful, STOP_GRACE) {
            Ok(_) => {
                inner.lifecycle.transition(EngineLifecycleState::Stopped)?;
                inner.telemetry = None;
                inner.error = None;
                inner.diagnostics = process.diagnostics();
                Ok(())
            }
            Err(error) => {
                inner.lifecycle.transition(EngineLifecycleState::Error)?;
                inner.error = Some(error.clone());
                Err(error)
            }
        }
    }

    pub fn stop_for_application_quit(&self) -> Result<(), EngineError> {
        let _operation = self.operation.lock().map_err(|_| lock_error())?;
        self.inner.lock().map_err(|_| lock_error())?.shutting_down = true;
        self.stop_owned_process(|_| Ok(()))
    }

    fn fail<T>(&self, error: EngineError) -> Result<T, EngineError> {
        if let Ok(mut inner) = self.inner.lock() {
            let state = inner.lifecycle.state();
            if state != EngineLifecycleState::Error {
                let _ = inner.lifecycle.transition(EngineLifecycleState::Error);
            }
            inner.error = Some(error.clone());
            inner.telemetry = None;
            inner.startup_stage = None;
            inner.startup_started = None;
            inner.startup_stage_started = None;
        }
        Err(error)
    }

    fn set_diagnostics(&self, diagnostics: Vec<super::domain::DiagnosticSummary>) {
        if let Ok(mut inner) = self.inner.lock() {
            inner.diagnostics = diagnostics;
        }
    }
}

fn lock_error() -> EngineError {
    EngineError {
        kind: EngineErrorKind::Internal,
        message: "Mining supervisor state is unavailable".into(),
    }
}

#[cfg(test)]
mod tests {
    use super::EngineSupervisor;
    use crate::mining::config::tests::fixture_config;
    use crate::mining::diagnostics::RedactionSecrets;
    use crate::mining::domain::{
        EngineArtifact, EngineErrorKind, EngineLifecycleState, MiningTelemetry, StartupStage,
        StopReason,
    };
    use crate::mining::process::SupervisedChild;
    use std::ffi::OsString;
    use std::path::{Path, PathBuf};
    use std::time::Duration;

    fn fixture_artifact(path: PathBuf) -> EngineArtifact {
        EngineArtifact::verified_fixture(
            "XMRig",
            "6.26.0",
            "test-host",
            "fixture://local-only",
            &"b".repeat(64),
            path,
        )
    }

    fn fixture_telemetry(paused: bool) -> MiningTelemetry {
        MiningTelemetry {
            engine_version: Some("6.26.0".into()),
            uptime_seconds: Some(1),
            paused: Some(paused),
            supported_algorithms: vec!["rx/0".into()],
            short_hashrate: (!paused).then_some(1.0),
            medium_hashrate: None,
            long_hashrate: None,
            sample_time_unix_ms: None,
        }
    }

    fn spawn_test_child(
        _path: &Path,
        _args: &[OsString],
        cwd: &Path,
        redaction: RedactionSecrets,
    ) -> Result<SupervisedChild, crate::mining::domain::EngineError> {
        let current = std::env::current_exe().unwrap();
        SupervisedChild::spawn(
            &current,
            &[
                "--exact".into(),
                "mining::process::tests::fixture_process_entrypoint".into(),
                "--nocapture".into(),
                "--ignored".into(),
            ],
            cwd,
            redaction,
        )
    }

    #[test]
    fn startup_requires_verified_artifact_spawn_and_matching_live_api() {
        let path = std::env::current_exe().unwrap();
        let artifact = fixture_artifact(path.clone());
        let config = crate::mining::config::validate(fixture_config(), "6.26.0").unwrap();
        let supervisor = EngineSupervisor::new();
        supervisor.configure_ready(&artifact, &config).unwrap();
        supervisor.begin_startup(StartupStage::CheckingEngine);
        supervisor.set_startup_stage(StartupStage::PreparingSession);
        let mut polls = 0;
        supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                spawn_test_child,
                || {
                    polls += 1;
                    match polls {
                        1 => Err(crate::mining::xmrig::ApiClientError::Unavailable),
                        2 => {
                            let mut initializing = fixture_telemetry(false);
                            initializing.short_hashrate = Some(0.0);
                            Ok(initializing)
                        }
                        _ => Ok(fixture_telemetry(false)),
                    }
                },
            )
            .unwrap();
        assert!(polls >= 2);
        assert_eq!(supervisor.status().state, EngineLifecycleState::Mining);
        assert!(supervisor.status().process_id.is_some());
        assert_eq!(supervisor.telemetry().unwrap().paused, Some(false));
        let timings = supervisor.status().startup_timings;
        let stages = timings
            .iter()
            .map(|timing| timing.stage.as_str())
            .collect::<Vec<_>>();
        let starting = stages
            .iter()
            .position(|stage| *stage == "StartingXmrig")
            .unwrap();
        let waiting = stages
            .iter()
            .position(|stage| *stage == "WaitingForMiner")
            .unwrap();
        assert!(starting < waiting);
        assert!(stages
            .iter()
            .any(|stage| *stage == "FirstAuthenticatedSummaryAtMs"));
        assert!(stages
            .iter()
            .any(|stage| *stage == "RandomXAlgorithmAdvertisedAtMs"));
        assert!(stages
            .iter()
            .any(|stage| *stage == "FirstPositiveHashrateAtMs"));
        assert!(stages.iter().any(|stage| *stage == "MiningReadinessAtMs"));
        assert!(supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                spawn_test_child,
                || Ok(fixture_telemetry(false)),
            )
            .is_err());
        supervisor
            .stop_with(StopReason::UserRequest, |child: &mut SupervisedChild| {
                child.close_stdin();
                Ok(())
            })
            .unwrap();
        assert_eq!(supervisor.status().state, EngineLifecycleState::Stopped);
    }

    #[test]
    fn readiness_timeout_stops_process_and_sets_error_without_retry() {
        let path = std::env::current_exe().unwrap();
        let artifact = fixture_artifact(path.clone());
        let config = crate::mining::config::validate(fixture_config(), "6.26.0").unwrap();
        let supervisor = EngineSupervisor::new();
        supervisor.configure_ready(&artifact, &config).unwrap();
        let error = supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                spawn_test_child,
                || Err(crate::mining::xmrig::ApiClientError::Unavailable),
            )
            .unwrap_err();
        assert_eq!(error.kind, EngineErrorKind::ApiUnavailable);
        assert_eq!(supervisor.status().state, EngineLifecycleState::Error);
        assert!(supervisor.status().process_id.is_none());
        assert!(supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                spawn_test_child,
                || Ok(fixture_telemetry(false)),
            )
            .is_err());
    }

    #[test]
    fn stop_request_cancels_startup_and_reaps_owned_child() {
        let path = std::env::current_exe().unwrap();
        let artifact = fixture_artifact(path.clone());
        let config = crate::mining::config::validate(fixture_config(), "6.26.0").unwrap();
        let supervisor = EngineSupervisor::new();
        supervisor.configure_ready(&artifact, &config).unwrap();
        supervisor.begin_startup(StartupStage::CheckingEngine);
        let error = supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new(["fixture-private-token".into()]),
                spawn_test_child,
                || {
                    supervisor.cancel_startup();
                    Err(crate::mining::xmrig::ApiClientError::Unavailable)
                },
            )
            .unwrap_err();
        assert_eq!(error.kind, EngineErrorKind::StartupCancelled);
        assert!(!error.message.contains("fixture-private-token"));
        assert_eq!(supervisor.status().state, EngineLifecycleState::Error);
        assert!(supervisor.status().process_id.is_none());
    }

    #[test]
    fn immediate_child_exit_is_classified_before_api_readiness() {
        let path = std::env::current_exe().unwrap();
        let artifact = fixture_artifact(path.clone());
        let config = crate::mining::config::validate(fixture_config(), "6.26.0").unwrap();
        let supervisor = EngineSupervisor::new();
        supervisor.configure_ready(&artifact, &config).unwrap();
        let error = supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[
                    "--exact".into(),
                    "mining::process::tests::fixture_exit_entrypoint".into(),
                    "--nocapture".into(),
                    "--ignored".into(),
                ],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                |executable, args, cwd, redaction| {
                    SupervisedChild::spawn(executable, args, cwd, redaction)
                },
                || {
                    std::thread::sleep(Duration::from_millis(200));
                    Err(crate::mining::xmrig::ApiClientError::Unavailable)
                },
            )
            .unwrap_err();
        assert_eq!(error.kind, EngineErrorKind::UnexpectedExit);
        assert!(error.message.contains("stopped before Ember could connect"));
        assert!(supervisor.status().process_id.is_none());
    }

    #[test]
    fn unexpected_exit_is_error_and_never_restarts() {
        let supervisor = EngineSupervisor::new();
        let path = std::env::current_exe().unwrap();
        let artifact = fixture_artifact(path.clone());
        let config = crate::mining::config::validate(fixture_config(), "6.26.0").unwrap();
        supervisor.configure_ready(&artifact, &config).unwrap();
        supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                |_, _, cwd, redaction| {
                    SupervisedChild::spawn(
                        &std::env::current_exe().unwrap(),
                        &[
                            "--exact".into(),
                            "mining::process::tests::fixture_exit_entrypoint".into(),
                            "--nocapture".into(),
                            "--ignored".into(),
                        ],
                        cwd,
                        redaction,
                    )
                },
                || Ok(fixture_telemetry(false)),
            )
            .unwrap();
        assert_eq!(supervisor.status().state, EngineLifecycleState::Mining);
        std::thread::sleep(Duration::from_millis(120));
        assert_eq!(supervisor.poll_unexpected_exit().unwrap(), Some(0));
        assert_eq!(supervisor.status().state, EngineLifecycleState::Error);
        assert_eq!(supervisor.poll_unexpected_exit().unwrap(), None);
    }

    #[test]
    fn stop_without_owned_process_is_idempotent() {
        let supervisor = EngineSupervisor::new();
        supervisor.stop_for_application_quit().unwrap();
        assert_eq!(
            supervisor.status().state,
            EngineLifecycleState::NotConfigured
        );
        let artifact = fixture_artifact(std::env::current_exe().unwrap());
        let config = crate::mining::config::validate(fixture_config(), "6.26.0").unwrap();
        let supervisor = EngineSupervisor::new();
        supervisor.configure_ready(&artifact, &config).unwrap();
        supervisor.stop_for_application_quit().unwrap();
        let started = supervisor.start_with(
            &artifact,
            &config,
            artifact.installed_path(),
            &[],
            &std::env::current_dir().unwrap(),
            RedactionSecrets::new([]),
            spawn_test_child,
            || Ok(fixture_telemetry(false)),
        );
        assert_eq!(
            started.unwrap_err().kind,
            EngineErrorKind::InvalidTransition
        );
    }

    #[test]
    fn application_quit_stops_and_reaps_an_owned_fixture_child() {
        let supervisor = EngineSupervisor::new();
        let executable = std::env::current_exe().unwrap();
        let child = SupervisedChild::spawn(
            &executable,
            &[
                "--exact".into(),
                "mining::process::tests::fixture_process_entrypoint".into(),
                "--nocapture".into(),
                "--ignored".into(),
            ],
            &std::env::current_dir().unwrap(),
            RedactionSecrets::new([]),
        )
        .unwrap();
        let _pid = child.id();
        {
            let mut inner = supervisor.inner.lock().unwrap();
            inner
                .lifecycle
                .transition(EngineLifecycleState::Ready)
                .unwrap();
            inner
                .lifecycle
                .transition(EngineLifecycleState::Starting)
                .unwrap();
            inner
                .lifecycle
                .transition(EngineLifecycleState::Mining)
                .unwrap();
            inner.process = Some(child);
        }

        supervisor.stop_for_application_quit().unwrap();
        assert_eq!(supervisor.status().state, EngineLifecycleState::Stopped);
        assert_eq!(supervisor.status().process_id, None);
        assert!(supervisor.telemetry().is_none());
        assert_eq!(
            supervisor.poll_unexpected_exit().unwrap(),
            None,
            "quit cleanup must take ownership and reap the child"
        );
    }
}
