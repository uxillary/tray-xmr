use super::domain::{EngineError, EngineErrorKind, MiningConfig, ValidatedMiningConfig};
use serde::Serialize;
use std::net::IpAddr;

const MAX_ADDRESS_LENGTH: usize = 128;
const MIN_TOKEN_LENGTH: usize = 32;

#[derive(Serialize)]
struct XmrigConfig<'a> {
    autosave: bool,
    background: bool,
    colors: bool,
    cpu: XmrigCpu,
    http: XmrigHttp<'a>,
    pools: [XmrigPool<'a>; 1],
}

#[derive(Serialize)]
struct XmrigCpu {
    enabled: bool,
    #[serde(rename = "max-threads-hint")]
    max_threads_hint: u8,
    #[serde(rename = "yield")]
    yield_threads: bool,
}

#[derive(Serialize)]
struct XmrigHttp<'a> {
    enabled: bool,
    host: &'a str,
    port: u16,
    #[serde(rename = "access-token")]
    access_token: &'a str,
    restricted: bool,
}

#[derive(Serialize)]
struct XmrigPool<'a> {
    algo: &'static str,
    url: String,
    user: &'a str,
    pass: &'static str,
    #[serde(rename = "rig-id", skip_serializing_if = "Option::is_none")]
    rig_id: Option<&'a str>,
    tls: bool,
    enabled: bool,
}

pub fn validate(
    config: MiningConfig,
    expected_version: &str,
) -> Result<ValidatedMiningConfig, EngineError> {
    let invalid = |message: &str| EngineError {
        kind: EngineErrorKind::InvalidConfiguration,
        message: message.to_owned(),
    };

    if expected_version.trim().is_empty() {
        return Err(invalid("Engine version is required"));
    }
    if !valid_host(&config.pool.host) || config.pool.port == 0 {
        return Err(invalid("Pool endpoint must have a valid host and port"));
    }
    if config.public_address.trim().is_empty()
        || config.public_address.len() > MAX_ADDRESS_LENGTH
        || config.public_address.chars().any(char::is_control)
    {
        return Err(invalid(
            "Public receiving address must be non-empty and bounded",
        ));
    }
    if let Some(worker_id) = &config.worker_id {
        if worker_id.is_empty()
            || worker_id.len() > 64
            || !worker_id
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || b"._-".contains(&byte))
        {
            return Err(invalid("Worker identifier contains unsupported characters"));
        }
    }
    if config.cpu.max_threads_hint == 0 || config.cpu.max_threads_hint > 100 {
        return Err(invalid("CPU thread hint must be between 1 and 100"));
    }
    if config.api.host != "127.0.0.1" {
        return Err(invalid("XMRig API host must be exactly 127.0.0.1"));
    }
    if config.api.port == 0 {
        return Err(invalid("A known non-zero local API port is required"));
    }
    if config.api.access_token.len() < MIN_TOKEN_LENGTH
        || !config
            .api
            .access_token
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"_-".contains(&byte))
    {
        return Err(invalid("API token must be at least 32 URL-safe characters"));
    }
    if !config.api.restricted {
        return Err(invalid("Restricted local API mode is required"));
    }

    Ok(ValidatedMiningConfig {
        config,
        engine_version: expected_version.trim().to_owned(),
    })
}

fn valid_host(host: &str) -> bool {
    if host.is_empty() || host.len() > 253 || host.chars().any(char::is_control) {
        return false;
    }
    if host.parse::<IpAddr>().is_ok() {
        return true;
    }
    host.split('.').all(|label| {
        !label.is_empty()
            && label.len() <= 63
            && label.as_bytes()[0].is_ascii_alphanumeric()
            && label.as_bytes()[label.len() - 1].is_ascii_alphanumeric()
            && label
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
    })
}

