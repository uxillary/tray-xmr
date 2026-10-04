#[allow(dead_code)] // M03B supervisor APIs are intentionally not exposed as start commands.
mod mining;
mod system_observation;

use mining::{domain::EngineLifecycleState, EngineSupervisor};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use system_observation::{SystemObserver, SystemSnapshot};

#[cfg(windows)]
struct ActiveSession {
    _runtime: mining::runtime::RuntimeSession,
    config: mining::domain::ValidatedMiningConfig,
    adapter: mining::xmrig::XmrigAdapter,
}

#[cfg(windows)]
#[derive(Clone)]
struct TrayMiningItems {
    status: tauri::menu::MenuItem<tauri::Wry>,
    stop: tauri::menu::MenuItem<tauri::Wry>,
}

#[cfg(windows)]
fn update_tray(app: &tauri::AppHandle, active: bool, failed: bool) {
    use tauri::Manager;
    if let Some(items) = app.try_state::<TrayMiningItems>() {
        let label = if active {
            "Mining"
        } else if failed {
            "Mining stopped unexpectedly"
        } else {
            "Not mining"
        };
        let _ = items.status.set_text(label);
        let _ = items.stop.set_enabled(active);
    }
}

#[cfg(windows)]
fn update_tray_starting(app: &tauri::AppHandle) {
    use tauri::Manager;
    if let Some(items) = app.try_state::<TrayMiningItems>() {
        let _ = items.status.set_text("Starting XMRig");
        let _ = items.stop.set_enabled(true);
    }
}

#[cfg(windows)]
fn stop_mining_sync(app: &tauri::AppHandle, quitting: bool) -> Result<(), String> {
    use mining::domain::StopReason;
    use tauri::Manager;
    let operation = app.state::<Mutex<()>>();
    app.state::<EngineSupervisor>().cancel_startup();
    let _operation = operation
        .lock()
        .map_err(|_| "Mining controls are temporarily unavailable")?;
    let supervisor = app.state::<EngineSupervisor>();
    let supervisor_status = supervisor.status();
    let stopped = if quitting {
        if supervisor_status.state == EngineLifecycleState::Starting
            || supervisor_status.startup_stage.is_some()
        {
            supervisor.stop_starting_for_application_quit()
        } else {
            supervisor.stop_for_application_quit()
        }
    } else if supervisor_status.state == EngineLifecycleState::Starting
        || supervisor_status.startup_stage.is_some()
    {
        supervisor.stop_starting()
    } else {
        supervisor.stop_with(StopReason::UserRequest, |_| Ok(()))
    };
    app.state::<Mutex<Option<ActiveSession>>>()
        .lock()
        .map_err(|_| "Mining session cleanup is unavailable")?
        .take();
    update_tray(app, false, stopped.is_err());
    stopped.map_err(|e| e.message)
}

