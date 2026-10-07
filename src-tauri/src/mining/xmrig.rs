use super::config;
use super::domain::{
    DiagnosticSummary, EngineArtifact, EngineAvailability, EngineError, EngineErrorKind,
    EngineLifecycleState, EngineStatus, HugePagesTelemetry, MiningConfig, MiningEngine,
    MiningResultsTelemetry, MiningTelemetry, PoolConnectionState, PoolConnectionTelemetry,
    StopReason, ValidatedMiningConfig,
};
use serde::Deserialize;
use std::io::Read;

const MAX_API_RESPONSE_BYTES: usize = 64 * 1024;
const MAX_HASHRATE: f64 = 1.0e15;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ApiClientError {
    Unavailable,
    ConnectionFailed,
    TimedOut,
    Unauthorized,
    InvalidResponse,
    UnexpectedVersion,
    OversizedResponse,
}

pub trait LocalApiTransport {
    fn get_summary(
        &mut self,
        host: &str,
        port: u16,
        access_token: &str,
    ) -> Result<Vec<u8>, ApiClientError>;
}

/// Narrow, blocking client for this session's XMRig loopback summary endpoint.
/// It has no proxy, follows no redirects, and never accepts a caller-provided URL.
pub struct ReqwestLocalApiTransport {
    client: reqwest::blocking::Client,
}

impl ReqwestLocalApiTransport {
    pub fn new() -> Result<Self, ApiClientError> {
        let client = reqwest::blocking::Client::builder()
            .no_proxy()
            .redirect(reqwest::redirect::Policy::none())
            .connect_timeout(std::time::Duration::from_millis(500))
            .timeout(std::time::Duration::from_secs(2))
            .build()
            .map_err(|_| ApiClientError::Unavailable)?;
        Ok(Self { client })
    }
}

impl LocalApiTransport for ReqwestLocalApiTransport {
    fn get_summary(
        &mut self,
        host: &str,
        port: u16,
        access_token: &str,
    ) -> Result<Vec<u8>, ApiClientError> {
        if host != "127.0.0.1" || port == 0 || access_token.len() < 32 {
            return Err(ApiClientError::Unauthorized);
        }
        get_summary_request(&self.client, port, Some(&format!("Bearer {access_token}")))
    }
}

fn get_summary_request(
    client: &reqwest::blocking::Client,
    port: u16,
    authorization: Option<&str>,
) -> Result<Vec<u8>, ApiClientError> {
    if port == 0 {
        return Err(ApiClientError::Unauthorized);
    }
    let url = format!("http://127.0.0.1:{port}/2/summary");
    let mut request = client
        .get(url)
        .header(reqwest::header::ACCEPT, "application/json");
    if let Some(value) = authorization {
        request = request.header(reqwest::header::AUTHORIZATION, value);
    }
    let response = request.send().map_err(classify_transport_error)?;
    if response.status() == reqwest::StatusCode::UNAUTHORIZED
        || response.status() == reqwest::StatusCode::FORBIDDEN
    {
        return Err(ApiClientError::Unauthorized);
    }
    if !response.status().is_success() {
        return Err(ApiClientError::InvalidResponse);
    }
    if response
        .content_length()
        .is_some_and(|length| length > MAX_API_RESPONSE_BYTES as u64)
    {
        return Err(ApiClientError::OversizedResponse);
    }
    let mut body = Vec::with_capacity(2048);
    response
        .take((MAX_API_RESPONSE_BYTES + 1) as u64)
        .read_to_end(&mut body)
        .map_err(|error| {
            if error.kind() == std::io::ErrorKind::TimedOut {
                ApiClientError::TimedOut
            } else {
                ApiClientError::Unavailable
            }
        })?;
    if body.len() > MAX_API_RESPONSE_BYTES {
        return Err(ApiClientError::OversizedResponse);
    }
    Ok(body)
}

fn classify_transport_error(error: reqwest::Error) -> ApiClientError {
    if error.is_connect() {
        ApiClientError::ConnectionFailed
    } else if error.is_timeout() {
        ApiClientError::TimedOut
    } else {
        ApiClientError::Unavailable
    }
}

