//! Owner-triggered, non-mining XMRig integration diagnostic.
use super::{
    config,
    diagnostics::RedactionSecrets,
    domain::{
        CpuConfig, DiagnosticSummary, EngineLifecycleState, LocalApiConfig, MiningConfig,
        PoolConfig,
    },
    process::SupervisedChild,
    provisioner::{self, VerifiedInstallation},
    runtime::RuntimeSession,
    xmrig::{LocalApiTransport, ReqwestLocalApiTransport},
};
use serde::Serialize;
use std::{
    ffi::OsString,
    net::{Ipv4Addr, TcpListener, TcpStream},
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::{Duration, Instant},
};

pub const DIAGNOSTIC_POOL_HOST: &str = "does-not-exist.invalid";
const DIAGNOSTIC_POOL_PORT: u16 = 20128;
const DIAGNOSTIC_WORKER: &str = "ember-diagnostic";
const DIAGNOSTIC_WALLET: &str =
    "46BeWrHpwXmHDpDEUmZBWZfoQpdc6HaERCNmx1pEYL2rAcuwufPN9rXHHtyUA4QVy66qeFQkn6sfK8aHYjA3jk3o1Bv16em";

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum TestMark {
    NotRun,
    Running,
    Passed,
    Failed,
    Cancelled,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IntegrationTestStatus {
    pub running: bool,
    pub current_variant: Option<String>,
    pub engine_verification: TestMark,
    pub minimal_api_test: TestMark,
    pub quiet_profile_api_test: TestMark,
    pub cleanup: TestMark,
    pub details: Vec<String>,
    pub report_available: bool,
}

impl Default for IntegrationTestStatus {
    fn default() -> Self {
        Self {
            running: false,
            current_variant: None,
            engine_verification: TestMark::NotRun,
            minimal_api_test: TestMark::NotRun,
            quiet_profile_api_test: TestMark::NotRun,
            cleanup: TestMark::NotRun,
            details: Vec::new(),
            report_available: false,
        }
    }
}

#[derive(Default)]
pub struct IntegrationTestController {
    status: Mutex<IntegrationTestStatus>,
    report: Mutex<Option<String>>,
    cancel: AtomicBool,
}

impl IntegrationTestController {
    pub fn begin(&self) -> Result<(), String> {
        let mut status = self
            .status
            .lock()
            .map_err(|_| "Integration test state is unavailable")?;
        if status.running {
            return Err("The XMRig integration test is already running".into());
        }
        *status = IntegrationTestStatus {
            running: true,
            engine_verification: TestMark::Running,
            ..IntegrationTestStatus::default()
        };
        self.cancel.store(false, Ordering::Release);
        if let Ok(mut report) = self.report.lock() {
            *report = None;
        }
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        self.status
            .lock()
            .map(|status| status.running)
            .unwrap_or(true)
    }

    pub fn cancel(&self) {
        self.cancel.store(true, Ordering::Release);
    }

    pub fn cancelled(&self) -> bool {
        self.cancel.load(Ordering::Acquire)
    }

    pub fn status(&self) -> IntegrationTestStatus {
        self.status
            .lock()
            .map(|value| value.clone())
            .unwrap_or_default()
    }

    pub fn report(&self) -> Option<String> {
        self.report.lock().ok().and_then(|value| value.clone())
    }

    pub fn verification_failed(&self, message: String, report: String) {
        if let Ok(mut status) = self.status.lock() {
            status.running = false;
            status.engine_verification = TestMark::Failed;
            status.cleanup = TestMark::Passed;
            status.details = vec![message];
            status.report_available = true;
        }
        if let Ok(mut stored) = self.report.lock() {
            *stored = Some(report);
        }
    }

    pub fn execution_failed(&self, message: String, report: String) {
        if let Ok(mut status) = self.status.lock() {
            status.running = false;
            status.current_variant = None;
            status.engine_verification = TestMark::Passed;
            if status.minimal_api_test == TestMark::Running {
                status.minimal_api_test = TestMark::Failed;
            }
            if status.quiet_profile_api_test == TestMark::Running {
                status.quiet_profile_api_test = TestMark::Failed;
            }
            status.cleanup = TestMark::Failed;
            status.details = vec![message];
            status.report_available = true;
        }
        if let Ok(mut stored) = self.report.lock() {
            *stored = Some(report);
        }
    }

    fn variant_started(&self, variant: DiagnosticVariant) {
        if let Ok(mut status) = self.status.lock() {
            status.engine_verification = TestMark::Passed;
            status.current_variant = Some(variant.label().into());
            match variant {
                DiagnosticVariant::Minimal => status.minimal_api_test = TestMark::Running,
                DiagnosticVariant::Quiet => status.quiet_profile_api_test = TestMark::Running,
            }
        }
    }

    fn variant_finished(&self, evidence: &VariantEvidence) {
        if let Ok(mut status) = self.status.lock() {
            let mark = if evidence.cancelled {
                TestMark::Cancelled
            } else if evidence.passed() {
                TestMark::Passed
            } else {
                TestMark::Failed
            };
            match evidence.variant {
                DiagnosticVariant::Minimal => status.minimal_api_test = mark,
                DiagnosticVariant::Quiet => status.quiet_profile_api_test = mark,
            }
            status.cleanup = if evidence.cleanup_passed {
                TestMark::Passed
            } else {
                TestMark::Failed
            };
            status.details = evidence.summary_lines();
        }
    }

    fn finish(&self, result: &IntegrationResult) {
        if let Ok(mut status) = self.status.lock() {
            status.running = false;
            status.current_variant = None;
            status.engine_verification = TestMark::Passed;
            status.cleanup = if result.variants.iter().all(|item| item.cleanup_passed) {
                TestMark::Passed
            } else {
                TestMark::Failed
            };
            status.details = result
                .variants
                .iter()
                .flat_map(VariantEvidence::summary_lines)
                .collect();
            status.report_available = true;
        }
        if let Ok(mut report) = self.report.lock() {
            *report = Some(result.report());
        }
    }
}

pub fn ensure_production_start_allowed(
    controller: &IntegrationTestController,
) -> Result<(), String> {
    if controller.is_running() {
        Err("Stop the XMRig integration test before starting mining".into())
    } else {
        Ok(())
    }
}

pub fn ensure_diagnostic_start_allowed(
    state: EngineLifecycleState,
    process_id: Option<u32>,
) -> Result<(), String> {
    if process_id.is_some()
        || matches!(
            state,
            EngineLifecycleState::Starting
                | EngineLifecycleState::Mining
                | EngineLifecycleState::Paused
                | EngineLifecycleState::Stopping
        )
    {
        Err("Stop mining before running the XMRig integration test".into())
    } else {
        Ok(())
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum DiagnosticVariant {
    Minimal,
    Quiet,
}

impl DiagnosticVariant {
    fn label(self) -> &'static str {
        match self {
            Self::Minimal => "Minimal",
            Self::Quiet => "Production-shaped Quiet",
        }
    }
}

pub(crate) struct DiagnosticCandidate {
    reservation: Option<TcpListener>,
    pub json: String,
    pub token: String,
    pub port: u16,
    pub threads: usize,
}

impl DiagnosticCandidate {
    pub(crate) fn release_port(&mut self) {
        self.reservation.take();
    }
}

pub(crate) fn build_candidate(
    variant: DiagnosticVariant,
    logical_processors: usize,
) -> Result<DiagnosticCandidate, String> {
    let reservation = TcpListener::bind((Ipv4Addr::LOCALHOST, 0))
        .map_err(|_| "A loopback API port could not be reserved")?;
    let port = reservation
        .local_addr()
        .map_err(|_| "The reserved loopback API port is unavailable")?
        .port();
    let mut token_bytes = [0u8; 32];
    getrandom::fill(&mut token_bytes).map_err(|_| "A fresh API token could not be created")?;
    let token = hex::encode(token_bytes);
    let threads = logical_processors.clamp(1, 4);
    let json = match variant {
        DiagnosticVariant::Minimal => serde_json::to_string_pretty(&serde_json::json!({
            "autosave": false,
            "background": false,
            "colors": false,
            "donate-level": 0,
            "randomx": { "init": -1, "1gb-pages": false, "rdmsr": false, "wrmsr": false, "cache_qos": false },
            "cpu": { "enabled": false },
            "opencl": false,
            "cuda": false,
            "watch": false,
            "http": {
                "enabled": true,
                "host": "127.0.0.1",
                "port": port,
                "access-token": token,
                "restricted": true
            },
            "pools": [{
                "algo": "rx/0",
                "url": format!("{DIAGNOSTIC_POOL_HOST}:{DIAGNOSTIC_POOL_PORT}"),
                "user": DIAGNOSTIC_WALLET,
                "pass": "x",
                "rig-id": DIAGNOSTIC_WORKER,
                "tls": false,
                "enabled": true,
                "keepalive": false
            }]
        }))
        .map_err(|_| "The minimal diagnostic configuration could not be generated")?,
        DiagnosticVariant::Quiet => {
            let validated = config::validate(
                MiningConfig {
                    pool: PoolConfig {
                        host: DIAGNOSTIC_POOL_HOST.into(),
                        port: DIAGNOSTIC_POOL_PORT,
                        tls: false,
                    },
                    public_address: DIAGNOSTIC_WALLET.into(),
                    worker_id: Some(DIAGNOSTIC_WORKER.into()),
                    cpu: CpuConfig {
                        enabled: true,
                        max_threads_hint: 100,
                        threads: Some(threads),
                    },
                    api: LocalApiConfig {
                        host: "127.0.0.1".into(),
                        port,
                        access_token: token.clone(),
                        restricted: true,
                    },
                },
                provisioner::VERSION,
            )
            .map_err(|error| error.message)?;
            config::generate_diagnostic_json(&validated, true).map_err(|error| error.message)?
        }
    };
    Ok(DiagnosticCandidate {
        reservation: Some(reservation),
        json,
        token,
        port,
        threads: if variant == DiagnosticVariant::Minimal {
            0
        } else {
            threads
        },
    })
}

#[derive(Clone)]
pub struct EnvironmentEvidence {
    pub ember_version: String,
    pub os_version: String,
    pub memory_used_bytes: Option<u64>,
    pub memory_available_bytes: Option<u64>,
    pub logical_processors: usize,
}

struct IntegrationResult {
    environment: EnvironmentEvidence,
    variants: Vec<VariantEvidence>,
}

#[derive(Clone)]
struct VariantEvidence {
    variant: DiagnosticVariant,
    api_port: u16,
    threads: usize,
    process_created: bool,
    process_alive: bool,
    listener_started: bool,
    tcp_connected: bool,
    authenticated_summary: bool,
    dns_result: &'static str,
    cleanup_passed: bool,
    cancelled: bool,
    events: Vec<DiagnosticSummary>,
}

impl VariantEvidence {
    fn passed(&self) -> bool {
        self.process_created
            && self.process_alive
            && self.listener_started
            && self.tcp_connected
            && self.authenticated_summary
            && self.cleanup_passed
            && !self.cancelled
            && !self
                .events
                .iter()
                .any(|event| event.message.contains("pool-job-received"))
    }

    fn summary_lines(&self) -> Vec<String> {
        vec![
            format!(
                "{}: {}",
                self.variant.label(),
                if self.passed() {
                    "Passed"
                } else if self.cancelled {
                    "Cancelled"
                } else {
                    "Failed"
                }
            ),
            format!("Loopback listener: {}", pass_fail(self.listener_started)),
            format!("TCP connection: {}", pass_fail(self.tcp_connected)),
            format!(
                "Authenticated summary: {}",
                pass_fail(self.authenticated_summary)
            ),
            format!("Cleanup: {}", pass_fail(self.cleanup_passed)),
        ]
    }
}

fn pass_fail(value: bool) -> &'static str {
    if value {
        "Passed"
    } else {
        "Failed"
    }
}

pub fn execute(
    root: &Path,
    initial: &VerifiedInstallation,
    environment: EnvironmentEvidence,
    controller: &IntegrationTestController,
) -> Result<IntegrationTestStatus, String> {
    let mut variants = Vec::new();
    for variant in [DiagnosticVariant::Minimal, DiagnosticVariant::Quiet] {
        if controller.cancelled() {
            break;
        }
        controller.variant_started(variant);
        let evidence = run_variant(root, initial, variant, &environment, controller)?;
        controller.variant_finished(&evidence);
        let cancelled = evidence.cancelled;
        variants.push(evidence);
        if cancelled {
            break;
        }
    }
    let result = IntegrationResult {
        environment,
        variants,
    };
    controller.finish(&result);
    Ok(controller.status())
}

fn run_variant(
    root: &Path,
    initial: &VerifiedInstallation,
    variant: DiagnosticVariant,
    environment: &EnvironmentEvidence,
    controller: &IntegrationTestController,
) -> Result<VariantEvidence, String> {
    let mut candidate = build_candidate(variant, environment.logical_processors)?;
    let runtime = RuntimeSession::create(root, &candidate.json)
        .map_err(|_| "A private diagnostic runtime could not be created")?;
    let verified = provisioner::verify_installation(root)
        .map_err(|issue| format!("{} ({issue})", issue.owner_message()))?;
    if !verified.same_installation(initial) || verified.metadata().version != provisioner::VERSION {
        let cleanup = runtime.cleanup().is_ok();
        return Ok(failed_before_spawn(
            variant,
            candidate.port,
            candidate.threads,
            cleanup,
        ));
    }

    let arguments = vec![
        OsString::from("--config"),
        runtime.config_path().as_os_str().to_owned(),
    ];
    let redaction = RedactionSecrets::new([
        candidate.token.clone(),
        DIAGNOSTIC_WALLET.into(),
        DIAGNOSTIC_WORKER.into(),
        runtime.working_directory().to_string_lossy().into_owned(),
        root.to_string_lossy().into_owned(),
    ]);
    candidate.release_port();
    let spawned = SupervisedChild::spawn(
        &verified.executable_path(),
        &arguments,
        runtime.working_directory(),
        redaction,
    );
    let Ok(mut child) = spawned else {
        let cleanup = runtime.cleanup().is_ok();
        return Ok(failed_before_spawn(
            variant,
            candidate.port,
            candidate.threads,
            cleanup,
        ));
    };

    let process_created = true;
    let mut process_alive = child.try_wait().ok().flatten().is_none();
    let listener_deadline = Instant::now() + Duration::from_secs(8);
    let mut listener_started = false;
    while Instant::now() < listener_deadline && !controller.cancelled() {
        let output = child.diagnostics();
        listener_started = output.iter().any(|entry| {
            entry.message.contains("HTTP API")
                && entry
                    .message
                    .contains(&format!("127.0.0.1:{}", candidate.port))
                && !entry.message.contains("unknown error")
                && !entry.message.contains("failed")
        });
        if listener_started
            || output.iter().any(|entry| {
                entry.message.contains("HTTP API server failed to start")
                    || (entry.message.contains("HTTP API 127.0.0.1:")
                        && entry.message.contains("unknown error"))
            })
        {
            break;
        }
        match child.try_wait() {
            Ok(Some(_)) | Err(_) => {
                process_alive = false;
                break;
            }
            Ok(None) => process_alive = true,
        }
        std::thread::sleep(Duration::from_millis(20));
    }

    let tcp_connected = listener_started
        && TcpStream::connect_timeout(
            &(Ipv4Addr::LOCALHOST, candidate.port).into(),
            Duration::from_millis(500),
        )
        .is_ok();
    let authenticated_summary = tcp_connected
        && ReqwestLocalApiTransport::new()
            .and_then(|mut client| {
                client.get_summary("127.0.0.1", candidate.port, &candidate.token)
            })
            .is_ok();

    let dns_deadline = Instant::now() + Duration::from_secs(3);
    let mut dns_result = "expected .invalid failure not observed within bound";
    while Instant::now() < dns_deadline && !controller.cancelled() {
        if child.diagnostics().iter().any(|entry| {
            entry.message.contains(DIAGNOSTIC_POOL_HOST)
                && entry.message.to_ascii_lowercase().contains("dns error")
        }) {
            dns_result = "expected .invalid DNS failure observed";
            break;
        }
        if child.try_wait().ok().flatten().is_some() {
            process_alive = false;
            break;
        }
        std::thread::sleep(Duration::from_millis(20));
    }
    let cancelled = controller.cancelled();
    let stop_ok = child
        .stop_with(|_| Ok(()), Duration::from_millis(300))
        .is_ok();
    let reaped = child.try_wait().ok().flatten().is_some();
    let events = relevant_events(child.diagnostics());
    drop(child); // Closes Job Object ownership before deleting the private runtime.
    let runtime_cleanup = runtime.cleanup().is_ok();
    let cleanup_passed = stop_ok && reaped && runtime_cleanup;
    Ok(VariantEvidence {
        variant,
        api_port: candidate.port,
        threads: candidate.threads,
        process_created,
        process_alive,
        listener_started,
        tcp_connected,
        authenticated_summary,
        dns_result,
        cleanup_passed,
        cancelled,
        events,
    })
}

fn failed_before_spawn(
    variant: DiagnosticVariant,
    api_port: u16,
    threads: usize,
    cleanup_passed: bool,
) -> VariantEvidence {
    VariantEvidence {
        variant,
        api_port,
        threads,
        process_created: false,
        process_alive: false,
        listener_started: false,
        tcp_connected: false,
        authenticated_summary: false,
        dns_result: "not run",
        cleanup_passed,
        cancelled: false,
        events: Vec::new(),
    }
}

fn relevant_events(events: Vec<DiagnosticSummary>) -> Vec<DiagnosticSummary> {
    events
        .into_iter()
        .filter(|entry| {
            let lower = entry.message.to_ascii_lowercase();
            (lower.contains("http api")
                || lower.contains("dns error")
                || lower.contains("randomx")
                || lower.contains("cpu-backend")
                || lower.contains("config-error")
                || lower.contains("warning-or-error"))
                && !lower.contains("motherboard")
                && !lower.contains("dimm")
                && !lower.contains("serial")
                && !lower.contains("\\users\\")
        })
        .take(24)
        .collect()
}

impl IntegrationResult {
    fn report(&self) -> String {
        let mut report = format!(
            "XMRig integration test\nEmber version: {}\nOS version: {}\nExpected XMRig version: {}\nEngine verification: Passed\nMemory at launch: used={}, available={}\n",
            self.environment.ember_version,
            self.environment.os_version,
            provisioner::VERSION,
            format_bytes(self.environment.memory_used_bytes),
            format_bytes(self.environment.memory_available_bytes),
        );
        for evidence in &self.variants {
            report.push_str(&format!(
                "\nVariant: {}\nExpected XMRig version: {}\nImmediate artifact verification: Passed\nAPI endpoint: 127.0.0.1:{} (token omitted)\nDiagnostic CPU threads: {}\nMemory at launch: used={}, available={}\nProcess creation: {}\nProcess alive: {}\nHTTP listener: {}\nTCP loopback: {}\nAuthenticated /2/summary: {}\nSafe DNS result: {}\nCleanup: {}\nResult: {}\n",
                evidence.variant.label(),
                provisioner::VERSION,
                evidence.api_port,
                evidence.threads,
                format_bytes(self.environment.memory_used_bytes),
                format_bytes(self.environment.memory_available_bytes),
                pass_fail(evidence.process_created),
                pass_fail(evidence.process_alive),
                pass_fail(evidence.listener_started),
                pass_fail(evidence.tcp_connected),
                pass_fail(evidence.authenticated_summary),
                evidence.dns_result,
                pass_fail(evidence.cleanup_passed),
                if evidence.cancelled { "Cancelled" } else { pass_fail(evidence.passed()) },
            ));
            if !evidence.events.is_empty() {
                report.push_str("Sanitized relevant XMRig events:\n");
                for event in &evidence.events {
                    report.push_str(&format!("- {:?}: {}\n", event.source, event.message));
                }
            }
        }
        let outcome = outcome(&self.variants);
        report.push_str(&format!("\nOutcome: {outcome}\n"));
        report
    }
}

fn outcome(variants: &[VariantEvidence]) -> &'static str {
    if variants.iter().any(|item| item.cancelled) {
        return "Test cancelled; preserved completed evidence.";
    }
    let minimal = variants
        .iter()
        .find(|item| item.variant == DiagnosticVariant::Minimal)
        .is_some_and(VariantEvidence::passed);
    let quiet = variants
        .iter()
        .find(|item| item.variant == DiagnosticVariant::Quiet)
        .is_some_and(VariantEvidence::passed);
    match (minimal, quiet) {
        (true, true) => "A — both safe variants passed; compare remaining runtime differences with production Start.",
        (true, false) => "B — minimal passed and production-shaped Quiet failed; preserve this evidence.",
        (false, false) => "C — both variants failed on this machine; preserve listener and socket evidence.",
        (false, true) => "D — minimal failed and Quiet passed; unexpected result, preserve full sanitized evidence.",
    }
}