#[cfg(windows)]
#[tauri::command]
async fn start_mining(app: tauri::AppHandle) -> Result<mining::readiness::MiningReadiness, String> {
    use mining::{
        diagnostics::RedactionSecrets,
        domain::EngineErrorKind,
        domain::StartupStage,
        process::SupervisedChild,
        provisioner,
        runtime::RuntimeSession,
        xmrig::{ReqwestLocalApiTransport, XmrigAdapter},
    };
    use std::{
        ffi::OsString,
        time::{Instant, SystemTime, UNIX_EPOCH},
    };
    use tauri::Manager;

    tauri::async_runtime::spawn_blocking(move || {
        let operation = app.state::<Mutex<()>>();
        let mut operation_guard = Some(operation
            .lock()
            .map_err(|_| "Mining controls are temporarily unavailable")?);
        mining::integration_diagnostic::ensure_production_start_allowed(
            &app.state::<mining::integration_diagnostic::IntegrationTestController>(),
        )?;
        if app
            .state::<Mutex<Option<ActiveSession>>>()
            .lock()
            .map_err(|_| "Mining session state unavailable")?
            .is_some()
        {
            return Err("A mining session is already active".to_owned());
        }
        let logical = app
            .state::<Mutex<SystemObserver>>()
            .lock()
            .map_err(|_| "System information unavailable")?
            .snapshot()
            .cpu
            .logical_processors
            .unwrap_or(0);
        let setup_state = app.state::<Mutex<mining::readiness::SetupService>>();
        let root = setup_state
            .lock()
            .map_err(|_| "Setup state unavailable")?
            .data_root()
            .to_owned();
        if app
            .state::<EngineSupervisor>()
            .status()
            .process_id
            .is_some()
        {
            return Err("Ember already owns an active XMRig process".to_owned());
        }
        let supervisor = app.state::<EngineSupervisor>();
        supervisor
            .try_begin_startup(StartupStage::CheckingEngine)
            .map_err(|error| error.message)?;
        update_tray_starting(&app);
        let verification_started = Instant::now();
        let initial = match provisioner::verify_installation(&root) {
            Ok(initial) => initial,
            Err(issue) => {
                supervisor.finish_startup();
                update_tray(&app, false, false);
                return Err(format!("{} ({issue})", issue.owner_message()));
            }
        };
        supervisor.record_startup_duration("InitialArtifactVerification", verification_started.elapsed().as_millis().min(u64::MAX as u128) as u64);
        if supervisor.startup_cancelled() {
            supervisor.finish_startup();
            update_tray(&app, false, false);
            return Err("Mining startup was stopped at your request.".into());
        }
        let executable = initial.executable_path();
        let artifact = initial.artifact();
        let adapter = match XmrigAdapter::new(artifact.clone()) {
            Ok(adapter) => adapter,
            Err(error) => { supervisor.finish_startup(); update_tray(&app, false, false); return Err(error.message); }
        };
        {
            supervisor.set_startup_stage(StartupStage::PreparingSession);
            let candidate_started = Instant::now();
            let setup = setup_state
                .lock()
                .map_err(|_| "Setup state unavailable")?;
            let mut candidate = match setup.prepare_start(logical) {
                Ok(candidate) => candidate,
                Err(error) => { supervisor.finish_startup(); update_tray(&app, false, false); return Err(error); }
            };
            supervisor.record_startup_duration("CandidateConfigAndConsentPreparation", candidate_started.elapsed().as_millis().min(u64::MAX as u128) as u64);
            if supervisor.startup_cancelled() {
                supervisor.finish_startup();
                update_tray(&app, false, false);
                return Err("Mining startup was stopped at your request.".into());
            }
            let runtime = match RuntimeSession::create(&root, candidate.config_json()) {
                Ok(runtime) => runtime,
                Err(_) => { supervisor.finish_startup(); update_tray(&app, false, false); return Err("Private mining runtime could not be created".to_owned()); }
            };
            supervisor.record_startup_timings(runtime.creation_timings());
            drop(setup);
            if supervisor.startup_cancelled() {
                drop(runtime);
                supervisor.finish_startup();
                update_tray(&app, false, false);
                return Err("Mining startup was stopped at your request.".into());
            }
            let config = candidate.validated.clone();
            let token = config.config.api.access_token.clone();
            let wallet = config.config.public_address.clone();
            let mut transport = match ReqwestLocalApiTransport::new() {
                Ok(transport) => transport,
                Err(_) => { supervisor.finish_startup(); update_tray(&app, false, false); return Err("Local mining telemetry could not be initialized".to_owned()); }
            };
            if let Err(error) = supervisor.configure_ready(&artifact, &config) {
                supervisor.finish_startup();
                update_tray(&app, false, false);
                return Err(error.message);
            }
            let config_path = runtime.config_path().to_owned();
            let working_directory = runtime.working_directory().to_owned();
            let arguments = vec![
                OsString::from("--config"),
                config_path.as_os_str().to_owned(),
            ];
            let api_config = config.clone();
            let poll_adapter = adapter.clone();
            let secrets = RedactionSecrets::new([token, wallet]);
            candidate.release_port();
            *app.state::<Mutex<Option<ActiveSession>>>()
                .lock()
                .map_err(|_| "Mining session state unavailable")? = Some(ActiveSession {
                _runtime: runtime,
                config: config.clone(),
                adapter: adapter.clone(),
            });
            // The supervisor and active-session slot now own the process lifecycle
            // and its private runtime. Stop can acquire app controls while readiness polls.
            drop(operation_guard.take());
            let spawn_root = root.clone();
            let spawn_initial = initial.clone();
            let supervisor_for_spawn = &*supervisor;
            let started = supervisor.start_with(
                &artifact,
                &config,
                &executable,
                &arguments,
                &working_directory,
                secrets,
                move |path, args, cwd, redaction| {
                    supervisor_for_spawn.set_startup_stage(StartupStage::CheckingEngine);
                    let pre_spawn_started = Instant::now();
                    let verified = provisioner::verify_installation(&spawn_root).map_err(|issue| {
                        mining::domain::EngineError {
                            kind: EngineErrorKind::UntrustedArtifact,
                            message: format!("{} ({issue})", issue.owner_message()),
                        }
                    })?;
                    if !verified.same_installation(&spawn_initial) {
                        return Err(mining::domain::EngineError {
                            kind: EngineErrorKind::UntrustedArtifact,
                            message: "The verified XMRig installation changed before process creation. Repair the mining engine before starting.".into(),
                        });
                    }
                    if supervisor_for_spawn.startup_cancelled() {
                        return Err(mining::domain::EngineError {
                            kind: EngineErrorKind::StartupCancelled,
                            message: "Mining startup was stopped at your request.".into(),
                        });
                    }
                    supervisor_for_spawn.record_startup_duration("ImmediatePreSpawnVerification", pre_spawn_started.elapsed().as_millis().min(u64::MAX as u128) as u64);
                    supervisor_for_spawn.set_startup_stage(StartupStage::StartingXmrig);
                    SupervisedChild::spawn(path, args, cwd, redaction)
                },
                move || {
                    let now = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .ok()
                        .map(|d| d.as_millis().min(u64::MAX as u128) as u64);
                    poll_adapter.telemetry(&api_config, &mut transport, now)
                },
            );
            match started {
                Ok(()) => {
                    supervisor.finish_startup();
                    if supervisor.status().state == EngineLifecycleState::Mining {
                        update_tray(&app, true, false);
                    }
                    return setup_snapshot(&app);
                }
                Err(error) => {
                    app.state::<Mutex<Option<ActiveSession>>>()
                        .lock()
                        .map_err(|_| "Mining session cleanup is unavailable")?
                        .take();
                    supervisor.finish_startup();
                    update_tray(&app, false, false);
                    return Err(error.message);
                }
            }
        }
    })
    .await
    .map_err(|_| "Mining start failed unexpectedly".to_owned())?
}