#[derive(Deserialize)]
struct XmrigSummary {
    version: String,
    kind: String,
    paused: bool,
    restricted: bool,
    algorithms: Option<Vec<String>>,
    hashrate: Option<HashrateSummary>,
    uptime: Option<u64>,
    results: Option<XmrigResults>,
    connection: Option<XmrigConnection>,
    hugepages: Option<Vec<u64>>,
}

#[derive(Deserialize)]
struct HashrateSummary {
    total: Option<Vec<Option<f64>>>,
}

#[derive(Deserialize)]
struct XmrigResults {
    diff_current: Option<u64>,
    shares_good: Option<u64>,
    shares_total: Option<u64>,
    hashes_total: Option<u64>,
}

#[derive(Deserialize)]
struct XmrigConnection {
    pool: Option<String>,
    uptime_ms: Option<u64>,
    failures: Option<u64>,
    ping: Option<u64>,
    tls: Option<String>,
    algo: Option<String>,
    diff: Option<u64>,
}

#[derive(Clone)]
pub struct XmrigAdapter {
    artifact: EngineArtifact,
}

impl MiningEngine for XmrigAdapter {
    fn availability(&self) -> EngineAvailability {
        EngineAvailability::Available(self.artifact.version().to_owned())
    }

    fn validate(&self, config: MiningConfig) -> Result<ValidatedMiningConfig, EngineError> {
        self.validate_config(config)
    }

    fn start(&mut self, _config: ValidatedMiningConfig) -> Result<EngineStatus, EngineError> {
        Err(EngineError {
            kind: EngineErrorKind::Internal,
            message: "XMRig execution is disabled in the M03B groundwork build".into(),
        })
    }

    fn stop(&mut self, _reason: StopReason) -> Result<EngineStatus, EngineError> {
        Ok(self.status())
    }

    fn status(&self) -> EngineStatus {
        EngineStatus {
            availability: self.availability(),
            state: EngineLifecycleState::NotConfigured,
            process_id: None,
            error: None,
            diagnostics: Vec::new(),
            capture_health: super::domain::CaptureHealth::default(),
            startup_stage: None,
            startup_elapsed_ms: None,
            startup_timings: Vec::new(),
        }
    }

    fn telemetry(&self) -> Option<MiningTelemetry> {
        None
    }

    fn diagnostics(&self) -> Vec<DiagnosticSummary> {
        Vec::new()
    }
}

impl XmrigAdapter {
    pub fn new(artifact: EngineArtifact) -> Result<Self, EngineError> {
        if artifact.engine_name() != "XMRig" {
            return Err(EngineError {
                kind: EngineErrorKind::UntrustedArtifact,
                message: "The verified installation has an unsupported engine identity".to_owned(),
            });
        }
        if !artifact.is_verified() {
            return Err(EngineError {
                kind: EngineErrorKind::UntrustedArtifact,
                message: "XMRig verification evidence does not match its pinned archive digest"
                    .to_owned(),
            });
        }
        Ok(Self { artifact })
    }

    pub fn version(&self) -> &str {
        self.artifact.version()
    }

    pub fn validate_config(
        &self,
        config: MiningConfig,
    ) -> Result<ValidatedMiningConfig, EngineError> {
        config::validate(config, self.version())
    }

