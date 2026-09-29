use serde::Serialize;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, System};

pub const IDLE_THRESHOLD_SECONDS: u64 = 5 * 60;
const CPU_REFRESH_INTERVAL: std::time::Duration = sysinfo::MINIMUM_CPU_UPDATE_INTERVAL;

#[derive(Clone, Copy, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ActivityState {
    Active,
    Idle,
    Unknown,
}

#[derive(Clone, Copy, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum PowerSource {
    External,
    Battery,
    NotApplicable,
    Unknown,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuSnapshot {
    pub model: Option<String>,
    pub logical_processors: Option<usize>,
    pub usage_percent: Option<f32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySnapshot {
    pub used_bytes: Option<u64>,
    pub total_bytes: Option<u64>,
    pub usage_percent: Option<f32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PowerSnapshot {
    pub source: PowerSource,
    pub battery_percent: Option<u8>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivitySnapshot {
    pub idle_seconds: Option<u64>,
    pub state: ActivityState,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSnapshot {
    pub device_name: Option<String>,
    pub os: Option<String>,
    pub cpu: CpuSnapshot,
    pub memory: MemorySnapshot,
    pub uptime_seconds: Option<u64>,
    pub power: PowerSnapshot,
    pub activity: ActivitySnapshot,
    pub sampled_at_unix_ms: Option<u64>,
}

pub struct SystemObserver {
    system: System,
    cpu_model: Option<String>,
    logical_processors: Option<usize>,
    device_name: Option<String>,
    os: Option<String>,
    last_cpu_sample: Instant,
    cpu_usage_ready: bool,
}

impl SystemObserver {
    pub fn new() -> Self {
        let mut system = System::new();
        system.refresh_cpu_list(CpuRefreshKind::everything().without_frequency());
        system.refresh_memory_specifics(MemoryRefreshKind::nothing().with_ram());

        let cpu_model = system
            .cpus()
            .iter()
            .map(|cpu| cpu.brand().trim())
            .find(|brand| !brand.is_empty())
            .map(ToOwned::to_owned);
        let logical_processors = (system.cpus().len() > 0).then_some(system.cpus().len());
        let device_name = System::host_name().filter(|name| !name.trim().is_empty());
        let os = match (System::long_os_version(), System::os_version()) {
            (Some(long), _) if !long.trim().is_empty() => Some(long),
            (_, Some(version)) if !version.trim().is_empty() => Some(version),
            _ => System::name().filter(|name| !name.trim().is_empty()),
        };

        Self {
            system,
            cpu_model,
            logical_processors,
            device_name,
            os,
            last_cpu_sample: Instant::now(),
            cpu_usage_ready: false,
        }
    }

    pub fn snapshot(&mut self) -> SystemSnapshot {
        self.system
            .refresh_memory_specifics(MemoryRefreshKind::nothing().with_ram());

        if self.last_cpu_sample.elapsed() >= CPU_REFRESH_INTERVAL {
            self.system.refresh_cpu_usage();
            self.last_cpu_sample = Instant::now();
            self.cpu_usage_ready = !self.system.cpus().is_empty();
        }

        let total_memory = nonzero(self.system.total_memory());
        let used_memory = total_memory.map(|_| self.system.used_memory());
        let memory_usage = total_memory.and_then(|total| {
            percentage((used_memory.unwrap_or_default() as f64 / total as f64) * 100.0)
        });

        let cpu_usage = if self.cpu_usage_ready {
            percentage(self.system.global_cpu_usage() as f64)
        } else {
            None
        };

        let idle_seconds = query_idle_seconds();

        SystemSnapshot {
            device_name: self.device_name.clone(),
            os: self.os.clone(),
            cpu: CpuSnapshot {
                model: self.cpu_model.clone(),
                logical_processors: self.logical_processors,
                usage_percent: cpu_usage,
            },
            memory: MemorySnapshot {
                used_bytes: used_memory,
                total_bytes: total_memory,
                usage_percent: memory_usage,
            },
            uptime_seconds: Some(System::uptime()),
            power: query_power_status(),
            activity: ActivitySnapshot {
                idle_seconds,
                state: activity_state(idle_seconds),
            },
            sampled_at_unix_ms: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .ok()
                .and_then(|duration| u64::try_from(duration.as_millis()).ok()),
        }
    }
}

fn nonzero(value: u64) -> Option<u64> {
    (value > 0).then_some(value)
}

fn percentage(value: f64) -> Option<f32> {
    value.is_finite().then(|| value.clamp(0.0, 100.0) as f32)
}

fn activity_state(idle_seconds: Option<u64>) -> ActivityState {
    match idle_seconds {
        Some(seconds) if seconds >= IDLE_THRESHOLD_SECONDS => ActivityState::Idle,
        Some(_) => ActivityState::Active,
        None => ActivityState::Unknown,
    }
}

#[cfg(windows)]
fn query_idle_seconds() -> Option<u64> {
    use std::mem::size_of;
    use windows_sys::Win32::System::SystemInformation::GetTickCount;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    let mut last_input = LASTINPUTINFO {
        cbSize: size_of::<LASTINPUTINFO>() as u32,
        dwTime: 0,
    };
    // GetLastInputInfo is session-specific and reports only the last input tick, not input content.
    let succeeded = unsafe { GetLastInputInfo(&mut last_input) };
    if succeeded == 0 {
        return None;
    }

    let elapsed_ms = unsafe { GetTickCount() }.wrapping_sub(last_input.dwTime);
    Some(u64::from(elapsed_ms / 1_000))
}

#[cfg(not(windows))]
fn query_idle_seconds() -> Option<u64> {
    None
}

#[cfg(windows)]
fn query_power_status() -> PowerSnapshot {
    use windows_sys::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};

    let mut status = SYSTEM_POWER_STATUS::default();
    // This is the documented system summary API; it does not enumerate battery devices.
    let succeeded = unsafe { GetSystemPowerStatus(&mut status) };
    if succeeded == 0 {
        return PowerSnapshot {
            source: PowerSource::Unknown,
            battery_percent: None,
        };
    }

    PowerSnapshot {
        source: power_source(status.ACLineStatus, status.BatteryFlag),
        battery_percent: (status.BatteryLifePercent <= 100).then_some(status.BatteryLifePercent),
    }
}

#[cfg(not(windows))]
fn query_power_status() -> PowerSnapshot {
    PowerSnapshot {
        source: PowerSource::Unknown,
        battery_percent: None,
    }
}

fn power_source(ac_line_status: u8, battery_flag: u8) -> PowerSource {
    const NO_SYSTEM_BATTERY: u8 = 128;
    if battery_flag & NO_SYSTEM_BATTERY != 0 {
        return PowerSource::NotApplicable;
    }

    match ac_line_status {
        0 => PowerSource::Battery,
        1 => PowerSource::External,
        _ => PowerSource::Unknown,
    }
}

#[cfg(test)]
mod tests {
    use super::{
        activity_state, percentage, power_source, ActivityState, PowerSource,
        IDLE_THRESHOLD_SECONDS,
    };

    #[test]
    fn idle_threshold_is_inclusive_and_unknown_is_preserved() {
        assert_eq!(activity_state(None), ActivityState::Unknown);
        assert_eq!(
            activity_state(Some(IDLE_THRESHOLD_SECONDS - 1)),
            ActivityState::Active
        );
        assert_eq!(
            activity_state(Some(IDLE_THRESHOLD_SECONDS)),
            ActivityState::Idle
        );
    }

    #[test]
    fn percentages_are_bounded_and_reject_non_finite_values() {
        assert_eq!(percentage(0.0), Some(0.0));
        assert_eq!(percentage(47.25), Some(47.25));
        assert_eq!(percentage(105.0), Some(100.0));
        assert_eq!(percentage(f64::NAN), None);
    }

    #[test]
    fn power_source_handles_battery_desktop_and_unknown_states() {
        assert_eq!(power_source(0, 0), PowerSource::Battery);
        assert_eq!(power_source(1, 0), PowerSource::External);
        assert_eq!(power_source(1, 128), PowerSource::NotApplicable);
        assert_eq!(power_source(255, 0), PowerSource::Unknown);
    }
}
