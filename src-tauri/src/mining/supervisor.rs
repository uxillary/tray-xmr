use super::diagnostics::RedactionSecrets;
use super::domain::{
    EngineArtifact, EngineAvailability, EngineError, EngineErrorKind, EngineLifecycleState,
    EngineStatus, LifecycleMachine, MiningTelemetry, StartupStage, StartupTiming, StopReason,
    TelemetryFreshness, ValidatedMiningConfig,
};
use super::events::{
    EmberEvent, EventLog, EventSessionContext, FailureKind, StopReason as EventStopReason,
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

// The restricted XMRig API is telemetry-only. Stop therefore closes the owned
// Job Object immediately instead of waiting for an unimplemented graceful API.
const STOP_GRACE: Duration = Duration::ZERO;
const MAX_STARTUP_TIMINGS: usize = 64;
const TELEMETRY_STALE_AFTER: Duration = Duration::from_secs(5);
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
    telemetry_received_at: Option<Instant>,
    mining_started_at: Option<Instant>,
    error: Option<EngineError>,
    diagnostics: Vec<super::domain::DiagnosticSummary>,
    shutting_down: bool,
    startup_stage: Option<StartupStage>,
    startup_started: Option<Instant>,
    startup_stage_started: Option<Instant>,
    startup_timings: Vec<StartupTiming>,
    events: EventLog,
}