    pub fn normalize_summary(
        &self,
        body: &[u8],
        sample_time_unix_ms: Option<u64>,
    ) -> Result<MiningTelemetry, ApiClientError> {
        if body.len() > MAX_API_RESPONSE_BYTES {
            return Err(ApiClientError::OversizedResponse);
        }
        let summary: XmrigSummary =
            serde_json::from_slice(body).map_err(|_| ApiClientError::InvalidResponse)?;
        if summary.version != self.artifact.version() {
            return Err(ApiClientError::UnexpectedVersion);
        }
        if summary.kind != "miner" || !summary.restricted {
            return Err(ApiClientError::InvalidResponse);
        }
        if summary.results.as_ref().is_some_and(|results| {
            results
                .shares_total
                .zip(results.shares_good)
                .is_some_and(|(total, accepted)| accepted > total)
        }) {
            return Err(ApiClientError::InvalidResponse);
        }
        let rates = summary
            .hashrate
            .and_then(|hashrate| hashrate.total)
            .unwrap_or_default();
        let rate = |index: usize| {
            rates
                .get(index)
                .copied()
                .flatten()
                .filter(|value| value.is_finite() && (0.0..=MAX_HASHRATE).contains(value))
        };

        let results = summary.results.map(|results| {
            let rejected = results
                .shares_total
                .zip(results.shares_good)
                .and_then(|(total, accepted)| total.checked_sub(accepted));
            MiningResultsTelemetry {
                accepted: results.shares_good,
                rejected,
                total: results.shares_total,
                current_job_difficulty: results.diff_current,
                accepted_difficulty_total: results.hashes_total,
            }
        });
        let pool_connection = summary.connection.map(|connection| {
            let endpoint = connection.pool.filter(|pool| safe_pool_endpoint(pool));
            let uptime_ms = connection.uptime_ms;
            let failures = connection.failures;
            let state = if uptime_ms.is_some_and(|uptime| uptime > 0) {
                PoolConnectionState::Connected
            } else if failures.is_some_and(|count| count > 0) {
                PoolConnectionState::Disconnected
            } else {
                PoolConnectionState::Unknown
            };
            let algorithm = connection.algo.filter(|value| safe_algorithm(value));
            PoolConnectionTelemetry {
                state,
                endpoint,
                uptime_seconds: uptime_ms.map(|uptime| uptime / 1000),
                failures,
                ping_ms: connection.ping.map(u64::from),
                tls_version: connection
                    .tls
                    .filter(|tls| !tls.is_empty() && tls.len() <= 64),
                algorithm,
                current_job_difficulty: connection.diff,
            }
        });
        let cpu_huge_pages = summary.hugepages.and_then(|pages| {
            (pages.len() == 2 && pages[0] <= pages[1]).then_some(HugePagesTelemetry {
                allocated: pages[0],
                total: pages[1],
            })
        });

        Ok(MiningTelemetry {
            engine_version: Some(summary.version),
            uptime_seconds: summary.uptime,
            paused: Some(summary.paused),
            supported_algorithms: summary
                .algorithms
                .unwrap_or_default()
                .into_iter()
                .filter(|algorithm| {
                    !algorithm.is_empty()
                        && algorithm.len() <= 40
                        && algorithm
                            .bytes()
                            .all(|byte| byte.is_ascii_alphanumeric() || b"/-_".contains(&byte))
                })
                .take(32)
                .collect(),
            short_hashrate: rate(0),
            medium_hashrate: rate(1),
            long_hashrate: rate(2),
            results,
            pool_connection,
            cpu_huge_pages,
            sample_time_unix_ms,
        })
    }

    /// Startup is accepted only when the authenticated pinned-version summary identifies
    /// the miner as active, reports the configured RandomX backend and has a live rate.
    pub fn is_ready_to_mine(telemetry: &MiningTelemetry) -> bool {
        telemetry.engine_version.as_deref() == Some("6.26.0")
            && telemetry.paused == Some(false)
            && telemetry.supported_algorithms.iter().any(|a| a == "rx/0")
            && telemetry.short_hashrate.is_some_and(|rate| rate > 0.0)
    }

    pub fn telemetry<T: LocalApiTransport>(
        &self,
        config: &ValidatedMiningConfig,
        transport: &mut T,
        sample_time_unix_ms: Option<u64>,
    ) -> Result<MiningTelemetry, ApiClientError> {
        let api = &config.config.api;
        if api.host != "127.0.0.1" || !api.restricted {
            return Err(ApiClientError::Unauthorized);
        }
        let body = transport.get_summary(&api.host, api.port, &api.access_token)?;
        self.normalize_summary(&body, sample_time_unix_ms)
    }
}

fn safe_pool_endpoint(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 320
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b".-_[]:%".contains(&byte))
        && !value.contains("..")
}

fn safe_algorithm(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 40
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"/-_".contains(&byte))
}

