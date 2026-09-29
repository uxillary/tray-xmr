use super::domain::{DiagnosticSource, DiagnosticSummary};
use std::collections::VecDeque;

const MAX_LINE_BYTES: usize = 2 * 1024;

#[derive(Clone, Debug)]
pub struct RedactionSecrets {
    values: Vec<String>,
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
        let mut safe = input.chars().take(MAX_LINE_BYTES).collect::<String>();
        for secret in &self.values {
            safe = safe.replace(secret, "[REDACTED]");
        }
        safe
    }

    pub fn with_values(&self, values: impl IntoIterator<Item = String>) -> Self {
        let mut secrets = self.values.clone();
        secrets.extend(values.into_iter().filter(|value| !value.is_empty()));
        Self { values: secrets }
    }
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
        let message = self.redaction.redact(raw);
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

#[cfg(test)]
mod tests {
    use super::{DiagnosticRing, RedactionSecrets};
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
}