#[cfg(windows)]
#[tauri::command]
async fn stop_mining(app: tauri::AppHandle) -> Result<mining::readiness::MiningReadiness, String> {
    tauri::async_runtime::spawn_blocking(move || {
        stop_mining_sync(&app, false)?;
        setup_snapshot(&app)
    })
    .await
    .map_err(|_| "Mining stop failed unexpectedly".to_owned())?
}

#[cfg(windows)]
#[tauri::command]
async fn start_xmrig_integration_test(
    app: tauri::AppHandle,
) -> Result<mining::integration_diagnostic::IntegrationTestStatus, String> {
    use mining::integration_diagnostic::{EnvironmentEvidence, IntegrationTestController};
    use tauri::Manager;

    tauri::async_runtime::spawn_blocking(move || {
        let operation = app.state::<Mutex<()>>();
        let operation_guard = operation
            .lock()
            .map_err(|_| "Mining controls are temporarily unavailable")?;
        let supervisor_status = app.state::<EngineSupervisor>().status();
        mining::integration_diagnostic::ensure_diagnostic_start_allowed(
            supervisor_status.state,
            supervisor_status.process_id,
        )?;
        let controller = app.state::<IntegrationTestController>();
        let root = app
            .state::<Mutex<mining::readiness::SetupService>>()
            .lock()
            .map_err(|_| "Setup state unavailable")?
            .data_root()
            .to_owned();
        let snapshot = app
            .state::<Mutex<SystemObserver>>()
            .lock()
            .map_err(|_| "System information unavailable")?
            .snapshot();
        controller.begin()?;
        drop(operation_guard);

        let initial = match mining::provisioner::verify_installation(&root) {
            Ok(verified) if verified.metadata().version == mining::provisioner::VERSION => verified,
            Ok(_) => {
                let message = "The installed XMRig version is not the required 6.26.0".to_owned();
                controller.verification_failed(
                    message.clone(),
                    format!("XMRig integration test\nEmber version: {}\nExpected XMRig version: 6.26.0\nEngine verification: Failed\nReason: {message}\nCleanup: Passed\n", env!("CARGO_PKG_VERSION")),
                );
                return Ok(controller.status());
            }
            Err(issue) => {
                let message = format!("{} ({issue})", issue.owner_message());
                controller.verification_failed(
                    message.clone(),
                    format!("XMRig integration test\nEmber version: {}\nExpected XMRig version: 6.26.0\nEngine verification: Failed\nReason: {message}\nCleanup: Passed\n", env!("CARGO_PKG_VERSION")),
                );
                return Ok(controller.status());
            }
        };
        let memory_available = match (snapshot.memory.total_bytes, snapshot.memory.used_bytes) {
            (Some(total), Some(used)) => Some(total.saturating_sub(used)),
            _ => None,
        };
        let evidence = EnvironmentEvidence {
            ember_version: env!("CARGO_PKG_VERSION").into(),
            os_version: snapshot
                .os
                .unwrap_or_else(|| "Windows (version unavailable)".into()),
            memory_used_bytes: snapshot.memory.used_bytes,
            memory_available_bytes: memory_available,
            logical_processors: snapshot.cpu.logical_processors.unwrap_or(1),
        };
        match mining::integration_diagnostic::execute(&root, &initial, evidence, &controller) {
            Ok(status) => Ok(status),
            Err(message) => {
                controller.execution_failed(
                    message.clone(),
                    format!("XMRig integration test\nEmber version: {}\nExpected XMRig version: 6.26.0\nEngine verification: Passed\nTest execution: Failed\nReason: {message}\nCleanup: Failed or unconfirmed\n", env!("CARGO_PKG_VERSION")),
                );
                Ok(controller.status())
            }
        }
    })
    .await
    .map_err(|_| "The XMRig integration test failed unexpectedly".to_owned())?
}

