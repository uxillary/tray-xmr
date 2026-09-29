#[allow(dead_code)] // M03B supervisor APIs are intentionally not exposed as start commands.
mod mining;
mod system_observation;

use mining::{domain::EngineLifecycleState, EngineSupervisor};
use std::sync::Mutex;
use system_observation::{SystemObserver, SystemSnapshot};

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

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![shell_status, system_snapshot])
        .setup(|app| {
            app.manage(Mutex::new(SystemObserver::new()));
            app.manage(EngineSupervisor::new());

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
        .run(tauri::generate_context!())
        .expect("failed to run Ember");
}
