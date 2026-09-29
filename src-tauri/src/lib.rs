#[allow(dead_code)] // M03B supervisor APIs are intentionally not exposed as start commands.
mod mining;
mod system_observation;

use mining::{domain::EngineLifecycleState, EngineSupervisor};
use std::sync::Mutex;
use system_observation::{SystemObserver, SystemSnapshot};

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
    let no_process = status.process_id.is_none() && status.error.is_none();
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
                status.process_id.is_none() && status.error.is_none(),
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
        update_mining_setup
    ]);
    #[cfg(not(windows))]
    let builder = builder.invoke_handler(tauri::generate_handler![shell_status, system_snapshot]);
    let app = builder
        .setup(|app| {
            app.manage(Mutex::new(SystemObserver::new()));
            app.manage(EngineSupervisor::new());
            #[cfg(windows)]
            {
                app.manage(Mutex::new(mining::readiness::SetupService::load(
                    app.path().local_data_dir()?.join("Ember"),
                )));
                // Verify at application startup; every subsequent readiness request verifies again.
                let _ = setup_snapshot(app.handle());
            }

            let status = MenuItem::with_id(app, "status", "Not mining", false, None::<&str>)?;
            let open = MenuItem::with_id(app, "open", "Open Ember", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Ember", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&status, &open, &quit])?;

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
                        let supervisor = app.state::<EngineSupervisor>();
                        if supervisor.stop_for_application_quit().is_ok() {
                            app.exit(0);
                        }
                    }
                    _ => {}
                })
                .build(app)?;

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