#[cfg(test)]
mod tests {
    use super::{
        get_summary_request, ApiClientError, LocalApiTransport, PoolConnectionState,
        ReqwestLocalApiTransport, XmrigAdapter,
    };
    use crate::mining::domain::{EngineArtifact, EngineAvailability, EngineErrorKind, StopReason};
    use std::path::PathBuf;

    fn adapter() -> XmrigAdapter {
        XmrigAdapter::new(EngineArtifact::verified_fixture(
            "XMRig",
            "6.26.0",
            "windows-x64",
            "fixture://local-only",
            &"a".repeat(64),
            PathBuf::from("fixture/xmrig.exe"),
        ))
        .unwrap()
    }

    #[test]
    fn normalizes_summary_fixture_and_optional_rates() {
        let parsed = adapter()
            .normalize_summary(
                include_bytes!("../../tests/fixtures/xmrig-summary.json"),
                Some(42),
            )
            .unwrap();
        assert_eq!(parsed.engine_version.as_deref(), Some("6.26.0"));
        assert_eq!(parsed.uptime_seconds, Some(12));
        assert_eq!(parsed.paused, Some(false));
        assert_eq!(parsed.supported_algorithms, ["rx/0"]);
        assert_eq!(parsed.short_hashrate, Some(125.5));
        assert_eq!(parsed.medium_hashrate, Some(120.0));
        assert_eq!(parsed.long_hashrate, Some(110.0));
        let results = parsed.results.as_ref().unwrap();
        assert_eq!(results.accepted, Some(3));
        assert_eq!(results.rejected, Some(1));
        assert_eq!(results.total, Some(4));
        assert_eq!(results.current_job_difficulty, Some(10_000));
        assert_eq!(results.accepted_difficulty_total, Some(30_000));
        let pool = parsed.pool_connection.as_ref().unwrap();
        assert_eq!(pool.state, PoolConnectionState::Connected);
        assert_eq!(pool.endpoint.as_deref(), Some("pool.example:3333"));
        assert_eq!(pool.uptime_seconds, Some(9));
        assert_eq!(pool.ping_ms, Some(43));
        assert_eq!(pool.algorithm.as_deref(), Some("rx/0"));
        assert_eq!(pool.current_job_difficulty, Some(10_000));
        assert_eq!(parsed.cpu_huge_pages.as_ref().unwrap().allocated, 0);
        assert_eq!(parsed.cpu_huge_pages.as_ref().unwrap().total, 16);
        assert_eq!(parsed.sample_time_unix_ms, Some(42));

        let paused = adapter()
            .normalize_summary(
                include_bytes!("../../tests/fixtures/xmrig-paused.json"),
                None,
            )
            .unwrap();
        assert_eq!(paused.paused, Some(true));
        assert_eq!(paused.short_hashrate, None);
    }

    #[test]
    fn zero_is_distinct_from_missing_and_disconnect_does_not_mean_process_exit() {
        let adapter = adapter();
        let disconnected = adapter
            .normalize_summary(
                include_bytes!("../../tests/fixtures/xmrig-disconnected.json"),
                Some(10),
            )
            .unwrap();
        assert_eq!(disconnected.short_hashrate, Some(0.0));
        assert_eq!(disconnected.medium_hashrate, Some(0.0));
        assert_eq!(disconnected.long_hashrate, None);
        let results = disconnected.results.unwrap();
        assert_eq!(results.accepted, Some(0));
        assert_eq!(results.rejected, Some(0));
        assert_eq!(results.total, Some(0));
        assert_eq!(
            disconnected.pool_connection.unwrap().state,
            PoolConnectionState::Disconnected
        );

        let missing = adapter
            .normalize_summary(
                br#"{"version":"6.26.0","kind":"miner","paused":false,"restricted":true,"hashrate":{"total":[null,null,null]}}"#,
                Some(11),
            )
            .unwrap();
        assert_eq!(missing.short_hashrate, None);
        assert!(missing.results.is_none());
        assert!(missing.pool_connection.is_none());
    }

