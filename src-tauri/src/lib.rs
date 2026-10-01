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
    let stopped = if quitting {
        supervisor.stop_for_application_quit()
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
        let _operation = operation
            .lock()
            .map_err(|_| "Mining controls are temporarily unavailable")?;
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
        let setup = app.state::<Mutex<mining::readiness::SetupService>>();
        let setup = setup.lock().map_err(|_| "Setup state unavailable")?;
        let root = setup.data_root().to_owned();
        if app
            .state::<EngineSupervisor>()
            .status()
            .process_id
            .is_some()
        {
            return Err("Ember already owns an active XMRig process".to_owned());
        }
        let supervisor = app.state::<EngineSupervisor>();
        supervisor.begin_startup(StartupStage::CheckingEngine);
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
        let executable = initial.executable_path();
        let artifact = initial.artifact();
        let adapter = match XmrigAdapter::new(artifact.clone()) {
            Ok(adapter) => adapter,
            Err(error) => { supervisor.finish_startup(); update_tray(&app, false, false); return Err(error.message); }
        };
        let mut last_error = None;
        for attempt in 0..3 {
            supervisor.set_startup_stage(StartupStage::PreparingSession);
            let candidate_started = Instant::now();
            let mut candidate = match setup.prepare_start(logical) {
                Ok(candidate) => candidate,
                Err(error) => { supervisor.finish_startup(); update_tray(&app, false, false); return Err(error); }
            };
            supervisor.record_startup_duration("CandidateConfigAndConsentPreparation", candidate_started.elapsed().as_millis().min(u64::MAX as u128) as u64);
            let runtime = match RuntimeSession::create(&root, candidate.config_json()) {
                Ok(runtime) => runtime,
                Err(_) => { supervisor.finish_startup(); update_tray(&app, false, false); return Err("Private mining runtime could not be created".to_owned()); }
            };
            supervisor.record_startup_timings(runtime.creation_timings());
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
                    *app.state::<Mutex<Option<ActiveSession>>>()
                        .lock()
                        .map_err(|_| "Mining session state unavailable")? = Some(ActiveSession {
                        _runtime: runtime,
                        config,
                        adapter,
                    });
                    update_tray(&app, true, false);
                    return Ok(setup.snapshot(logical, false));
                }
                Err(error) => {
                    let retryable = error.kind == EngineErrorKind::ApiUnavailable;
                    last_error = Some(error.message);
                    drop(runtime);
                    if !retryable || attempt == 2 {
                        break;
                    }
                }
            }
        }
        supervisor.finish_startup();
        update_tray(&app, false, true);
        Err(last_error.unwrap_or_else(|| "Mining could not be started".into()))
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
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct MiningSessionStatus {
    state: EngineLifecycleState,
    telemetry: Option<mining::domain::MiningTelemetry>,
    error: Option<mining::domain::EngineError>,
    startup_stage: Option<mining::domain::StartupStage>,
    startup_elapsed_ms: Option<u64>,
    startup_timings: Vec<mining::domain::StartupTiming>,
}

#[cfg(windows)]
#[tauri::command]
fn mining_status(supervisor: tauri::State<'_, EngineSupervisor>) -> MiningSessionStatus {
    let status = supervisor.status();
    MiningSessionStatus {
        state: status.state,
        telemetry: supervisor.telemetry(),
        error: status.error,
        startup_stage: status.startup_stage,
        startup_elapsed_ms: status.startup_elapsed_ms,
        startup_timings: status.startup_timings,
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
            if supervisor.status().process_id.is_none() {
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
    let no_process = status.process_id.is_none()
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
        app.state::<Mutex<mining::readiness::SetupService>>()
            .lock()
            .map_err(|_| "Setup state unavailable".to_owned())?
            .update(
                change,
                logical,
                status.process_id.is_none()
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
        mining_status
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
                        let stopped = stop_mining_sync(app, true).is_ok();
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