#[cfg(windows)]
#[tauri::command]
fn xmrig_integration_test_status(
    controller: tauri::State<'_, mining::integration_diagnostic::IntegrationTestController>,
) -> mining::integration_diagnostic::IntegrationTestStatus {
    controller.status()
}

#[cfg(windows)]
#[tauri::command]
async fn stop_xmrig_integration_test(
    app: tauri::AppHandle,
) -> Result<mining::integration_diagnostic::IntegrationTestStatus, String> {
    use tauri::Manager;
    tauri::async_runtime::spawn_blocking(move || {
        let controller = app.state::<mining::integration_diagnostic::IntegrationTestController>();
        controller.cancel();
        let started = std::time::Instant::now();
        while controller.is_running() && started.elapsed() < std::time::Duration::from_secs(8) {
            std::thread::sleep(std::time::Duration::from_millis(25));
        }
        if controller.is_running() {
            Err("The test is still stopping; Ember retains ownership of XMRig".into())
        } else {
            Ok(controller.status())
        }
    })
    .await
    .map_err(|_| "The integration test stop failed unexpectedly".to_owned())?
}

#[cfg(windows)]
#[tauri::command]
fn copy_xmrig_integration_report(
    controller: tauri::State<'_, mining::integration_diagnostic::IntegrationTestController>,
) -> Result<String, String> {
    controller
        .report()
        .ok_or_else(|| "Run the XMRig integration test before copying its report".into())
}