    #[test]
    fn malformed_oversized_and_unexpected_api_responses_are_rejected() {
        let adapter = adapter();
        assert_eq!(
            adapter.normalize_summary(b"{broken", None),
            Err(ApiClientError::InvalidResponse)
        );
        assert_eq!(
            adapter.normalize_summary(&vec![b' '; 64 * 1024 + 1], None),
            Err(ApiClientError::OversizedResponse)
        );
        assert_eq!(
            adapter.normalize_summary(
                br#"{"version":"6.25.0","kind":"miner","paused":false,"restricted":true}"#,
                None
            ),
            Err(ApiClientError::UnexpectedVersion)
        );
        let invalid_numeric =
            br#"{"version":"6.26.0","kind":"miner","paused":false,"restricted":true,"hashrate":{"total":[1e999,2,3]}}"#;
        assert_eq!(
            adapter.normalize_summary(invalid_numeric, None),
            Err(ApiClientError::InvalidResponse)
        );
        assert_eq!(
            adapter.normalize_summary(
                br#"{"version":"6.26.0","kind":"proxy","paused":false,"restricted":true}"#,
                None
            ),
            Err(ApiClientError::InvalidResponse)
        );
        assert_eq!(
            adapter.normalize_summary(
                br#"{"version":"6.26.0","kind":"miner","paused":false,"restricted":false}"#,
                None
            ),
            Err(ApiClientError::InvalidResponse)
        );
        assert_eq!(
            adapter.normalize_summary(
                br#"{"version":"6.26.0","kind":"miner","paused":false,"restricted":true,"results":{"shares_good":2,"shares_total":1}}"#,
                None
            ),
            Err(ApiClientError::InvalidResponse)
        );
        assert_eq!(
            adapter.normalize_summary(
                br#"{"version":"6.26.0","kind":"miner","restricted":true}"#,
                None
            ),
            Err(ApiClientError::InvalidResponse)
        );
        assert!(adapter.normalize_summary(
            br#"{"version":"6.26.0","kind":"miner","paused":false,"restricted":true,"new_upstream_field":{"ignored":true}}"#,
            None
        ).is_ok());
    }

    #[test]
    fn mining_readiness_requires_active_randomx_and_positive_rate() {
        let active = adapter()
            .normalize_summary(
                include_bytes!("../../tests/fixtures/xmrig-summary.json"),
                None,
            )
            .unwrap();
        assert!(XmrigAdapter::is_ready_to_mine(&active));
        let paused = adapter()
            .normalize_summary(
                include_bytes!("../../tests/fixtures/xmrig-paused.json"),
                None,
            )
            .unwrap();
        assert!(!XmrigAdapter::is_ready_to_mine(&paused));
        let waiting = adapter()
            .normalize_summary(
                br#"{"version":"6.26.0","kind":"miner","paused":false,"restricted":true,"algorithms":["rx/0"],"hashrate":{"total":[null,null,null]}}"#,
                None,
            )
            .unwrap();
        assert!(!XmrigAdapter::is_ready_to_mine(&waiting));
    }

    #[test]
    fn telemetry_transport_receives_loopback_and_secret_only_inside_rust() {
        struct FixtureTransport;
        impl LocalApiTransport for FixtureTransport {
            fn get_summary(
                &mut self,
                host: &str,
                port: u16,
                token: &str,
            ) -> Result<Vec<u8>, ApiClientError> {
                assert_eq!(host, "127.0.0.1");
                assert_ne!(port, 0);
                assert!(token.len() >= 32);
                Ok(include_bytes!("../../tests/fixtures/xmrig-summary.json").to_vec())
            }
        }

        let validated = crate::mining::config::validate(
            crate::mining::config::tests::fixture_config(),
            "6.26.0",
        )
        .unwrap();
        let telemetry = adapter()
            .telemetry(&validated, &mut FixtureTransport, None)
            .unwrap();
        assert_eq!(telemetry.paused, Some(false));
    }

