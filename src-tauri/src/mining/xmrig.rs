use super::config;
use super::domain::{
    DiagnosticSummary, EngineArtifact, EngineAvailability, EngineError, EngineErrorKind,
    EngineLifecycleState, EngineStatus, MiningConfig, MiningEngine, MiningTelemetry, StopReason,
    ValidatedMiningConfig,
};
use serde::Deserialize;

const MAX_API_RESPONSE_BYTES: usize = 64 * 1024;
const MAX_HASHRATE: f64 = 1.0e15;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ApiClientError {
    Unavailable,
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

#[derive(Deserialize)]
struct XmrigSummary {
    version: String,
    paused: bool,
    algorithms: Option<Vec<String>>,
    hashrate: Option<HashrateSummary>,
}

#[derive(Deserialize)]
struct HashrateSummary {
    total: Option<Vec<Option<f64>>>,
}

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
        if artifact.engine_name() != "XMRig" || !artifact.is_verified() {
            return Err(EngineError {
                kind: EngineErrorKind::UntrustedArtifact,
                message: "XMRig artifact metadata is not verified".to_owned(),
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

        Ok(MiningTelemetry {
            engine_version: Some(summary.version),
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
            sample_time_unix_ms,
        })
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

#[cfg(test)]
mod tests {
    use super::{ApiClientError, LocalApiTransport, XmrigAdapter};
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
        assert_eq!(parsed.paused, Some(false));
        assert_eq!(parsed.supported_algorithms, ["rx/0"]);
        assert_eq!(parsed.short_hashrate, Some(125.5));
        assert_eq!(parsed.medium_hashrate, Some(120.0));
        assert_eq!(parsed.long_hashrate, Some(110.0));
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
            adapter.normalize_summary(br#"{"version":"6.25.0","paused":false}"#, None),
            Err(ApiClientError::UnexpectedVersion)
        );
        let invalid_numeric =
            br#"{"version":"6.26.0","paused":false,"hashrate":{"total":[1e999,2,3]}}"#;
        assert_eq!(
            adapter.normalize_summary(invalid_numeric, None),
            Err(ApiClientError::InvalidResponse)
        );
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
