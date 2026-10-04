use super::domain::{DiagnosticSource, DiagnosticSummary};
use std::collections::VecDeque;

const MAX_LINE_BYTES: usize = 2 * 1024;

#[derive(Clone)]
pub struct RedactionSecrets {
    values: Vec<String>,
}

impl std::fmt::Debug for RedactionSecrets {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("RedactionSecrets([REDACTED])")
    }
}

impl RedactionSecrets {
    pub fn new(values: impl IntoIterator<Item = String>) -> Self {
        Self {
            values: values
                .into_iter()
                .filter(|value| !value.is_empty())
                .collect(),
        }
    }

    pub fn redact(&self, input: &str) -> String {
        let mut safe = strip_terminal_controls(input)
            .chars()
            .take(MAX_LINE_BYTES)
            .collect::<String>();
        for secret in &self.values {
            safe = safe.replace(secret, "[REDACTED]");
        }
        let lower = safe.to_ascii_lowercase();
        if (safe.trim_start().starts_with('{') && safe.contains("\"pools\""))
            || lower.contains("\"access-token\"")
            || lower.contains("authorization:")
            || lower.contains("authorization ")
        {
            return "[runtime configuration or authorization material omitted]".into();
        }
        safe
    }

    pub fn with_values(&self, values: impl IntoIterator<Item = String>) -> Self {
        let mut secrets = self.values.clone();
        secrets.extend(values.into_iter().filter(|value| !value.is_empty()));
        Self { values: secrets }
    }
}

fn strip_terminal_controls(input: &str) -> String {
    #[derive(Clone, Copy)]
    enum EscapeState {
        Text,
        Escape,
        Csi,
        Osc,
        OscEscape,
    }
    let mut state = EscapeState::Text;
    let mut output = String::with_capacity(input.len());
    for ch in input.chars() {
        state = match state {
            EscapeState::Text => match ch {
                '\u{1b}' => EscapeState::Escape,
                '\n' | '\r' => EscapeState::Text,
                c if c.is_control() => EscapeState::Text,
                c => {
                    output.push(c);
                    EscapeState::Text
                }
            },
            EscapeState::Escape => match ch {
                '[' => EscapeState::Csi,
                ']' => EscapeState::Osc,
                _ => EscapeState::Text,
            },
            EscapeState::Csi => {
                if ('@'..='~').contains(&ch) {
                    EscapeState::Text
                } else {
                    EscapeState::Csi
                }
            }
            EscapeState::Osc => match ch {
                '\u{7}' => EscapeState::Text,
                '\u{1b}' => EscapeState::OscEscape,
                _ => EscapeState::Osc,
            },
            EscapeState::OscEscape => {
                if ch == '\\' {
                    EscapeState::Text
                } else {
                    EscapeState::Osc
                }
            }
        };
    }
    output
}

pub struct DiagnosticRing {
    entries: VecDeque<DiagnosticSummary>,
    max_lines: usize,
    max_bytes: usize,
    current_bytes: usize,
    redaction: RedactionSecrets,
}

impl DiagnosticRing {
    pub fn new(max_lines: usize, max_bytes: usize, redaction: RedactionSecrets) -> Self {
        Self {
            entries: VecDeque::new(),
            max_lines: max_lines.max(1),
            max_bytes: max_bytes.max(64),
            current_bytes: 0,
            redaction,
        }
    }

    pub fn push(&mut self, source: DiagnosticSource, raw: &str) {
        let safe = self.redaction.redact(raw);
        let event = classify_event(&safe);
        let message = if event.is_empty() {
            safe
        } else {
            format!("{event}: {safe}")
        };
        let size = message.len();
        if size > self.max_bytes {
            return;
        }
        while self.entries.len() >= self.max_lines || self.current_bytes + size > self.max_bytes {
            if let Some(removed) = self.entries.pop_front() {
                self.current_bytes = self.current_bytes.saturating_sub(removed.message.len());
            } else {
                break;
            }
        }
        self.current_bytes += size;
        self.entries
            .push_back(DiagnosticSummary { source, message });
    }

    pub fn snapshot(&self) -> Vec<DiagnosticSummary> {
        self.entries.iter().cloned().collect()
    }
}

fn classify_event(message: &str) -> &'static str {
    let lower = message.to_ascii_lowercase();
    if lower.contains("http api") && lower.contains("127.0.0.1") {
        if lower.contains("unknown error") || lower.contains("bind failed") {
            "http-listener-bind-failed"
        } else {
            "http-listener-started"
        }
    } else if lower.contains("http api server failed to start") {
        "http-server-failed"
    } else if lower.contains("config") && (lower.contains("error") || lower.contains("invalid")) {
        "config-error"
    } else if lower.contains("randomx") {
        "randomx"
    } else if lower.contains("dns error") || lower.contains("name or service not known") {
        "pool-dns-failed"
    } else if lower.contains("pool") && lower.contains("tls") && lower.contains("error") {
        "pool-tls-failed"
    } else if lower.contains("pool") && lower.contains("auth") && lower.contains("reject") {
        "pool-auth-rejected"
    } else if lower.contains("new job from") {
        "pool-job-received"
    } else if lower.contains("pool") && lower.contains("connect") && lower.contains("error") {
        "pool-tcp-failed"
    } else if lower.contains("pool") && lower.contains("connect") {
        "pool-connected-or-connecting"
    } else if lower.contains("cpu")
        && (lower.contains("backend") || lower.contains("thread") || lower.contains("ready"))
    {
        "cpu-backend"
    } else if lower.contains("warning")
        || lower.contains("error")
        || lower.contains("failed")
        || lower.contains("fatal")
    {
        "warning-or-error"
    } else {
        ""
    }
}