    #[test]
    fn api_poll_and_pool_disconnect_recover_on_sequential_telemetry_polls() {
        struct RecoveryTransport {
            poll: usize,
        }
        impl LocalApiTransport for RecoveryTransport {
            fn get_summary(
                &mut self,
                _host: &str,
                _port: u16,
                _token: &str,
            ) -> Result<Vec<u8>, ApiClientError> {
                self.poll += 1;
                match self.poll {
                    1 => Err(ApiClientError::Unavailable),
                    2 => {
                        Ok(include_bytes!("../../tests/fixtures/xmrig-disconnected.json").to_vec())
                    }
                    _ => Ok(include_bytes!("../../tests/fixtures/xmrig-summary.json").to_vec()),
                }
            }
        }

        let validated = crate::mining::config::validate(
            crate::mining::config::tests::fixture_config(),
            "6.26.0",
        )
        .unwrap();
        let mut transport = RecoveryTransport { poll: 0 };
        let adapter = adapter();

        assert!(matches!(
            adapter.telemetry(&validated, &mut transport, Some(7)),
            Err(ApiClientError::Unavailable)
        ));
        let disconnected = adapter
            .telemetry(&validated, &mut transport, Some(7))
            .unwrap();
        assert_eq!(
            disconnected.pool_connection.unwrap().state,
            PoolConnectionState::Disconnected
        );
        assert_eq!(disconnected.short_hashrate, Some(0.0));

        let recovered = adapter
            .telemetry(&validated, &mut transport, Some(7))
            .unwrap();
        assert_eq!(
            recovered.pool_connection.unwrap().state,
            PoolConnectionState::Connected
        );
        assert!(recovered.short_hashrate.unwrap() > 0.0);
        assert_eq!(transport.poll, 3);
    }

