use serde::Serialize;
use std::path::PathBuf;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase", tag = "state", content = "version")]
pub enum EngineAvailability {
    Unavailable,
    Available(String),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum EngineLifecycleState {
    Unavailable,
    NotConfigured,
    Ready,
    Starting,
    Mining,
    Paused,
    Stopping,
    Stopped,
    Error,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum StartupStage {
    CheckingEngine,
    PreparingSession,
    StartingXmrig,
    WaitingForMiner,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartupTiming {
    pub stage: String,
    pub elapsed_ms: u64,
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureHealth {
    pub stdout_reader_started: bool,
    pub stderr_reader_started: bool,
    pub sanitized_lines_observed: u64,
    pub stdout_eof_observed: bool,
    pub stderr_eof_observed: bool,
    pub stdout_read_error: Option<String>,
    pub stderr_read_error: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub availability: EngineAvailability,
    pub state: EngineLifecycleState,
    pub process_id: Option<u32>,
    pub error: Option<EngineError>,
    pub diagnostics: Vec<DiagnosticSummary>,
    pub capture_health: CaptureHealth,
    pub startup_stage: Option<StartupStage>,
    pub startup_elapsed_ms: Option<u64>,
    pub startup_timings: Vec<StartupTiming>,
}

#[derive(Clone, PartialEq, Eq)]
pub struct MiningConfig {
    pub pool: PoolConfig,
    pub public_address: String,
    pub worker_id: Option<String>,
    pub cpu: CpuConfig,
    pub api: LocalApiConfig,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PoolConfig {
    pub host: String,
    pub port: u16,
    pub tls: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CpuConfig {
    pub enabled: bool,
    pub max_threads_hint: u8,
    pub threads: Option<usize>,
}

impl std::fmt::Debug for MiningConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MiningConfig")
            .field("public_address", &"[REDACTED]")
            .field("api", &self.api)
            .finish_non_exhaustive()
    }
}

#[derive(Clone, PartialEq, Eq)]
pub struct LocalApiConfig {
    pub host: String,
    pub port: u16,
    pub access_token: String,
    pub restricted: bool,
}

impl std::fmt::Debug for LocalApiConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("LocalApiConfig")
            .field("host", &self.host)
            .field("port", &self.port)
            .field("access_token", &"[REDACTED]")
            .field("restricted", &self.restricted)
            .finish()
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ValidatedMiningConfig {
    pub config: MiningConfig,
    pub engine_version: String,
}

/// Ember-owned engine boundary. Process creation and lifecycle serialization stay in the supervisor.
pub trait MiningEngine: Send {
    fn availability(&self) -> EngineAvailability;
    fn validate(&self, config: MiningConfig) -> Result<ValidatedMiningConfig, EngineError>;
    fn start(&mut self, config: ValidatedMiningConfig) -> Result<EngineStatus, EngineError>;
    fn stop(&mut self, reason: StopReason) -> Result<EngineStatus, EngineError>;
    fn status(&self) -> EngineStatus;
    fn telemetry(&self) -> Option<MiningTelemetry>;
    fn diagnostics(&self) -> Vec<DiagnosticSummary>;
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MiningTelemetry {
    pub engine_version: Option<String>,
    pub uptime_seconds: Option<u64>,
    pub paused: Option<bool>,
    pub supported_algorithms: Vec<String>,
    pub short_hashrate: Option<f64>,
    pub medium_hashrate: Option<f64>,
    pub long_hashrate: Option<f64>,
    pub results: Option<MiningResultsTelemetry>,
    pub pool_connection: Option<PoolConnectionTelemetry>,
    pub cpu_huge_pages: Option<HugePagesTelemetry>,
    pub sample_time_unix_ms: Option<u64>,
}

/// XMRig's `/2/summary` result counters; counts reflect pool submission responses
/// received by XMRig, not independently fetched pool-account data.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MiningResultsTelemetry {
    pub accepted: Option<u64>,
    pub rejected: Option<u64>,
    pub total: Option<u64>,
    pub current_job_difficulty: Option<u64>,
    pub accepted_difficulty_total: Option<u64>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum PoolConnectionState {
    Connected,
    Disconnected,
    Unknown,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PoolConnectionTelemetry {
    pub state: PoolConnectionState,
    pub endpoint: Option<String>,
    pub uptime_seconds: Option<u64>,
    pub failures: Option<u64>,
    pub ping_ms: Option<u64>,
    pub tls_version: Option<String>,
    pub algorithm: Option<String>,
    pub current_job_difficulty: Option<u64>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HugePagesTelemetry {
    pub allocated: u64,
    pub total: u64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum TelemetryFreshness {
    Unavailable,
    Fresh,
    Stale,
}

impl Default for MiningTelemetry {
    fn default() -> Self {
        Self {
            engine_version: None,
            uptime_seconds: None,
            paused: None,
            supported_algorithms: Vec::new(),
            short_hashrate: None,
            medium_hashrate: None,
            long_hashrate: None,
            results: None,
            pool_connection: None,
            cpu_huge_pages: None,
            sample_time_unix_ms: None,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineError {
    pub kind: EngineErrorKind,
    pub message: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum EngineErrorKind {
    InvalidTransition,
    InvalidConfiguration,
    UntrustedArtifact,
    ArtifactUnavailable,
    SecurityBlocked,
    StartupCancelled,
    SpawnFailed,
    ApiUnavailable,
    ApiRejected,
    UnexpectedExit,
    StopFailed,
    Internal,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticSummary {
    pub source: DiagnosticSource,
    pub message: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DiagnosticSource {
    Stdout,
    Stderr,
    Supervisor,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StopReason {
    UserRequest,
    ApplicationQuit,
    StartupFailure,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EngineArtifact {
    engine_name: String,
    version: String,
    architecture: String,
    source_url: String,
    archive_sha256: String,
    verification: ArtifactVerification,
    installed_path: PathBuf,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ArtifactVerification {
    Unverified,
    Verified {
        digest: String,
        verified_at_unix_ms: u64,
    },
}

impl EngineArtifact {
    pub(crate) fn verified_installed(
        engine_name: String,
        version: String,
        architecture: String,
        source_url: String,
        archive_sha256: String,
        installed_path: PathBuf,
        verified_at_unix_ms: u64,
    ) -> Self {
        Self {
            engine_name,
            version,
            architecture,
            source_url,
            verification: ArtifactVerification::Verified {
                digest: archive_sha256.clone(),
                verified_at_unix_ms,
            },
            archive_sha256,
            installed_path,
        }
    }

    pub fn unverified(
        engine_name: String,
        version: String,
        architecture: String,
        source_url: String,
        archive_sha256: String,
        installed_path: PathBuf,
    ) -> Self {
        Self {
            engine_name,
            version,
            architecture,
            source_url,
            archive_sha256,
            verification: ArtifactVerification::Unverified,
            installed_path,
        }
    }

    pub fn engine_name(&self) -> &str {
        &self.engine_name
    }
    pub fn version(&self) -> &str {
        &self.version
    }
    pub fn architecture(&self) -> &str {
        &self.architecture
    }
    pub fn source_url(&self) -> &str {
        &self.source_url
    }
    pub fn archive_sha256(&self) -> &str {
        &self.archive_sha256
    }
    pub fn installed_path(&self) -> &std::path::Path {
        &self.installed_path
    }

    pub fn is_verified(&self) -> bool {
        matches!(&self.verification, ArtifactVerification::Verified { digest, verified_at_unix_ms } if *verified_at_unix_ms > 0 && digest.eq_ignore_ascii_case(&self.archive_sha256))
    }

    #[cfg(test)]
    pub(crate) fn verified_fixture(
        engine_name: &str,
        version: &str,
        architecture: &str,
        source_url: &str,
        digest: &str,
        installed_path: PathBuf,
    ) -> Self {
        Self {
            engine_name: engine_name.into(),
            version: version.into(),
            architecture: architecture.into(),
            source_url: source_url.into(),
            archive_sha256: digest.into(),
            verification: ArtifactVerification::Verified {
                digest: digest.into(),
                verified_at_unix_ms: 1,
            },
            installed_path,
        }
    }
}

#[derive(Default)]
pub struct LifecycleMachine {
    state: Option<EngineLifecycleState>,
}

impl LifecycleMachine {
    pub fn new(initial: EngineLifecycleState) -> Self {
        Self {
            state: Some(initial),
        }
    }

    pub fn state(&self) -> EngineLifecycleState {
        self.state.unwrap_or(EngineLifecycleState::NotConfigured)
    }

    pub fn transition(&mut self, next: EngineLifecycleState) -> Result<(), EngineError> {
        use EngineLifecycleState as S;
        let current = self.state();
        let valid = matches!(
            (current, next),
            (S::Unavailable, S::Ready | S::NotConfigured | S::Error)
                | (S::NotConfigured, S::Ready | S::Unavailable | S::Error)
                | (
                    S::Ready,
                    S::Starting | S::Unavailable | S::NotConfigured | S::Stopped | S::Error
                )
                | (S::Starting, S::Mining | S::Stopping | S::Error)
                | (S::Mining, S::Paused | S::Stopping | S::Error)
                | (S::Paused, S::Mining | S::Stopping | S::Error)
                | (S::Stopping, S::Stopped | S::Error)
                | (
                    S::Stopped,
                    S::Ready | S::Starting | S::NotConfigured | S::Unavailable | S::Error
                )
                | (
                    S::Error,
                    S::Ready | S::Unavailable | S::NotConfigured | S::Stopped
                )
        );
        if !valid {
            return Err(EngineError {
                kind: EngineErrorKind::InvalidTransition,
                message: format!("Transition {current:?} -> {next:?} is not allowed"),
            });
        }
        self.state = Some(next);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::{EngineErrorKind, EngineLifecycleState as S, LifecycleMachine};

    #[test]
    fn lifecycle_accepts_ready_start_pause_stop_path() {
        let mut state = LifecycleMachine::new(S::Ready);
        for next in [
            S::Starting,
            S::Mining,
            S::Paused,
            S::Mining,
            S::Stopping,
            S::Stopped,
        ] {
            state.transition(next).unwrap();
        }
        assert_eq!(state.state(), S::Stopped);
    }

    #[test]
    fn lifecycle_rejects_mining_from_unavailable_and_duplicate_start() {
        let mut unavailable = LifecycleMachine::new(S::Unavailable);
        assert_eq!(
            unavailable.transition(S::Mining).unwrap_err().kind,
            EngineErrorKind::InvalidTransition
        );

        let mut starting = LifecycleMachine::new(S::Starting);
        assert_eq!(
            starting.transition(S::Starting).unwrap_err().kind,
            EngineErrorKind::InvalidTransition
        );
        assert_eq!(starting.transition(S::Mining), Ok(()));
        assert_eq!(
            starting.transition(S::Starting).unwrap_err().kind,
            EngineErrorKind::InvalidTransition
        );
    }

    #[test]
    fn error_requires_explicit_transition_before_start() {
        let mut state = LifecycleMachine::new(S::Error);
        assert!(state.transition(S::Starting).is_err());
        state.transition(S::Ready).unwrap();
        state.transition(S::Starting).unwrap();
    }
}