fn format_bytes(value: Option<u64>) -> String {
    value
        .map(|bytes| format!("{:.1} GiB", bytes as f64 / 1024.0 / 1024.0 / 1024.0))
        .unwrap_or_else(|| "unavailable".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn both_variants_are_inert_and_use_fresh_loopback_credentials() {
        let first = build_candidate(DiagnosticVariant::Minimal, 16).unwrap();
        let second = build_candidate(DiagnosticVariant::Quiet, 16).unwrap();
        for candidate in [&first, &second] {
            let json: serde_json::Value = serde_json::from_str(&candidate.json).unwrap();
            assert_eq!(json["donate-level"], 0);
            assert_eq!(json["http"]["host"], "127.0.0.1");
            assert_eq!(json["http"]["restricted"], true);
            assert_eq!(json["pools"][0]["url"], "does-not-exist.invalid:20128");
            assert_eq!(json["opencl"], false);
            assert_eq!(json["cuda"], false);
            assert_eq!(json["pools"][0]["user"], DIAGNOSTIC_WALLET);
            assert_ne!(json["pools"][0]["user"], "persisted-owner-wallet");
            assert!(!candidate.json.contains("moneroocean"));
        }
        assert_eq!(
            first.json.parse::<serde_json::Value>().unwrap()["cpu"]["enabled"],
            false
        );
        assert_eq!(
            second.json.parse::<serde_json::Value>().unwrap()["cpu"]["enabled"],
            true
        );
        assert_eq!(second.threads, 4);
        assert_ne!(first.token, second.token);
        assert_ne!(first.port, second.port);
    }

    #[test]
    fn controller_enforces_single_run_cancels_and_resets() {
        let controller = IntegrationTestController::default();
        controller.begin().unwrap();
        assert!(controller.begin().is_err());
        assert!(controller.is_running());
        controller.cancel();
        assert!(controller.cancelled());
        let result = IntegrationResult {
            environment: EnvironmentEvidence {
                ember_version: "test".into(),
                os_version: "test".into(),
                memory_used_bytes: None,
                memory_available_bytes: None,
                logical_processors: 4,
            },
            variants: vec![VariantEvidence {
                variant: DiagnosticVariant::Minimal,
                api_port: 50000,
                threads: 0,
                process_created: true,
                process_alive: true,
                listener_started: false,
                tcp_connected: false,
                authenticated_summary: false,
                dns_result: "not observed",
                cleanup_passed: true,
                cancelled: true,
                events: Vec::new(),
            }],
        };
        controller.finish(&result);
        assert!(!controller.status().running);
        assert_eq!(controller.status().cleanup, TestMark::Passed);
        controller.begin().unwrap();
        assert_eq!(controller.status().minimal_api_test, TestMark::NotRun);
    }

    #[test]
    fn production_and_diagnostic_lifecycles_are_mutually_exclusive() {
        let controller = IntegrationTestController::default();
        assert!(ensure_production_start_allowed(&controller).is_ok());
        controller.begin().unwrap();
        assert!(ensure_production_start_allowed(&controller).is_err());
        for state in [
            EngineLifecycleState::Starting,
            EngineLifecycleState::Mining,
            EngineLifecycleState::Paused,
            EngineLifecycleState::Stopping,
        ] {
            assert!(ensure_diagnostic_start_allowed(state, None).is_err());
        }
        assert!(ensure_diagnostic_start_allowed(EngineLifecycleState::Ready, Some(42)).is_err());
        assert!(ensure_diagnostic_start_allowed(EngineLifecycleState::Ready, None).is_ok());
    }

    #[test]
    fn failure_and_cancellation_require_successful_cleanup_to_pass() {
        let mut evidence = VariantEvidence {
            variant: DiagnosticVariant::Minimal,
            api_port: 50000,
            threads: 0,
            process_created: true,
            process_alive: true,
            listener_started: true,
            tcp_connected: true,
            authenticated_summary: true,
            dns_result: "expected failure observed",
            cleanup_passed: false,
            cancelled: false,
            events: Vec::new(),
        };
        assert!(!evidence.passed());
        evidence.cleanup_passed = true;
        assert!(evidence.passed());
        evidence.cancelled = true;
        assert!(!evidence.passed());
        assert_eq!(evidence.summary_lines()[0], "Minimal: Cancelled");
    }

    #[test]
    fn copied_report_never_contains_tokens_wallets_or_paths() {
        let candidate = build_candidate(DiagnosticVariant::Minimal, 8).unwrap();
        let result = IntegrationResult {
            environment: EnvironmentEvidence {
                ember_version: "0.1.0".into(),
                os_version: "Windows".into(),
                memory_used_bytes: Some(1),
                memory_available_bytes: Some(2),
                logical_processors: 8,
            },
            variants: vec![VariantEvidence {
                variant: DiagnosticVariant::Minimal,
                api_port: 50000,
                threads: 0,
                process_created: true,
                process_alive: true,
                listener_started: true,
                tcp_connected: true,
                authenticated_summary: true,
                dns_result: "expected .invalid DNS failure observed",
                cleanup_passed: true,
                cancelled: false,
                events: vec![DiagnosticSummary {
                    source: super::super::domain::DiagnosticSource::Stdout,
                    message: "http-listener-started: HTTP API 127.0.0.1:50000".into(),
                }],
            }],
        };
        let report = result.report();
        assert!(!report.contains(&candidate.token));
        assert!(!report.contains(DIAGNOSTIC_WALLET));
        assert!(!report.contains("C:\\Users\\"));
        assert!(report.contains("token omitted"));
    }
}