    #[test]
    fn bearer_auth_contract_accepts_only_exact_bearer_and_never_reports_the_token() {
        use crate::mining::diagnostics::{DiagnosticRing, RedactionSecrets};
        use std::io::{BufRead, BufReader, Write};
        use std::net::TcpListener;

        let listener = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0)).unwrap();
        let port = listener.local_addr().unwrap().port();
        let expected_token = "test_only_token_0123456789abcdef".to_owned();
        let server_token = expected_token.clone();
        let server = std::thread::spawn(move || {
            for _ in 0..6 {
                let (mut socket, _) = listener.accept().unwrap();
                let mut reader = BufReader::new(socket.try_clone().unwrap());
                let mut authorization = None;
                let mut first_line = String::new();
                reader.read_line(&mut first_line).unwrap();
                assert!(first_line.starts_with("GET /2/summary HTTP/1.1\r\n"));
                loop {
                    let mut line = String::new();
                    reader.read_line(&mut line).unwrap();
                    if line == "\r\n" || line.is_empty() {
                        break;
                    }
                    if let Some((name, value)) = line.split_once(':') {
                        if name.eq_ignore_ascii_case("authorization") {
                            authorization = Some(value.trim().to_owned());
                        }
                    }
                }
                let code = match authorization.as_deref() {
                    None => 401,
                    Some(value) if value.len() < 8 || !value.starts_with("Bearer ") => 403,
                    Some(value) if value.len() != "Bearer ".len() + server_token.len() => 403,
                    Some(value) if value["Bearer ".len()..] != server_token => 403,
                    Some(_) => 200,
                };
                let phrase = if code == 200 {
                    "OK"
                } else if code == 401 {
                    "Unauthorized"
                } else {
                    "Forbidden"
                };
                let body = if code == 200 {
                    br#"{"version":"6.26.0","kind":"miner","paused":false,"restricted":true}"#
                        .as_slice()
                } else {
                    b"".as_slice()
                };
                write!(
                    socket,
                    "HTTP/1.1 {code} {phrase}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                    body.len()
                )
                .unwrap();
                socket.write_all(body).unwrap();
            }
        });
        let mut client = ReqwestLocalApiTransport::new().unwrap();
        assert_eq!(
            get_summary_request(
                &client.client,
                port,
                Some(&format!("Bearer {expected_token}"))
            )
            .unwrap(),
            br#"{"version":"6.26.0","kind":"miner","paused":false,"restricted":true}"#
        );
        assert_eq!(
            get_summary_request(&client.client, port, None),
            Err(ApiClientError::Unauthorized)
        );
        assert_eq!(
            get_summary_request(&client.client, port, Some("Basic test_only_token")),
            Err(ApiClientError::Unauthorized)
        );
        assert_eq!(
            get_summary_request(&client.client, port, Some("Bearer wrong_token")),
            Err(ApiClientError::Unauthorized)
        );
        assert_eq!(
            get_summary_request(&client.client, port, Some("Bearer")),
            Err(ApiClientError::Unauthorized)
        );
        assert_eq!(
            get_summary_request(&client.client, port, Some("Bearer ")),
            Err(ApiClientError::Unauthorized)
        );
        server.join().unwrap();

        let secrets = RedactionSecrets::new([expected_token.clone()]);
        let mut diagnostics = DiagnosticRing::new(8, 1024, secrets);
        diagnostics.push(
            crate::mining::domain::DiagnosticSource::Stderr,
            &format!("Authorization Bearer {expected_token}"),
        );
        assert!(diagnostics.snapshot()[0]
            .message
            .contains("authorization material omitted"));
        assert!(!format!("{:?}", ApiClientError::Unauthorized).contains(&expected_token));
        assert_eq!(
            client.get_summary("localhost", port, &expected_token),
            Err(ApiClientError::Unauthorized)
        );
    }

    #[test]
    fn concrete_transport_bounds_body_and_times_out() {
        use std::io::{BufRead, BufReader, Read, Write};
        use std::net::TcpListener;
        use std::time::Duration;

        let listener = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0)).unwrap();
        let port = listener.local_addr().unwrap().port();
        let server = std::thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            let mut reader = BufReader::new(socket.try_clone().unwrap());
            let mut line = String::new();
            while reader.read_line(&mut line).unwrap() > 0 && line != "\r\n" {
                line.clear();
            }
            socket
                .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 65537\r\nConnection: close\r\n\r\n")
                .unwrap();
        });
        let mut client = ReqwestLocalApiTransport::new().unwrap();
        assert_eq!(
            client.get_summary("127.0.0.1", port, "test_only_token_0123456789abcdef"),
            Err(ApiClientError::OversizedResponse)
        );
        server.join().unwrap();

        let listener = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0)).unwrap();
        let port = listener.local_addr().unwrap().port();
        let server = std::thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            let mut reader = BufReader::new(socket.try_clone().unwrap());
            let mut line = String::new();
            while reader.read_line(&mut line).unwrap() > 0 && line != "\r\n" {
                line.clear();
            }
            std::thread::sleep(Duration::from_millis(2200));
            let _ = socket.read(&mut [0u8; 1]);
        });
        assert_eq!(
            client.get_summary("127.0.0.1", port, "test_only_token_0123456789abcdef"),
            Err(ApiClientError::TimedOut)
        );
        server.join().unwrap();
    }

    #[test]
    fn concrete_transport_distinguishes_loopback_connection_failure() {
        use std::net::TcpListener;

        let listener = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0)).unwrap();
        let port = listener.local_addr().unwrap().port();
        drop(listener);
        let mut client = ReqwestLocalApiTransport::new().unwrap();
        assert_eq!(
            client.get_summary("127.0.0.1", port, "test_only_token_0123456789abcdef"),
            Err(ApiClientError::ConnectionFailed)
        );
    }

    #[test]
    fn adapter_exposes_generic_contract_but_refuses_real_execution_in_m03b() {
        use crate::mining::domain::MiningEngine;

        let mut adapter = adapter();
        let validated = adapter
            .validate(crate::mining::config::tests::fixture_config())
            .unwrap();
        assert_eq!(
            adapter.availability(),
            EngineAvailability::Available("6.26.0".into())
        );
        assert_eq!(adapter.status().process_id, None);
        assert_eq!(
            adapter.start(validated.clone()).unwrap_err().kind,
            EngineErrorKind::Internal
        );
        assert!(matches!(
            adapter.telemetry(&validated, &mut UnavailableTransport, None),
            Err(ApiClientError::Unavailable)
        ));
        assert_eq!(
            adapter.stop(StopReason::UserRequest).unwrap().process_id,
            None
        );
    }

    struct UnavailableTransport;

    impl LocalApiTransport for UnavailableTransport {
        fn get_summary(
            &mut self,
            _host: &str,
            _port: u16,
            _token: &str,
        ) -> Result<Vec<u8>, ApiClientError> {
            Err(ApiClientError::Unavailable)
        }
    }
}
