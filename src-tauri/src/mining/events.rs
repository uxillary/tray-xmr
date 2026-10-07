//! Curated, in-memory product events. Telemetry samples are only inputs to
//! transition detection; samples themselves are never emitted as events.
use super::domain::{MiningTelemetry, PoolConnectionState};
use serde::Serialize;
use std::collections::VecDeque;
use std::time::{SystemTime, UNIX_EPOCH};

pub const EVENT_BUFFER_CAPACITY: usize = 256;

pub fn timestamp_now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .min(u64::MAX as u128) as u64
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum EventCategory {
    System,
    Pool,
    Result,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum EventSeverity {
    Informational,
    Success,
    Notice,
    Warning,
    Error,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum EventSource {
    EmberLifecycle,
    XmrigSummary,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum MiningProfile {
    Quiet,
    Balanced,
    Performance,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum StopReason {
    Owner,
    ApplicationQuit,
    StartupCancelled,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum FailureKind {
    Startup,
    UnexpectedEngineExit,
    StopFailed,
}

/// Structured semantics are authoritative; consumers provide their own wording.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase", tag = "type", content = "data")]
pub enum EventKind {
    SessionStarting {
        profile: MiningProfile,
        configured_threads: Option<usize>,
    },
    MiningStarted {
        profile: MiningProfile,
        configured_threads: Option<usize>,
    },
    MiningStopped {
        reason: StopReason,
        was_mining: bool,
    },
    MiningFailed {
        failure: FailureKind,
    },
    PoolConnectionChanged {
        from: PoolConnectionState,
        to: PoolConnectionState,
    },
    ResultsAccepted {
        count: u64,
    },
    ResultsRejected {
        count: u64,
    },
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmberEvent {
    pub id: String,
    pub occurred_at_unix_ms: u64,
    pub session_id: String,
    pub category: EventCategory,
    pub severity: EventSeverity,
    pub source: EventSource,
    pub kind: EventKind,
}

#[derive(Clone, Debug)]
pub struct EventSessionContext {
    /// Opaque random ID shared with the private runtime session directory.
    pub session_id: String,
    pub profile: MiningProfile,
    pub configured_threads: Option<usize>,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
struct TelemetryBaseline {
    pool: Option<PoolConnectionState>,
    accepted: Option<u64>,
    rejected: Option<u64>,
}

/// Supervisor-owned translator and bounded event buffer. Callers supply time
/// explicitly so transition decisions remain deterministic in tests.
#[derive(Default)]
pub struct EventLog {
    events: VecDeque<EmberEvent>,
    session: Option<EventSessionContext>,
    baseline: Option<TelemetryBaseline>,
    mining_started: bool,
    terminal: bool,
    next_sequence: u64,
}

impl EventLog {
    pub fn begin_session(&mut self, context: EventSessionContext, now_ms: u64) {
        if self
            .session
            .as_ref()
            .is_some_and(|active| active.session_id == context.session_id && !self.terminal)
        {
            return;
        }
        self.session = Some(context.clone());
        self.baseline = None;
        self.mining_started = false;
        self.terminal = false;
        self.push(
            now_ms,
            EventCategory::System,
            EventSeverity::Informational,
            EventSource::EmberLifecycle,
            EventKind::SessionStarting {
                profile: context.profile,
                configured_threads: context.configured_threads,
            },
        );
    }

    /// Seed counters and pool state from the first authenticated readiness
    /// sample. Those values describe the baseline, not newly observed events.
    pub fn mining_started(&mut self, telemetry: &MiningTelemetry, now_ms: u64) {
        if self.mining_started || self.terminal {
            return;
        }
        let Some((profile, configured_threads)) = self
            .session
            .as_ref()
            .map(|context| (context.profile, context.configured_threads))
        else {
            return;
        };
        self.baseline = Some(baseline(telemetry));
        self.mining_started = true;
        self.push(
            now_ms,
            EventCategory::System,
            EventSeverity::Success,
            EventSource::EmberLifecycle,
            EventKind::MiningStarted {
                profile,
                configured_threads,
            },
        );
    }

    /// Compare one authenticated summary with the previous observation.
    pub fn observe(&mut self, telemetry: &MiningTelemetry, now_ms: u64) {
        let Some(previous) = self.baseline else {
            self.baseline = Some(baseline(telemetry));
            return;
        };
        if self.terminal || self.session.is_none() {
            return;
        }

        let current = baseline(telemetry);
        if let (Some(from), Some(to)) = (previous.pool, current.pool) {
            if from != to {
                self.push(
                    now_ms,
                    EventCategory::Pool,
                    if to == PoolConnectionState::Connected {
                        EventSeverity::Success
                    } else {
                        EventSeverity::Notice
                    },
                    EventSource::XmrigSummary,
                    EventKind::PoolConnectionChanged { from, to },
                );
            }
        }
        record_delta(
            self,
            now_ms,
            previous.accepted,
            current.accepted,
            true,
        );
        record_delta(
            self,
            now_ms,
            previous.rejected,
            current.rejected,
            false,
        );
        self.baseline = Some(TelemetryBaseline {
            pool: current.pool.or(previous.pool),
            accepted: current.accepted,
            rejected: current.rejected,
        });
    }

    pub fn stopped(&mut self, reason: StopReason, was_mining: bool, now_ms: u64) {
        if self.session.is_none() || self.terminal {
            return;
        }
        self.push(
            now_ms,
            EventCategory::System,
            EventSeverity::Informational,
            EventSource::EmberLifecycle,
            EventKind::MiningStopped { reason, was_mining },
        );
        self.terminal = true;
    }

    pub fn failed(&mut self, failure: FailureKind, now_ms: u64) {
        if self.session.is_none() || self.terminal {
            return;
        }
        self.push(
            now_ms,
            EventCategory::System,
            EventSeverity::Error,
            EventSource::EmberLifecycle,
            EventKind::MiningFailed { failure },
        );
        self.terminal = true;
    }

    pub fn snapshot(&self) -> Vec<EmberEvent> {
        self.events.iter().cloned().collect()
    }

    fn push(
        &mut self,
        now_ms: u64,
        category: EventCategory,
        severity: EventSeverity,
        source: EventSource,
        kind: EventKind,
    ) {
        let Some(session) = self.session.as_ref() else {
            return;
        };
        self.next_sequence = self.next_sequence.saturating_add(1);
        let id = format!("{}:{}", session.session_id, self.next_sequence);
        self.events.push_back(EmberEvent {
            id,
            occurred_at_unix_ms: now_ms,
            session_id: session.session_id.clone(),
            category,
            severity,
            source,
            kind,
        });
        while self.events.len() > EVENT_BUFFER_CAPACITY {
            self.events.pop_front();
        }
    }
}

fn baseline(telemetry: &MiningTelemetry) -> TelemetryBaseline {
    TelemetryBaseline {
        pool: telemetry.pool_connection.as_ref().and_then(|pool| match pool.state {
            PoolConnectionState::Connected | PoolConnectionState::Disconnected => Some(pool.state),
            PoolConnectionState::Unknown => None,
        }),
        accepted: telemetry.results.as_ref().and_then(|results| results.accepted),
        rejected: telemetry.results.as_ref().and_then(|results| results.rejected),
    }
}

fn record_delta(log: &mut EventLog, now_ms: u64, old: Option<u64>, new: Option<u64>, accepted: bool) {
    let Some(delta) = old.zip(new).and_then(|(old, new)| new.checked_sub(old)) else {
        return;
    };
    if delta == 0 {
        return;
    }
    log.push(
        now_ms,
        EventCategory::Result,
        if accepted {
            EventSeverity::Success
        } else {
            EventSeverity::Notice
        },
        EventSource::XmrigSummary,
        if accepted {
            EventKind::ResultsAccepted { count: delta }
        } else {
            EventKind::ResultsRejected { count: delta }
        },
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mining::domain::{MiningResultsTelemetry, PoolConnectionTelemetry};

    fn context() -> EventSessionContext {
        EventSessionContext {
            session_id: "opaque-session-1".into(),
            profile: MiningProfile::Quiet,
            configured_threads: Some(4),
        }
    }

    fn sample(pool: Option<PoolConnectionState>, accepted: Option<u64>, rejected: Option<u64>) -> MiningTelemetry {
        MiningTelemetry {
            results: Some(MiningResultsTelemetry {
                accepted,
                rejected,
                total: None,
                current_job_difficulty: None,
                accepted_difficulty_total: None,
            }),
            pool_connection: pool.map(|state| PoolConnectionTelemetry {
                state, endpoint: None, uptime_seconds: None, failures: None, ping_ms: None,
                tls_version: None, algorithm: None, current_job_difficulty: None,
            }),
            ..MiningTelemetry::default()
        }
    }

    fn kinds(log: &EventLog) -> Vec<EventKind> {
        log.snapshot().into_iter().map(|event| event.kind).collect()
    }

    fn started_log() -> EventLog {
        let mut log = EventLog::default();
        log.begin_session(context(), 1);
        log.mining_started(&sample(Some(PoolConnectionState::Connected), Some(12), Some(0)), 2);
        log
    }

    #[test]
    fn first_sample_is_baseline_and_repeated_samples_are_not_events() {
        let mut log = started_log();
        assert_eq!(log.snapshot().len(), 2);
        log.mining_started(&sample(Some(PoolConnectionState::Disconnected), Some(99), Some(8)), 3);
        let sample = sample(Some(PoolConnectionState::Connected), Some(12), Some(0));
        log.observe(&sample, 4);
        assert_eq!(log.snapshot().len(), 2);
    }

    #[test]
    fn pool_disconnect_and_recovery_emit_once_and_unknown_preserves_baseline() {
        let mut log = started_log();
        log.observe(&sample(Some(PoolConnectionState::Disconnected), Some(12), Some(0)), 3);
        log.observe(&sample(Some(PoolConnectionState::Disconnected), Some(12), Some(0)), 4);
        log.observe(&sample(Some(PoolConnectionState::Unknown), Some(12), Some(0)), 5);
        log.observe(&sample(Some(PoolConnectionState::Connected), Some(12), Some(0)), 6);
        let pool_events = log.snapshot().into_iter().filter(|event| event.category == EventCategory::Pool).collect::<Vec<_>>();
        assert_eq!(pool_events.len(), 2);
        assert!(matches!(pool_events[0].kind, EventKind::PoolConnectionChanged { to: PoolConnectionState::Disconnected, .. }));
        assert!(matches!(pool_events[1].kind, EventKind::PoolConnectionChanged { to: PoolConnectionState::Connected, .. }));
    }

    #[test]
    fn accepted_and_rejected_deltas_are_aggregated_and_resets_do_not_go_negative() {
        let mut log = started_log();
        log.observe(&sample(None, Some(13), Some(2)), 3);
        log.observe(&sample(None, Some(15), Some(4)), 4);
        log.observe(&sample(None, Some(15), Some(4)), 5);
        log.observe(&sample(None, Some(0), Some(0)), 6);
        log.observe(&sample(None, Some(1), Some(1)), 7);
        let result_events = log.snapshot().into_iter().filter(|event| event.category == EventCategory::Result).collect::<Vec<_>>();
        assert_eq!(result_events.iter().map(|event| event.kind.clone()).collect::<Vec<_>>(), vec![
            EventKind::ResultsAccepted { count: 1 }, EventKind::ResultsRejected { count: 2 },
            EventKind::ResultsAccepted { count: 2 }, EventKind::ResultsRejected { count: 2 },
            EventKind::ResultsAccepted { count: 1 }, EventKind::ResultsRejected { count: 1 },
        ]);
    }

    #[test]
    fn missing_counters_baseline_on_first_value_and_unavailable_api_does_not_replay() {
        let mut log = EventLog::default();
        log.begin_session(context(), 1);
        log.mining_started(&sample(None, None, None), 2);
        log.observe(&sample(None, Some(10), Some(0)), 3);
        log.observe(&sample(None, Some(11), Some(0)), 4);
        // API unavailability is not passed as a synthetic observation.
        log.observe(&sample(None, Some(11), Some(0)), 9);
        assert_eq!(kinds(&log).iter().filter(|kind| matches!(kind, EventKind::ResultsAccepted { .. })).count(), 1);
    }

    #[test]
    fn terminal_lifecycle_events_are_single_and_session_scoped() {
        let mut log = started_log();
        log.stopped(StopReason::Owner, true, 3);
        log.stopped(StopReason::Owner, true, 4);
        log.observe(&sample(None, Some(20), Some(0)), 5);
        assert_eq!(kinds(&log).len(), 3);
        assert_eq!(log.snapshot()[0].session_id, "opaque-session-1");
        assert!(matches!(log.snapshot()[2].kind, EventKind::MiningStopped { was_mining: true, .. }));
    }

    #[test]
    fn unexpected_exit_is_distinct_from_owner_stop_and_terminal_events_deduplicate() {
        let mut log = started_log();
        log.failed(FailureKind::UnexpectedEngineExit, 3);
        log.failed(FailureKind::UnexpectedEngineExit, 4);
        log.stopped(StopReason::Owner, true, 5);
        assert_eq!(log.snapshot().len(), 3);
        assert!(matches!(
            log.snapshot()[2].kind,
            EventKind::MiningFailed {
                failure: FailureKind::UnexpectedEngineExit
            }
        ));
    }

    #[test]
    fn new_session_identity_rebaselines_counters_without_historical_events() {
        let mut log = started_log();
        let before = log.snapshot().len();
        let mut next = context();
        next.session_id = "opaque-session-2".into();
        log.begin_session(next, 6);
        log.mining_started(&sample(Some(PoolConnectionState::Connected), Some(0), Some(0)), 7);
        assert_eq!(log.snapshot().len(), before + 2);
        assert_eq!(log.snapshot()[before].session_id, "opaque-session-2");
        assert_eq!(log.snapshot()[before + 1].session_id, "opaque-session-2");
    }

    #[test]
    fn bounded_buffer_evicts_oldest_and_keeps_deterministic_ids_order() {
        let mut log = EventLog::default();
        for index in 0..(EVENT_BUFFER_CAPACITY + 3) {
            log.begin_session(context(), index as u64);
            log.failed(FailureKind::Startup, index as u64 + 1);
        }
        let events = log.snapshot();
        assert_eq!(events.len(), EVENT_BUFFER_CAPACITY);
        assert_eq!(events.first().unwrap().occurred_at_unix_ms, (EVENT_BUFFER_CAPACITY / 2 + 3) as u64);
        assert_eq!(events.last().unwrap().occurred_at_unix_ms, (EVENT_BUFFER_CAPACITY + 3) as u64);
        assert!(events.windows(2).all(|pair| pair[0].id != pair[1].id));
    }

    #[test]
    fn serialized_events_have_no_fields_for_secrets_or_runtime_paths() {
        let log = started_log();
        let serialized = serde_json::to_string(&log.snapshot()).unwrap();
        for forbidden in ["publicAddress", "accessToken", "password", "runtimePath", "endpoint", "configJson"] {
            assert!(!serialized.contains(forbidden));
        }
    }
}