pub fn generate_json(config: &ValidatedMiningConfig) -> Result<String, EngineError> {
    let settings = &config.config;
    let generated = XmrigConfig {
        autosave: false,
        background: false,
        colors: false,
        cpu: XmrigCpu {
            enabled: settings.cpu.enabled,
            max_threads_hint: settings.cpu.max_threads_hint,
            yield_threads: true,
        },
        http: XmrigHttp {
            enabled: true,
            host: &settings.api.host,
            port: settings.api.port,
            access_token: &settings.api.access_token,
            restricted: true,
        },
        pools: [XmrigPool {
            algo: "rx/0",
            url: pool_url(settings),
            user: &settings.public_address,
            pass: "x",
            rig_id: settings.worker_id.as_deref(),
            tls: settings.pool.tls,
            enabled: true,
        }],
    };
    serde_json::to_string_pretty(&generated).map_err(|_| EngineError {
        kind: EngineErrorKind::Internal,
        message: "Could not serialize validated miner configuration".to_owned(),
    })
}

fn pool_url(config: &MiningConfig) -> String {
    if config.pool.host.parse::<std::net::Ipv6Addr>().is_ok() {
        format!("[{}]:{}", config.pool.host, config.pool.port)
    } else {
        format!("{}:{}", config.pool.host, config.pool.port)
    }
}

#[cfg(test)]
pub(crate) mod tests {
    use super::{generate_json, validate};
    use crate::mining::domain::{CpuConfig, LocalApiConfig, MiningConfig, PoolConfig};

    pub(crate) fn fixture_config() -> MiningConfig {
        MiningConfig {
            pool: PoolConfig {
                host: "pool.example.invalid".to_owned(),
                port: 3333,
                tls: true,
            },
            public_address: "TEST_ONLY_PUBLIC_ADDRESS_DO_NOT_USE".to_owned(),
            worker_id: Some("fixture-worker".to_owned()),
            cpu: CpuConfig {
                enabled: true,
                max_threads_hint: 50,
            },
            api: LocalApiConfig {
                host: "127.0.0.1".to_owned(),
                port: 18080,
                access_token: "test_only_token_0123456789abcdef".to_owned(),
                restricted: true,
            },
        }
    }

    #[test]
    fn generated_json_is_deterministic_and_contains_only_supported_fields() {
        let validated = validate(fixture_config(), "6.26.0").unwrap();
        let first = generate_json(&validated).unwrap();
        let second = generate_json(&validated).unwrap();
        assert_eq!(first, second);
        let parsed: serde_json::Value = serde_json::from_str(&first).unwrap();
        assert_eq!(parsed["autosave"], false);
        assert_eq!(parsed["http"]["host"], "127.0.0.1");
        assert_eq!(parsed["http"]["restricted"], true);
        assert_eq!(parsed["pools"][0]["url"], "pool.example.invalid:3333");
        assert_eq!(
            parsed["pools"][0]["user"],
            "TEST_ONLY_PUBLIC_ADDRESS_DO_NOT_USE"
        );
        assert!(parsed.get("wallet_private_key").is_none());
    }

    #[test]
    fn validation_rejects_untrusted_hosts_tokens_and_unsafe_settings() {
        let mut config = fixture_config();
        config.api.host = "0.0.0.0".to_owned();
        assert!(validate(config, "6.26.0").is_err());

        let mut config = fixture_config();
        config.api.host = "::".to_owned();
        assert!(validate(config, "6.26.0").is_err());

        let mut config = fixture_config();
        config.api.host = "192.168.1.2".to_owned();
        assert!(validate(config, "6.26.0").is_err());

        let mut config = fixture_config();
        config.api.access_token.clear();
        assert!(validate(config, "6.26.0").is_err());

        let mut config = fixture_config();
        config.api.port = 0;
        assert!(validate(config, "6.26.0").is_err());

        let mut config = fixture_config();
        config.api.restricted = false;
        assert!(validate(config, "6.26.0").is_err());
    }

    #[test]
    fn validation_rejects_invalid_pool_and_address_shape() {
        let mut config = fixture_config();
        config.pool.host = "https://pool.example".to_owned();
        assert!(validate(config, "6.26.0").is_err());

        let mut config = fixture_config();
        config.public_address = " \n".to_owned();
        assert!(validate(config, "6.26.0").is_err());
    }
}