#[cfg(windows)]
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct MiningSessionStatus {
    state: EngineLifecycleState,
    process_id: Option<u32>,
    telemetry: Option<mining::domain::MiningTelemetry>,
    error: Option<mining::domain::EngineError>,
    diagnostics: Vec<mining::domain::DiagnosticSummary>,
    capture_health: Option<mining::domain::CaptureHealth>,
    startup_stage: Option<mining::domain::StartupStage>,
    startup_elapsed_ms: Option<u64>,
    startup_timings: Vec<mining::domain::StartupTiming>,
}

#[cfg(windows)]
#[tauri::command]
fn mining_status(
    supervisor: tauri::State<'_, EngineSupervisor>,
    diagnostics_mode: bool,
) -> MiningSessionStatus {
    let status = supervisor.status();
    MiningSessionStatus {
        state: status.state,
        process_id: status.process_id,
        telemetry: supervisor.telemetry(),
        error: status.error,
        // Process output and its sanitized event tail stay in Rust. The normal
        // status IPC returns supervisor-owned progress only.
        diagnostics: status
            .diagnostics
            .into_iter()
            .filter(|entry| {
                diagnostics_mode || entry.source == mining::domain::DiagnosticSource::Supervisor
            })
            .collect(),
        capture_health: diagnostics_mode.then_some(status.capture_health),
        startup_stage: status.startup_stage,
        startup_elapsed_ms: status.startup_elapsed_ms,
        startup_timings: status.startup_timings,
    }
}

#[cfg(windows)]
#[tauri::command]
fn copy_diagnostics(
    app: tauri::AppHandle,
    supervisor: tauri::State<'_, EngineSupervisor>,
) -> String {
    use tauri::Manager;
    let status = supervisor.status();
    let state = format!("{:?}", status.state);
    let stage = status
        .startup_stage
        .map(|stage| format!("{stage:?}"))
        .unwrap_or_else(|| "none".into());
    let system = app
        .state::<Mutex<SystemObserver>>()
        .lock()
        .ok()
        .map(|mut observer| observer.snapshot());
    let setup = setup_snapshot(&app).ok();
    let os = system
        .as_ref()
        .and_then(|snapshot| snapshot.os.as_deref())
        .unwrap_or("Windows (version unavailable)");
    let logical_processors = system
        .as_ref()
        .and_then(|snapshot| snapshot.cpu.logical_processors)
        .map(|count| count.to_string())
        .unwrap_or_else(|| "unavailable".into());
    let profile = setup
        .as_ref()
        .and_then(|setup| setup.profile.map(|profile| format!("{profile:?}")))
        .unwrap_or_else(|| "unavailable".into());
    let threads = setup
        .as_ref()
        .and_then(|setup| setup.threads)
        .map(|count| count.to_string())
        .unwrap_or_else(|| "unavailable".into());
    let mut report = format!(
        "Ember {}\nOS: {os}\nExpected XMRig: 6.26.0\nLifecycle: {state}\nSelected profile: {profile}\nCPU threads: {threads} of {logical_processors}\nStartup stage: {stage}\nProcess alive: {}\n",
        env!("CARGO_PKG_VERSION"),
        status.process_id.is_some()
    );
    if let Some(error) = &status.error {
        report.push_str(&format!("Error category: {:?}\n", error.kind));
    }
    report.push_str("Stage timings (ms):\n");
    for timing in &status.startup_timings {
        report.push_str(&format!("- {}: {}\n", timing.stage, timing.elapsed_ms));
    }
    append_capture_diagnostics(&mut report, &status);
    report
}

fn append_capture_diagnostics(report: &mut String, status: &mining::domain::EngineStatus) {
    let health = &status.capture_health;
    report.push_str(&format!(
        "Capture health: stdout reader started={}, stderr reader started={}, sanitized lines observed={}, stdout EOF={}, stderr EOF={}, stdout read error={}, stderr read error={}\n",
        health.stdout_reader_started,
        health.stderr_reader_started,
        health.sanitized_lines_observed,
        health.stdout_eof_observed,
        health.stderr_eof_observed,
        health.stdout_read_error.as_deref().unwrap_or("none"),
        health.stderr_read_error.as_deref().unwrap_or("none"),
    ));
    report.push_str("Sanitized diagnostic events:\n");
    for entry in status.diagnostics.iter().rev().take(100).rev() {
        // Never include process output in the general IPC status. Copy diagnostics
        // explicitly returns the Rust-redacted bounded event tail to the clipboard.
        let message = mining::diagnostics::RedactionSecrets::new([]).redact(&entry.message);
        report.push_str(&format!("- {:?}: {message}\n", entry.source));
    }
}

