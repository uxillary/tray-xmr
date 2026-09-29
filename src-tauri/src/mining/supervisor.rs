use super::diagnostics::RedactionSecrets;
use super::domain::{
    EngineArtifact, EngineAvailability, EngineError, EngineErrorKind, EngineLifecycleState,
    EngineStatus, LifecycleMachine, MiningTelemetry, StopReason, ValidatedMiningConfig,
};
use super::process::SupervisedChild;
use super::xmrig::ApiClientError;
use std::ffi::OsString;
use std::io;
use std::path::Path;
use std::process::Child;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

const STOP_GRACE: Duration = Duration::from_secs(2);
const READINESS_ATTEMPTS: usize = 20;
const READINESS_INTERVAL: Duration = Duration::from_millis(50);

struct SupervisorInner {
    lifecycle: LifecycleMachine,
    availability: EngineAvailability,
    process: Option<SupervisedChild>,
    telemetry: Option<MiningTelemetry>,
    error: Option<EngineError>,
    diagnostics: Vec<super::domain::DiagnosticSummary>,
}

pub struct EngineSupervisor {
    inner: Mutex<SupervisorInner>,
    operation: Mutex<()>,
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
            }),
            operation: Mutex::new(()),
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
            })
    }

    pub fn telemetry(&self) -> Option<MiningTelemetry> {
        self.inner
            .lock()
            .ok()
            .and_then(|inner| inner.telemetry.clone())
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
        }

        let redaction = redaction.with_values([
            config.config.public_address.clone(),
            config.config.api.access_token.clone(),
            working_directory.to_string_lossy().into_owned(),
            executable.to_string_lossy().into_owned(),
        ]);
        let mut child = match spawn(executable, arguments, working_directory, redaction) {
            Ok(child) => child,
            Err(error) => return self.fail(error),
        };
        for attempt in 0..READINESS_ATTEMPTS {
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
                let safe_exit = format!("Engine exited during startup (code {:?})", exit.code());
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

            match poll_api() {
                Ok(telemetry)
                    if telemetry.engine_version.as_deref() == Some(artifact.version())
                        && telemetry.paused == Some(false) =>
                {
                    let mut inner = self.inner.lock().map_err(|_| lock_error())?;
                    inner.lifecycle.transition(EngineLifecycleState::Mining)?;
                    inner.telemetry = Some(telemetry);
                    inner.process = Some(child);
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
                Ok(_) => {} // Paused is not considered ready to mine.
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
        F: FnOnce(&mut Child) -> io::Result<()>,
    {
        let _operation = self.operation.lock().map_err(|_| lock_error())?;
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
        self.stop_with(StopReason::ApplicationQuit, |_| Ok(()))
    }

    fn fail<T>(&self, error: EngineError) -> Result<T, EngineError> {
        if let Ok(mut inner) = self.inner.lock() {
            let state = inner.lifecycle.state();
            if state != EngineLifecycleState::Error {
                let _ = inner.lifecycle.transition(EngineLifecycleState::Error);
            }
            inner.error = Some(error.clone());
            inner.telemetry = None;
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
        EngineArtifact, EngineErrorKind, EngineLifecycleState, MiningTelemetry, StopReason,
    };
    use crate::mining::process::SupervisedChild;
    use std::ffi::OsString;
    use std::path::{Path, PathBuf};
    use std::process::Child;
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
            paused: Some(paused),
            supported_algorithms: vec!["rx/0".into()],
            short_hashrate: None,
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
                    if polls == 1 {
                        Err(crate::mining::xmrig::ApiClientError::Unavailable)
                    } else {
                        Ok(fixture_telemetry(false))
                    }
                },
            )
            .unwrap();
        assert!(polls >= 2);
        assert_eq!(supervisor.status().state, EngineLifecycleState::Mining);
        assert!(supervisor.status().process_id.is_some());
        assert_eq!(supervisor.telemetry().unwrap().paused, Some(false));
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
            .stop_with(StopReason::UserRequest, |child: &mut Child| {
                drop(child.stdin.take());
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
        let _ = Duration::from_millis(0);
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