#[cfg(test)]
mod tests {
    use super::{strip_terminal_controls, DiagnosticRing, RedactionSecrets};
    use crate::mining::domain::DiagnosticSource;

    #[test]
    fn redacts_address_token_and_user_path() {
        let secrets = RedactionSecrets::new([
            "TEST_ONLY_PUBLIC_ADDRESS_DO_NOT_USE".to_owned(),
            "test_only_token_0123456789abcdef".to_owned(),
            "C:\\Users\\Fixture".to_owned(),
        ]);
        let safe = secrets.redact("wallet TEST_ONLY_PUBLIC_ADDRESS_DO_NOT_USE token test_only_token_0123456789abcdef C:\\Users\\Fixture\\AppData");
        assert!(!safe.contains("TEST_ONLY_PUBLIC_ADDRESS"));
        assert!(!safe.contains("test_only_token"));
        assert!(!safe.contains("C:\\Users\\Fixture"));
        assert!(safe.contains("[REDACTED]"));
    }

    #[test]
    fn ring_is_bounded_by_lines_and_bytes() {
        let mut ring = DiagnosticRing::new(2, 128, RedactionSecrets::new([]));
        ring.push(DiagnosticSource::Stdout, "line one");
        ring.push(DiagnosticSource::Stderr, "line two");
        ring.push(DiagnosticSource::Stdout, "line three");
        let lines = ring.snapshot();
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0].message, "line two");
        assert_eq!(lines[1].message, "line three");
    }

    #[test]
    fn never_keeps_complete_runtime_config_or_authorization_headers() {
        let secrets = RedactionSecrets::new([
            "48edfHu7V9Z84YzzMa6fUueoELZ9ZRXq9VetWzYGzKt52XU5xvqgzYnDK9URnRoJMk1j8nLwEVsaSWJ4fhdUyZijBGUicoD".into(),
            "private-token-012345678901234567890".into(),
        ]);
        let config = r#"{"pools":[{"user":"48edfHu7V9Z84YzzMa6fUueoELZ9ZRXq9VetWzYGzKt52XU5xvqgzYnDK9URnRoJMk1j8nLwEVsaSWJ4fhdUyZijBGUicoD"}],"http":{"access-token":"private-token-012345678901234567890"}}"#;
        assert_eq!(
            secrets.redact(config),
            "[runtime configuration or authorization material omitted]"
        );
        assert_eq!(
            secrets.redact("Authorization: Bearer private-token-012345678901234567890"),
            "[runtime configuration or authorization material omitted]"
        );
    }

    #[test]
    fn copied_diagnostic_event_tail_contains_evidence_without_wallet_or_token() {
        let wallet = "TEST_PUBLIC_WALLET_ADDRESS_ONLY_FOR_REDACTION_TEST";
        let token = "private-token-012345678901234567890";
        let mut ring = DiagnosticRing::new(
            8,
            1024,
            RedactionSecrets::new([wallet.into(), token.into()]),
        );
        ring.push(
            DiagnosticSource::Stderr,
            &format!("HTTP API 127.0.0.1:18080 bind failed; wallet={wallet}; token={token}"),
        );
        let report_tail = ring
            .snapshot()
            .iter()
            .map(|entry| entry.message.as_str())
            .collect::<Vec<_>>()
            .join("\n");
        assert!(report_tail.contains("http-listener"));
        assert!(report_tail.contains("18080"));
        assert!(!report_tail.contains(wallet));
        assert!(!report_tail.contains(token));
    }

    #[test]
    fn ansi_control_sequences_are_removed_without_hiding_bind_evidence() {
        let safe =
            strip_terminal_controls("\u{1b}[32mHTTP API 127.0.0.1:58670 bind failed\u{1b}[0m\r\n");
        assert_eq!(safe, "HTTP API 127.0.0.1:58670 bind failed");
    }

    #[test]
    fn classifies_api_listener_failure_separately_from_pool_dns_failure() {
        let mut ring = DiagnosticRing::new(8, 2048, RedactionSecrets::new([]));
        ring.push(
            DiagnosticSource::Stdout,
            "* HTTP API 127.0.0.1:64207 unknown error",
        );
        ring.push(
            DiagnosticSource::Stderr,
            "net gulf.moneroocean.stream:443 DNS error: \"permanent failure\"",
        );
        let messages = ring
            .snapshot()
            .into_iter()
            .map(|entry| entry.message)
            .collect::<Vec<_>>();
        assert!(messages[0].starts_with("http-listener-bind-failed:"));
        assert!(messages[1].starts_with("pool-dns-failed:"));
        assert!(messages[0].contains("127.0.0.1:64207"));
        assert!(messages[1].contains("gulf.moneroocean.stream"));
    }

    #[test]
    fn classifies_listener_started_and_generic_server_failure() {
        assert_eq!(
            super::classify_event("* HTTP API 127.0.0.1:64207"),
            "http-listener-started"
        );
        assert_eq!(
            super::classify_event("net HTTP API server failed to start."),
            "http-server-failed"
        );
    }
}