#[cfg(windows)]
fn monitor_mining(app: tauri::AppHandle, running: std::sync::Arc<AtomicBool>) {
    use mining::xmrig::ReqwestLocalApiTransport;
    use tauri::Manager;
    std::thread::spawn(move || {
        while running.load(Ordering::Relaxed) {
            std::thread::sleep(std::time::Duration::from_secs(1));
            if !running.load(Ordering::Relaxed) {
                break;
            }
            let supervisor = app.state::<EngineSupervisor>();
            let status = supervisor.status();
            if status.process_id.is_none() || status.state != EngineLifecycleState::Mining {
                continue;
            }
            let active_state = app.state::<Mutex<Option<ActiveSession>>>();
            let mut active = match active_state.lock() {
                Ok(active) => active,
                Err(_) => continue,
            };
            let Some(session) = active.as_mut() else {
                continue;
            };
            if let Ok(Some(_)) = supervisor.poll_unexpected_exit() {
                active.take();
                update_tray(&app, false, true);
                continue;
            }
            if let Ok(mut transport) = ReqwestLocalApiTransport::new() {
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .ok()
                    .map(|d| d.as_millis().min(u64::MAX as u128) as u64);
                if let Ok(telemetry) =
                    session
                        .adapter
                        .telemetry(&session.config, &mut transport, now)
                {
                    supervisor.update_telemetry(telemetry);
                }
            }
        }
    });
}

#[cfg(windows)]
#[tauri::command]
async fn provision_xmrig(
    app: tauri::AppHandle,
) -> Result<mining::provisioner::InstalledEngine, String> {
    use tauri::Manager;
    let root = app
        .path()
        .local_data_dir()
        .map_err(|_| "Ember could not access local application storage".to_owned())?
        .join("Ember");
    tauri::async_runtime::spawn_blocking(move || {
        let setup = app.state::<Mutex<mining::readiness::SetupService>>();
        let _guard = setup
            .lock()
            .map_err(|_| anyhow::anyhow!("Setup state unavailable"))?;
        if app
            .state::<EngineSupervisor>()
            .status()
            .process_id
            .is_some()
            || app
                .state::<mining::integration_diagnostic::IntegrationTestController>()
                .is_running()
        {
            anyhow::bail!("Engine is active");
        }
        mining::provisioner::repair(&root)
    })
    .await
    .map_err(|_| "XMRig setup failed unexpectedly. You can retry.".to_owned())?
    .map_err(|_| {
        "XMRig setup failed. Check the connection and available storage, then retry.".to_owned()
    })
}

#[cfg(windows)]
fn setup_snapshot(app: &tauri::AppHandle) -> Result<mining::readiness::MiningReadiness, String> {
    use tauri::Manager;
    let logical = app
        .state::<Mutex<SystemObserver>>()
        .lock()
        .map_err(|_| "System information unavailable")?
        .snapshot()
        .cpu
        .logical_processors
        .unwrap_or(0);
    let status = app.state::<EngineSupervisor>().status();
    let diagnostic_running = app
        .state::<mining::integration_diagnostic::IntegrationTestController>()
        .is_running();
    let no_process = !diagnostic_running
        && status.process_id.is_none()
        && !matches!(
            status.state,
            EngineLifecycleState::Starting
                | EngineLifecycleState::Mining
                | EngineLifecycleState::Paused
                | EngineLifecycleState::Stopping
        );
    app.state::<Mutex<mining::readiness::SetupService>>()
        .lock()
        .map_err(|_| "Setup state unavailable".into())
        .map(|setup| setup.snapshot(logical, no_process))
}