pub struct EngineSupervisor {
    inner: Mutex<SupervisorInner>,
    operation: Mutex<()>,
    spawn_gate: Mutex<()>,
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
                telemetry_received_at: None,
                mining_started_at: None,
                error: None,
                diagnostics: Vec::new(),
                shutting_down: false,
                startup_stage: None,
                startup_started: None,
                startup_stage_started: None,
                startup_timings: Vec::new(),
                events: EventLog::default(),
            }),
            operation: Mutex::new(()),
            spawn_gate: Mutex::new(()),
            cancel_startup: AtomicBool::new(false),
        }
    }

    pub fn status(&self) -> EngineStatus {
        self.inner
            .lock()
            .map(|inner| {
                let mut diagnostics = inner.diagnostics.clone();
                let capture_health = if let Some(process) = inner.process.as_ref() {
                    diagnostics.extend(process.diagnostics());
                    process.capture_health()
                } else {
                    super::domain::CaptureHealth::default()
                };
                EngineStatus {
                    availability: inner.availability.clone(),
                    state: inner.lifecycle.state(),
                    process_id: inner.process.as_ref().map(SupervisedChild::id),
                    error: inner.error.clone(),
                    diagnostics,
                    capture_health,
                    startup_stage: inner.startup_stage,
                    startup_elapsed_ms: inner
                        .startup_started
                        .map(|at| at.elapsed().as_millis().min(u64::MAX as u128) as u64),
                    startup_timings: inner.startup_timings.clone(),
                }
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
                capture_health: super::domain::CaptureHealth::default(),
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

    pub fn try_begin_startup(&self, stage: StartupStage) -> Result<(), EngineError> {
        let _operation = self.operation.try_lock().map_err(|_| EngineError {
            kind: EngineErrorKind::InvalidTransition,
            message: "The previous mining session is still stopping".into(),
        })?;
        self.begin_startup(stage);
        Ok(())
    }

    pub fn cancel_startup(&self) {
        self.cancel_startup.store(true, Ordering::Release);
    }

    pub fn startup_cancelled(&self) -> bool {
        self.cancel_startup.load(Ordering::Acquire)
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

    pub fn events(&self) -> Vec<EmberEvent> {
        self.inner
            .lock()
            .map(|inner| inner.events.snapshot())
            .unwrap_or_default()
    }

    pub fn telemetry_freshness(&self) -> TelemetryFreshness {
        self.inner
            .lock()
            .ok()
            .map(|inner| match inner.telemetry_received_at {
                None => TelemetryFreshness::Unavailable,
                Some(received_at) if received_at.elapsed() > TELEMETRY_STALE_AFTER => {
                    TelemetryFreshness::Stale
                }
                Some(_) => TelemetryFreshness::Fresh,
            })
            .unwrap_or(TelemetryFreshness::Unavailable)
    }

    pub fn session_duration_seconds(&self) -> Option<u64> {
        self.inner
            .lock()
            .ok()
            .and_then(|inner| inner.mining_started_at)
            .map(|started_at| started_at.elapsed().as_secs())
    }

    pub fn update_telemetry(&self, telemetry: MiningTelemetry) {
        if let Ok(mut inner) = self.inner.lock() {
            if inner.lifecycle.state() == EngineLifecycleState::Mining {
                inner
                    .events
                    .observe(&telemetry, super::events::timestamp_now_ms());
                inner.telemetry = Some(telemetry);
                inner.telemetry_received_at = Some(Instant::now());
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
        event_session: EventSessionContext,
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

        let spawn_gate = self.spawn_gate.lock().map_err(|_| lock_error())?;
        if self.cancel_startup.load(Ordering::Acquire) {
            return Err(start_cancelled_error());
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
            inner
                .events
                .begin_session(event_session, super::events::timestamp_now_ms());
            inner.availability = EngineAvailability::Available(artifact.version().to_owned());
            inner.telemetry = None;
            inner.telemetry_received_at = None;
            inner.mining_started_at = None;
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
        let child = match spawn(executable, arguments, working_directory, redaction) {
            Ok(child) => child,
            Err(error) => return self.fail(error),
        };
        self.set_startup_stage(StartupStage::WaitingForMiner);
        self.record_startup_timings(child.startup_timings());
        {
            let mut inner = self.inner.lock().map_err(|_| lock_error())?;
            inner.process = Some(child);
            inner.diagnostics.push(super::domain::DiagnosticSummary {
                source: super::domain::DiagnosticSource::Supervisor,
                message: format!(
                    "XMRig process created; waiting for authenticated local API readiness at {}:{}",
                    config.config.api.host, config.config.api.port
                ),
            });
        }
        drop(spawn_gate);
        let mut saw_summary = false;
        let mut saw_randomx = false;
        let mut saw_hashrate = false;
        let mut last_paused = None;
        let mut last_hashrate = None;
        let mut last_api_error = None;
        let mut response_observed = false;
        for attempt in 0..READINESS_ATTEMPTS {
            if self.cancel_startup.load(Ordering::Acquire) {
                return self.cancelled_startup_result();
            }
            let child_status = match self
                .inner
                .lock()
                .map_err(|_| lock_error())?
                .process
                .as_mut()
                .expect("starting process is owned")
                .try_wait()
            {
                Ok(status) => status,
                Err(_) => {
                    self.terminate_starting_process("Could not inspect startup process");
                    return self.fail(EngineError {
                        kind: EngineErrorKind::UnexpectedExit,
                        message: "Could not check whether the engine exited during startup".into(),
                    });
                }
            };
            if let Some(exit) = child_status {
                let succeeded = exit.success();
                let safe_exit = format!(
                    "The mining engine stopped before Ember could connect to it (exit code {:?}).",
                    exit.code()
                );
                let mut diagnostics = self.take_starting_process_diagnostics();
                diagnostics.push(super::domain::DiagnosticSummary {
                    source: super::domain::DiagnosticSource::Supervisor,
                    message: format!(
                        "XMRig exited during startup: success={succeeded}, code={:?}",
                        exit.code()
                    ),
                });
                let error = EngineError {
                    kind: EngineErrorKind::UnexpectedExit,
                    message: safe_exit,
                };
                let _ = self.fail::<()>(error.clone());
                self.set_diagnostics(diagnostics);
                return Err(error);
            }

            let response = poll_api();
            if self.cancel_startup.load(Ordering::Acquire) {
                return self.cancelled_startup_result();
            }
            response_observed |= match &response {
                Ok(_) => true,
                Err(error) => matches!(
                    error,
                    ApiClientError::Unauthorized
                        | ApiClientError::InvalidResponse
                        | ApiClientError::UnexpectedVersion
                        | ApiClientError::OversizedResponse
                ),
            };
            if let Ok(telemetry) = &response {
                last_paused = telemetry.paused;
                last_hashrate = telemetry.short_hashrate;
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
                    if self.cancel_startup.load(Ordering::Acquire)
                        || inner.lifecycle.state() != EngineLifecycleState::Starting
                    {
                        let already_stopped =
                            inner.lifecycle.state() == EngineLifecycleState::Stopped;
                        drop(inner);
                        if already_stopped {
                            return Err(start_cancelled_error());
                        }
                        return self.cancelled_startup_result();
                    }
                    inner.lifecycle.transition(EngineLifecycleState::Mining)?;
                    inner
                        .events
                        .mining_started(&telemetry, super::events::timestamp_now_ms());
                    inner.mining_started_at = Some(Instant::now());
                    inner.telemetry = Some(telemetry);
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
                    self.terminate_starting_process("Local API identity did not match");
                    return self.fail(EngineError {
                        kind: EngineErrorKind::ApiRejected,
                        message: "Local API engine identity did not match the verified artifact"
                            .into(),
                    });
                }
                Ok(_) => self.set_startup_stage(StartupStage::WaitingForMiner),
                Err(error) => {
                    last_api_error = Some(error.clone());
                    if matches!(
                        error,
                        ApiClientError::UnexpectedVersion | ApiClientError::Unauthorized
                    ) {
                        self.terminate_starting_process(&format!(
                            "Local API response rejected: {error:?}; Ember terminated the owned XMRig process"
                        ));
                        return self.fail(EngineError {
                            kind: EngineErrorKind::ApiRejected,
                            message: "Local API identity or access policy was rejected".into(),
                        });
                    }
                    let _ = error;
                }
            }
            if attempt % 10 == 0 || response_observed {
                self.record_api_probe(
                    &config.config.api.host,
                    config.config.api.port,
                    attempt + 1,
                    response_observed,
                    last_api_error
                        .as_ref()
                        .map(|error| format!("{error:?}"))
                        .unwrap_or_else(|| "none".into()),
                );
            }
            if attempt + 1 < READINESS_ATTEMPTS {
                thread::sleep(READINESS_INTERVAL);
            }
        }

        let outcome = format!(
            "Readiness deadline: process observed alive at last check=true, API endpoint={}:{}, connection attempts={}, TCP/API response observed={response_observed}, authenticated summary={saw_summary}, expected version/miner kind/restricted policy validated={saw_summary}, rx/0 advertised={saw_randomx}, positive short-window hashrate={saw_hashrate}, last paused={last_paused:?}, last short-window rate={last_hashrate:?}, last API result={last_api_error:?}; Ember terminated the owned XMRig process",
            config.config.api.host,
            config.config.api.port,
            READINESS_ATTEMPTS
        );
        let diagnostics = self.terminate_starting_process(&outcome);
        {
            let mut inner = self.inner.lock().map_err(|_| lock_error())?;
            inner.lifecycle.transition(EngineLifecycleState::Error)?;
            inner
                .events
                .failed(FailureKind::Startup, super::events::timestamp_now_ms());
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
            inner.diagnostics = diagnostics;
        }
        Err(EngineError {
            kind: EngineErrorKind::ApiUnavailable,
            message: "The mining engine started but did not become ready. Ember stopped the owned process. Try Start mining again.".into(),
        })
    }

    fn take_starting_process_diagnostics(&self) -> Vec<super::domain::DiagnosticSummary> {
        let Ok(mut inner) = self.inner.lock() else {
            return Vec::new();
        };
        let Some(child) = inner.process.take() else {
            return inner.diagnostics.clone();
        };
        let mut diagnostics = child.diagnostics();
        drop(child);
        diagnostics.extend(inner.diagnostics.drain(..));
        diagnostics
    }

    fn terminate_starting_process(&self, outcome: &str) -> Vec<super::domain::DiagnosticSummary> {
        let (mut child, mut diagnostics) = {
            let Ok(mut inner) = self.inner.lock() else {
                return Vec::new();
            };
            let child = inner.process.take();
            let diagnostics = inner.diagnostics.drain(..).collect::<Vec<_>>();
            (child, diagnostics)
        };
        if let Some(child) = child.as_mut() {
            let _ = child.stop_with(|_| Ok(()), Duration::ZERO);
            diagnostics.extend(child.diagnostics());
        }
        drop(child);
        diagnostics.push(super::domain::DiagnosticSummary {
            source: super::domain::DiagnosticSource::Supervisor,
            message: outcome.to_owned(),
        });
        if let Ok(mut inner) = self.inner.lock() {
            inner.diagnostics = diagnostics.clone();
        }
        diagnostics
    }

    fn cancelled_startup_result(&self) -> Result<(), EngineError> {
        if self.status().state == EngineLifecycleState::Stopped {
            return Err(start_cancelled_error());
        }
        self.terminate_starting_process("Startup cancelled by owner; owned process terminated");
        if self.status().state == EngineLifecycleState::Stopped {
            return Err(start_cancelled_error());
        }
        self.fail(start_cancelled_error())
    }

    /// Stop a Starting session without waiting for the readiness operation lock.
    /// The spawn gate only covers verification/spawn/ownership transfer, never polling.
    pub fn stop_starting(&self) -> Result<(), EngineError> {
        self.cancel_startup();
        self.stop_starting_inner(EventStopReason::Owner)
    }

    pub fn stop_starting_for_application_quit(&self) -> Result<(), EngineError> {
        self.cancel_startup();
        self.inner.lock().map_err(|_| lock_error())?.shutting_down = true;
        self.stop_starting_inner(EventStopReason::ApplicationQuit)
    }

    fn stop_starting_inner(&self, reason: EventStopReason) -> Result<(), EngineError> {
        let spawn_gate = self.spawn_gate.lock().map_err(|_| lock_error())?;
        let mut process = {
            let mut inner = self.inner.lock().map_err(|_| lock_error())?;
            if inner.lifecycle.state() != EngineLifecycleState::Starting {
                if inner.lifecycle.state() == EngineLifecycleState::Error
                    && inner
                        .error
                        .as_ref()
                        .is_some_and(|error| error.kind == EngineErrorKind::StartupCancelled)
                {
                    inner.lifecycle.transition(EngineLifecycleState::Stopped)?;
                    inner.error = None;
                    inner
                        .events
                        .stopped(reason, false, super::events::timestamp_now_ms());
                }
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
            inner.lifecycle.transition(EngineLifecycleState::Stopping)?;
            inner.process.take()
        };
        drop(spawn_gate);

        let stop_error = process
            .as_mut()
            .and_then(|child| child.stop_with(|_| Ok(()), Duration::ZERO).err());
        let mut diagnostics = process
            .as_ref()
            .map(SupervisedChild::diagnostics)
            .unwrap_or_default();
        drop(process);

        let mut inner = self.inner.lock().map_err(|_| lock_error())?;
        if let Some(error) = stop_error {
            inner.lifecycle.transition(EngineLifecycleState::Error)?;
            inner
                .events
                .failed(FailureKind::StopFailed, super::events::timestamp_now_ms());
            inner.error = Some(error.clone());
            inner.diagnostics = diagnostics;
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
            return Err(error);
        }
        inner.lifecycle.transition(EngineLifecycleState::Stopped)?;
        inner
            .events
            .stopped(reason, false, super::events::timestamp_now_ms());
        inner.error = None;
        inner.telemetry = None;
        inner.telemetry_received_at = None;
        inner.mining_started_at = None;
        diagnostics.push(super::domain::DiagnosticSummary {
            source: super::domain::DiagnosticSource::Supervisor,
            message: "Starting session stopped by owner; Job Object closed before output readers were joined".into(),
        });
        inner.diagnostics = diagnostics;
        if let (Some(stage), Some(started)) = (inner.startup_stage, inner.startup_stage_started) {
            inner.startup_timings.push(StartupTiming {
                stage: format!("{:?}", stage),
                elapsed_ms: started.elapsed().as_millis().min(u64::MAX as u128) as u64,
            });
        }
        inner.startup_stage = None;
        inner.startup_started = None;
        inner.startup_stage_started = None;
        Ok(())
    }

    pub fn poll_unexpected_exit(&self) -> Result<Option<i32>, EngineError> {
        let _operation = self.operation.lock().map_err(|_| lock_error())?;
        let mut child = {
            let mut inner = self.inner.lock().map_err(|_| lock_error())?;
            let Some(child) = inner.process.take() else {
                return Ok(None);
            };
            child
        };
        let status = match child.try_wait() {
            Ok(Some(status)) => status,
            Ok(None) => {
                self.inner.lock().map_err(|_| lock_error())?.process = Some(child);
                return Ok(None);
            }
            Err(_) => {
                self.inner.lock().map_err(|_| lock_error())?.process = Some(child);
                return Err(EngineError {
                    kind: EngineErrorKind::Internal,
                    message: "Could not inspect the owned engine process".into(),
                });
            }
        };
        let code = status.code();
        let succeeded = status.success();
        let diagnostics = child.diagnostics();
        drop(child);
        let mut inner = self.inner.lock().map_err(|_| lock_error())?;
        if inner.lifecycle.state() != EngineLifecycleState::Mining {
            return Ok(None);
        }
        inner.lifecycle.transition(EngineLifecycleState::Error)?;
        inner.events.failed(
            FailureKind::UnexpectedEngineExit,
            super::events::timestamp_now_ms(),
        );
        inner.mining_started_at = None;
        inner.error = Some(EngineError {
            kind: EngineErrorKind::UnexpectedExit,
            message: format!(
                "Engine exited unexpectedly (success={succeeded}, code {code:?}); no restart was attempted"
            ),
        });
        inner.diagnostics = diagnostics;
        inner.diagnostics.push(super::domain::DiagnosticSummary {
            source: super::domain::DiagnosticSource::Supervisor,
            message: format!("XMRig exited after Mining: success={succeeded}, code={code:?}"),
        });
        inner.telemetry = None;
        inner.telemetry_received_at = None;
        Ok(code)
    }

    pub fn stop_with<F>(&self, _reason: StopReason, graceful: F) -> Result<(), EngineError>
    where
        F: FnOnce(&mut SupervisedChild) -> io::Result<()>,
    {
        let _operation = self.operation.lock().map_err(|_| lock_error())?;
        let reason = match _reason {
            StopReason::ApplicationQuit => EventStopReason::ApplicationQuit,
            StopReason::UserRequest => EventStopReason::Owner,
            StopReason::StartupFailure => EventStopReason::StartupCancelled,
            StopReason::ContributionSwitch => EventStopReason::ContributionSwitch,
        };
        self.stop_owned_process(graceful, reason)
    }

    fn stop_owned_process<F>(&self, graceful: F, reason: EventStopReason) -> Result<(), EngineError>
    where
        F: FnOnce(&mut SupervisedChild) -> io::Result<()>,
    {
        let (mut process, was_mining) = {
            let mut inner = self.inner.lock().map_err(|_| lock_error())?;
            if inner.process.is_none() {
                if inner.lifecycle.state() == EngineLifecycleState::Error
                    && inner
                        .error
                        .as_ref()
                        .is_some_and(|error| error.kind == EngineErrorKind::StartupCancelled)
                {
                    inner.lifecycle.transition(EngineLifecycleState::Stopped)?;
                    inner.error = None;
                    inner.telemetry = None;
                    inner.telemetry_received_at = None;
                    inner.mining_started_at = None;
                    inner
                        .events
                        .stopped(reason, false, super::events::timestamp_now_ms());
                }
                return Ok(()); // Explicitly idempotent when this supervisor owns no process.
            }
            let was_mining = matches!(
                inner.lifecycle.state(),
                EngineLifecycleState::Mining | EngineLifecycleState::Paused
            );
            match inner.lifecycle.state() {
                EngineLifecycleState::Mining | EngineLifecycleState::Paused => {
                    inner.lifecycle.transition(EngineLifecycleState::Stopping)?;
                }
                EngineLifecycleState::Starting => {
                    inner.lifecycle.transition(EngineLifecycleState::Stopping)?;
                }
                EngineLifecycleState::Stopping | EngineLifecycleState::Error => {}
                _ => {
                    return Err(EngineError {
                        kind: EngineErrorKind::InvalidTransition,
                        message: "Engine state cannot be stopped through this path".into(),
                    })
                }
            }
            (
                inner.process.take().expect("checked owned process"),
                was_mining,
            )
        };

        let result = process.stop_with(graceful, STOP_GRACE);
        let mut diagnostics = process.diagnostics();
        drop(process);
        let mut inner = self.inner.lock().map_err(|_| lock_error())?;
        match result {
            Ok(_) => {
                if inner.lifecycle.state() != EngineLifecycleState::Stopped {
                    inner.lifecycle.transition(EngineLifecycleState::Stopped)?;
                }
                inner
                    .events
                    .stopped(reason, was_mining, super::events::timestamp_now_ms());
                inner.telemetry = None;
                inner.telemetry_received_at = None;
                inner.mining_started_at = None;
                inner.error = None;
                diagnostics.push(super::domain::DiagnosticSummary {
                    source: super::domain::DiagnosticSource::Supervisor,
                    message: "XMRig stopped by Ember; its owned Job Object was closed before output readers were joined".into(),
                });
                inner.diagnostics = diagnostics;
                Ok(())
            }
            Err(error) => {
                if inner.lifecycle.state() != EngineLifecycleState::Error {
                    inner.lifecycle.transition(EngineLifecycleState::Error)?;
                }
                inner
                    .events
                    .failed(FailureKind::StopFailed, super::events::timestamp_now_ms());
                inner.mining_started_at = None;
                inner.error = Some(error.clone());
                inner.diagnostics = diagnostics;
                Err(error)
            }
        }
    }

    pub fn stop_for_application_quit(&self) -> Result<(), EngineError> {
        let _operation = self.operation.lock().map_err(|_| lock_error())?;
        self.inner.lock().map_err(|_| lock_error())?.shutting_down = true;
        self.stop_owned_process(|_| Ok(()), EventStopReason::ApplicationQuit)
    }

    fn fail<T>(&self, error: EngineError) -> Result<T, EngineError> {
        if let Ok(mut inner) = self.inner.lock() {
            let state = inner.lifecycle.state();
            if state != EngineLifecycleState::Error {
                let _ = inner.lifecycle.transition(EngineLifecycleState::Error);
            }
            inner.error = Some(error.clone());
            if error.kind != EngineErrorKind::StartupCancelled {
                inner
                    .events
                    .failed(FailureKind::Startup, super::events::timestamp_now_ms());
            }
            inner.telemetry = None;
            inner.telemetry_received_at = None;
            inner.mining_started_at = None;
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

    fn record_api_probe(
        &self,
        host: &str,
        port: u16,
        attempts: usize,
        connected: bool,
        result: String,
    ) {
        if let Ok(mut inner) = self.inner.lock() {
            inner.diagnostics.retain(|entry| {
                entry.source != super::domain::DiagnosticSource::Supervisor
                    || !entry.message.starts_with("Local API probe:")
            });
            inner.diagnostics.push(super::domain::DiagnosticSummary {
                source: super::domain::DiagnosticSource::Supervisor,
                message: format!("Local API probe: endpoint={host}:{port}, attempts={attempts}, connectable={connected}, last result={result}"),
            });
        }
    }
}

fn lock_error() -> EngineError {
    EngineError {
        kind: EngineErrorKind::Internal,
        message: "Mining supervisor state is unavailable".into(),
    }
}

fn start_cancelled_error() -> EngineError {
    EngineError {
        kind: EngineErrorKind::StartupCancelled,
        message: "Mining startup was stopped at your request.".into(),
    }
}

#[cfg(test)]
mod tests {
    use super::{EngineSupervisor, TELEMETRY_STALE_AFTER};
    use crate::mining::config::tests::fixture_config;
    use crate::mining::diagnostics::RedactionSecrets;
    use crate::mining::domain::{
        EngineArtifact, EngineErrorKind, EngineLifecycleState, MiningTelemetry, StartupStage,
        StopReason, TelemetryFreshness,
    };
    use crate::mining::events::{EventSessionContext, MiningProfile};
    use crate::mining::process::SupervisedChild;
    use std::ffi::OsString;
    use std::path::{Path, PathBuf};
    use std::time::{Duration, Instant};

    fn test_event_context() -> EventSessionContext {
        EventSessionContext {
            session_id: "test-session".into(),
            profile: MiningProfile::Quiet,
            configured_threads: Some(4),
        }
    }

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
            results: None,
            pool_connection: None,
            cpu_huge_pages: None,
            sample_time_unix_ms: None,
        }
    }

    #[test]
    fn telemetry_freshness_distinguishes_unavailable_fresh_and_stale() {
        let supervisor = EngineSupervisor::new();
        assert_eq!(
            supervisor.telemetry_freshness(),
            TelemetryFreshness::Unavailable
        );
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
            inner.mining_started_at = Some(Instant::now() - Duration::from_secs(2));
        }
        supervisor.update_telemetry(fixture_telemetry(false));
        assert_eq!(supervisor.telemetry_freshness(), TelemetryFreshness::Fresh);
        assert_eq!(supervisor.session_duration_seconds(), Some(2));
        supervisor.inner.lock().unwrap().telemetry_received_at =
            Some(Instant::now() - TELEMETRY_STALE_AFTER - Duration::from_millis(1));
        assert_eq!(supervisor.telemetry_freshness(), TelemetryFreshness::Stale);
    }

    #[test]
    fn status_snapshots_live_output_and_capture_health_before_child_exit() {
        let path = std::env::current_exe().unwrap();
        let mut child = spawn_test_child(
            &path,
            &[],
            &std::env::current_dir().unwrap(),
            RedactionSecrets::new([
                "TEST_ONLY_PUBLIC_ADDRESS_DO_NOT_USE".into(),
                "fixture-private-token".into(),
            ]),
        )
        .unwrap();
        let deadline = Instant::now() + Duration::from_secs(2);
        loop {
            let diagnostics = child.diagnostics();
            let stdout_seen = diagnostics.iter().any(|entry| {
                entry.source == crate::mining::domain::DiagnosticSource::Stdout
                    && entry
                        .message
                        .contains("HTTP API 127.0.0.1:58670 bind failed")
            });
            let stderr_seen = diagnostics.iter().any(|entry| {
                entry.source == crate::mining::domain::DiagnosticSource::Stderr
                    && entry.message.contains("RandomX initialization warning")
            });
            if stdout_seen && stderr_seen {
                break;
            }
            assert!(child.try_wait().unwrap().is_none());
            assert!(
                Instant::now() < deadline,
                "fixture output readers did not observe both streams"
            );
            std::thread::sleep(Duration::from_millis(5));
        }
        assert!(child.try_wait().unwrap().is_none());
        let supervisor = EngineSupervisor::new();
        supervisor.inner.lock().unwrap().process = Some(child);
        let snapshot = supervisor.status();
        assert!(snapshot.capture_health.stdout_reader_started);
        assert!(snapshot.capture_health.stderr_reader_started);
        assert!(snapshot.capture_health.sanitized_lines_observed >= 2);
        assert!(snapshot.diagnostics.iter().any(|entry| {
            entry.source == crate::mining::domain::DiagnosticSource::Stdout
                && entry
                    .message
                    .contains("HTTP API 127.0.0.1:58670 bind failed")
        }));
        assert!(snapshot.diagnostics.iter().any(|entry| {
            entry.source == crate::mining::domain::DiagnosticSource::Stderr
                && entry.message.contains("RandomX initialization warning")
        }));
        assert!(snapshot.diagnostics.iter().all(|entry| !entry
            .message
            .contains("TEST_ONLY_PUBLIC_ADDRESS_DO_NOT_USE")
            && !entry.message.contains("fixture-private-token")));
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
                test_event_context(),
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
                test_event_context(),
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
                test_event_context(),
                spawn_test_child,
                || Err(crate::mining::xmrig::ApiClientError::Unavailable),
            )
            .unwrap_err();
        assert_eq!(error.kind, EngineErrorKind::ApiUnavailable);
        assert_eq!(supervisor.status().state, EngineLifecycleState::Error);
        assert!(supervisor.status().process_id.is_none());
        assert!(supervisor.status().diagnostics.iter().any(|line| {
            line.message
                .contains("process observed alive at last check=true")
                && line.message.contains("TCP/API response observed=false")
                && line.message.contains("last API result=Some(Unavailable)")
        }));
        assert!(supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                test_event_context(),
                spawn_test_child,
                || Ok(fixture_telemetry(false)),
            )
            .is_err());
    }

    #[test]
    fn authenticated_api_without_positive_rate_records_observed_readiness_evidence() {
        let path = std::env::current_exe().unwrap();
        let artifact = fixture_artifact(path.clone());
        let config = crate::mining::config::validate(fixture_config(), "6.26.0").unwrap();
        let wallet = config.config.public_address.clone();
        let token = config.config.api.access_token.clone();
        let supervisor = EngineSupervisor::new();
        supervisor.configure_ready(&artifact, &config).unwrap();
        let error = supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([wallet.clone(), token.clone()]),
                test_event_context(),
                spawn_test_child,
                || {
                    let mut telemetry = fixture_telemetry(false);
                    telemetry.short_hashrate = Some(0.0);
                    Ok(telemetry)
                },
            )
            .unwrap_err();
        assert_eq!(error.kind, EngineErrorKind::ApiUnavailable);
        let diagnostics = supervisor.status().diagnostics;
        let evidence = diagnostics
            .iter()
            .find(|line| line.message.contains("Readiness deadline:"))
            .expect("timeout diagnostics include the last observed readiness evidence");
        assert!(evidence.message.contains("authenticated summary=true"));
        assert!(evidence
            .message
            .contains("expected version/miner kind/restricted policy validated=true"));
        assert!(evidence.message.contains("rx/0 advertised=true"));
        assert!(evidence
            .message
            .contains("positive short-window hashrate=false"));
        assert!(evidence.message.contains("last paused=Some(false)"));
        assert!(evidence
            .message
            .contains("last short-window rate=Some(0.0)"));
        assert!(!diagnostics
            .iter()
            .any(|line| { line.message.contains(&wallet) || line.message.contains(&token) }));
        assert!(supervisor.status().process_id.is_none());
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
                test_event_context(),
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
        assert!(supervisor
            .status()
            .diagnostics
            .iter()
            .all(|line| !line.message.contains("fixture-private-token")));
    }

    #[test]
    fn stop_while_waiting_cancels_owned_process_and_allows_a_fresh_start() {
        use std::sync::{mpsc, Arc};

        let path = std::env::current_exe().unwrap();
        let artifact = fixture_artifact(path.clone());
        let config = crate::mining::config::validate(fixture_config(), "6.26.0").unwrap();
        let supervisor = Arc::new(EngineSupervisor::new());
        supervisor.configure_ready(&artifact, &config).unwrap();
        let (polling_tx, polling_rx) = mpsc::channel();
        let (poll_done_tx, poll_done_rx) = mpsc::channel();
        let worker = Arc::clone(&supervisor);
        let worker_artifact = artifact.clone();
        let worker_config = config.clone();
        let worker_path = path.clone();
        let worker = std::thread::spawn(move || {
            worker.start_with(
                &worker_artifact,
                &worker_config,
                &worker_path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                test_event_context(),
                spawn_test_child,
                || {
                    let _ = polling_tx.send(());
                    std::thread::sleep(Duration::from_millis(150));
                    let _ = poll_done_tx.send(());
                    Err(crate::mining::xmrig::ApiClientError::Unavailable)
                },
            )
        });
        polling_rx.recv_timeout(Duration::from_secs(2)).unwrap();
        assert_eq!(supervisor.status().state, EngineLifecycleState::Starting);
        assert!(supervisor.status().process_id.is_some());

        let stop_started = Instant::now();
        supervisor.stop_starting().unwrap();
        assert!(stop_started.elapsed() < Duration::from_secs(2));
        assert!(
            poll_done_rx.try_recv().is_err(),
            "Stop must not wait for readiness polling to finish"
        );
        assert!(
            supervisor
                .try_begin_startup(StartupStage::CheckingEngine)
                .is_err(),
            "a new Start cannot clear cancellation while the previous worker is unwinding"
        );
        assert_eq!(
            worker.join().unwrap().unwrap_err().kind,
            EngineErrorKind::StartupCancelled
        );
        assert_eq!(supervisor.status().state, EngineLifecycleState::Stopped);
        assert!(supervisor.status().process_id.is_none());

        supervisor.configure_ready(&artifact, &config).unwrap();
        supervisor.begin_startup(StartupStage::CheckingEngine);
        supervisor
            .start_with(
                &artifact,
                &config,
                &path,
                &[],
                &std::env::current_dir().unwrap(),
                RedactionSecrets::new([]),
                test_event_context(),
                spawn_test_child,
                || Ok(fixture_telemetry(false)),
            )
            .unwrap();
        supervisor
            .stop_with(StopReason::UserRequest, |_| Ok(()))
            .unwrap();
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
                test_event_context(),
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
        assert!(supervisor.status().diagnostics.iter().any(|line| {
            line.message
                .contains("XMRig exited during startup: success=true, code=Some(0)")
        }));
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
                test_event_context(),
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
        let deadline = Instant::now() + Duration::from_secs(2);
        let exit = loop {
            if let Some(code) = supervisor.poll_unexpected_exit().unwrap() {
                break Some(code);
            }
            assert!(
                Instant::now() < deadline,
                "fixture did not exit within the expected bound"
            );
            std::thread::sleep(Duration::from_millis(10));
        };
        assert_eq!(exit, Some(0));
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
            test_event_context(),
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