#[cfg(windows)]
#[tauri::command]
async fn mining_readiness(
    app: tauri::AppHandle,
) -> Result<mining::readiness::MiningReadiness, String> {
    tauri::async_runtime::spawn_blocking(move || setup_snapshot(&app))
        .await
        .map_err(|_| "Setup verification failed".to_owned())?
}

#[cfg(windows)]
#[tauri::command]
async fn update_mining_setup(
    app: tauri::AppHandle,
    change: mining::readiness::SetupChange,
) -> Result<mining::readiness::MiningReadiness, String> {
    use tauri::Manager;
    tauri::async_runtime::spawn_blocking(move || {
        let logical = app
            .state::<Mutex<SystemObserver>>()
            .lock()
            .map_err(|_| "System information unavailable")?
            .snapshot()
            .cpu
            .logical_processors
            .unwrap_or(0);
        let status = app.state::<EngineSupervisor>().status();
        let diagnostic_running = app
            .state::<mining::integration_diagnostic::IntegrationTestController>()
            .is_running();
        app.state::<Mutex<mining::readiness::SetupService>>()
            .lock()
            .map_err(|_| "Setup state unavailable".to_owned())?
            .update(
                change,
                logical,
                !diagnostic_running
                    && status.process_id.is_none()
                    && !matches!(
                        status.state,
                        EngineLifecycleState::Starting
                            | EngineLifecycleState::Mining
                            | EngineLifecycleState::Paused
                            | EngineLifecycleState::Stopping
                    ),
            )
    })
    .await
    .map_err(|_| "Setup update failed".to_owned())?
}

#[tauri::command]
fn shell_status(supervisor: tauri::State<'_, EngineSupervisor>) -> &'static str {
    match supervisor.status().state {
        EngineLifecycleState::Ready => "ready",
        EngineLifecycleState::Mining => "mining",
        EngineLifecycleState::Paused => "paused",
        EngineLifecycleState::Error => "error",
        EngineLifecycleState::Unavailable
        | EngineLifecycleState::NotConfigured
        | EngineLifecycleState::Starting
        | EngineLifecycleState::Stopping
        | EngineLifecycleState::Stopped => "notConfigured",
    }
}

#[tauri::command]
fn system_snapshot(
    observer: tauri::State<'_, Mutex<SystemObserver>>,
) -> Result<SystemSnapshot, String> {
    observer
        .lock()
        .map(|mut observer| observer.snapshot())
        .map_err(|_| "System observation is temporarily unavailable".to_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::TrayIconBuilder;
    use tauri::{Manager, WindowEvent};

    let builder = tauri::Builder::default();
    #[cfg(windows)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        shell_status,
        system_snapshot,
        provision_xmrig,
        mining_readiness,
        update_mining_setup,
        start_mining,
        stop_mining,
        mining_status,
        copy_diagnostics,
        start_xmrig_integration_test,
        stop_xmrig_integration_test,
        xmrig_integration_test_status,
        copy_xmrig_integration_report
    ]);
    #[cfg(not(windows))]
    let builder = builder.invoke_handler(tauri::generate_handler![shell_status, system_snapshot]);
    let app = builder
        .setup(|app| {
            app.manage(Mutex::new(SystemObserver::new()));
            app.manage(EngineSupervisor::new());
            #[cfg(windows)]
            {
                app.manage(Mutex::new(()));
                app.manage(Mutex::new(None::<ActiveSession>));
                app.manage(mining::integration_diagnostic::IntegrationTestController::default());
                let ember_data_dir = app.path().local_data_dir()?.join("Ember");
                // Startup recovery deletes only validated child session directories
                // after rejecting reparse-point paths beneath the Ember runtime root.
                let _ = mining::runtime::cleanup_stale(&ember_data_dir);
                app.manage(Mutex::new(mining::readiness::SetupService::load(
                    ember_data_dir,
                )));
                // Verify at application startup; every subsequent readiness request verifies again.
                let _ = setup_snapshot(app.handle());
            }

            let status = MenuItem::with_id(app, "status", "Not mining", false, None::<&str>)?;
            let stop = MenuItem::with_id(app, "stop", "Stop mining", false, None::<&str>)?;
            let open = MenuItem::with_id(app, "open", "Open Ember", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Ember", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&status, &stop, &open, &quit])?;

            #[cfg(windows)]
            app.manage(TrayMiningItems {
                status: status.clone(),
                stop: stop.clone(),
            });

            TrayIconBuilder::new()
                .tooltip("Ember — Not mining")
                .icon(
                    app.default_window_icon()
                        .expect("Ember app icon is configured")
                        .clone(),
                )
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        #[cfg(windows)]
                        let stopped = {
                            let diagnostic = app.state::<mining::integration_diagnostic::IntegrationTestController>();
                            diagnostic.cancel();
                            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(8);
                            while diagnostic.is_running() && std::time::Instant::now() < deadline {
                                std::thread::sleep(std::time::Duration::from_millis(25));
                            }
                            !diagnostic.is_running() && stop_mining_sync(app, true).is_ok()
                        };
                        #[cfg(not(windows))]
                        let supervisor = app.state::<EngineSupervisor>();
                        #[cfg(not(windows))]
                        let stopped = supervisor.stop_for_application_quit().is_ok();
                        if stopped {
                            app.exit(0);
                        }
                    }
                    "stop" => {
                        #[cfg(windows)]
                        {
                            let _ = stop_mining_sync(app, false);
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            #[cfg(windows)]
            {
                let running = std::sync::Arc::new(AtomicBool::new(true));
                app.manage(running.clone());
                monitor_mining(app.handle().clone(), running);
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("failed to build Ember");
    app.run(|app, event| {
        #[cfg(windows)]
        if matches!(event, tauri::RunEvent::Exit) {
            if let Some(running) = app.try_state::<std::sync::Arc<AtomicBool>>() {
                running.store(false, Ordering::Relaxed);
            }
        }
        if let tauri::RunEvent::ExitRequested { api, .. } = event {
            #[cfg(windows)]
            {
                let diagnostic =
                    app.state::<mining::integration_diagnostic::IntegrationTestController>();
                diagnostic.cancel();
                if diagnostic.is_running() {
                    api.prevent_exit();
                    return;
                }
            }
            if app
                .state::<EngineSupervisor>()
                .stop_for_application_quit()
                .is_err()
            {
                api.prevent_exit();
            }
        }
    });
}

#[cfg(test)]
mod capture_report_tests {
    use super::append_capture_diagnostics;
    use crate::mining::{
        diagnostics::{DiagnosticRing, RedactionSecrets},
        domain::{
            CaptureHealth, DiagnosticSource, EngineAvailability, EngineLifecycleState, EngineStatus,
        },
    };

    #[test]
    fn copy_diagnostics_renders_capture_health_and_sanitized_live_events() {
        let wallet = "TEST_PUBLIC_WALLET_ADDRESS_ONLY_FOR_REDACTION_TEST";
        let token = "private-token-012345678901234567890";
        let mut ring = DiagnosticRing::new(
            100,
            32 * 1024,
            RedactionSecrets::new([wallet.into(), token.into()]),
        );
        ring.push(
            DiagnosticSource::Stdout,
            &format!("HTTP API 127.0.0.1:58670 bind failed wallet={wallet} token={token}"),
        );
        let status = EngineStatus {
            availability: EngineAvailability::Available("6.26.0".into()),
            state: EngineLifecycleState::Starting,
            process_id: Some(1234),
            error: None,
            diagnostics: ring.snapshot(),
            capture_health: CaptureHealth {
                stdout_reader_started: true,
                stderr_reader_started: true,
                sanitized_lines_observed: 1,
                ..CaptureHealth::default()
            },
            startup_stage: None,
            startup_elapsed_ms: Some(15_000),
            startup_timings: Vec::new(),
        };
        let mut report = String::new();
        append_capture_diagnostics(&mut report, &status);
        assert!(report.contains("stdout reader started=true"));
        assert!(report.contains("sanitized lines observed=1"));
        assert!(report.contains("HTTP API 127.0.0.1:58670 bind failed"));
        assert!(!report.contains(wallet));
        assert!(!report.contains(token));
    }
}
