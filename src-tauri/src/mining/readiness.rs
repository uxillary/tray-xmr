//! Local setup validation and Rust-owned per-start configuration construction.
use super::{
    config,
    domain::{CpuConfig, LocalApiConfig, MiningConfig, PoolConfig},
    provisioner, wallet,
};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    net::TcpListener,
    path::{Path, PathBuf},
};

const SCHEMA: u32 = 1;
const DISCLOSURE: u32 = 1;
const STORAGE_ERROR: &str = "Local setup could not be read or saved. Retry, or reset saved setup.";

#[derive(Clone, Copy, PartialEq, Eq, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum EngineState {
    NotInstalled,
    Verifying,
    Ready,
    Modified,
    Unsupported,
    Error,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ResourceProfile {
    Quiet,
    Balanced,
    Performance,
}

impl ResourceProfile {
    pub fn threads(self, logical: usize) -> Option<usize> {
        if !(1..=4096).contains(&logical) {
            return None;
        }
        let divisor = match self {
            Self::Quiet => 4,
            Self::Balanced => 2,
            Self::Performance => 1,
        };
        Some((logical / divisor).max(1))
    }
}

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PoolSetup {
    pub host: String,
    pub port: u16,
    pub tls: bool,
    pub worker: Option<String>,
}

impl PoolSetup {
    fn normalize(mut self) -> Result<Self, String> {
        self.host = self.host.trim().to_ascii_lowercase();
        self.worker = self
            .worker
            .map(|s| s.trim().to_owned())
            .filter(|s| !s.is_empty());
        if !config::valid_host(&self.host) || self.port == 0 {
            return Err("Enter a host or IP address without a URL, credentials or path, and a port from 1 to 65535.".into());
        }
        if self.worker.as_ref().is_some_and(|s| {
            s.len() > 64
                || !s
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
        }) {
            return Err(
                "Worker name must be at most 64 letters, digits, dots, underscores or hyphens."
                    .into(),
            );
        }
        Ok(self)
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SavedSetup {
    schema_version: u32,
    revision: u64,
    public_address: Option<String>,
    pool: Option<PoolSetup>,
    profile: Option<ResourceProfile>,
    acknowledgement: Option<Acknowledgement>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Acknowledgement {
    disclosure_version: u32,
    setup_revision: u64,
}

impl Default for SavedSetup {
    fn default() -> Self {
        Self {
            schema_version: SCHEMA,
            revision: 0,
            public_address: None,
            pool: None,
            profile: None,
            acknowledgement: None,
        }
    }
}

#[derive(Deserialize)]
#[serde(
    rename_all = "camelCase",
    tag = "kind",
    content = "value",
    deny_unknown_fields
)]
pub enum SetupChange {
    Wallet(Option<String>),
    Pool(Option<PoolSetup>),
    Profile(Option<ResourceProfile>),
    Acknowledge(ConsentReview),
    Revoke,
    Reset,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ConsentReview {
    revision: u64,
    risks: bool,
    selections: bool,
    donations: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadinessCheck {
    pub id: &'static str,
    pub label: &'static str,
    pub passed: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MiningReadiness {
    pub engine: EngineState,
    pub engine_issue: Option<&'static str>,
    pub engine_version: &'static str,
    pub wallet_masked: Option<String>,
    pub pool: Option<PoolSetup>,
    pub profile: Option<ResourceProfile>,
    pub logical_processors: usize,
    pub threads: Option<usize>,
    pub profile_options: Vec<ProfileOption>,
    pub revision: u64,
    pub acknowledged: bool,
    pub checks: Vec<ReadinessCheck>,
    pub ready: bool,
    pub start_allowed: bool,
    pub start_reason: &'static str,
    pub storage_error: Option<&'static str>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileOption {
    profile: ResourceProfile,
    threads: Option<usize>,
}

pub struct SetupService {
    root: PathBuf,
    saved: SavedSetup,
    storage_error: bool,
}

fn supported(os: &str, architecture: &str) -> bool {
    os == "windows" && architecture == "x86_64"
}

impl SetupService {
    pub fn load(root: PathBuf) -> Self {
        let result = load_saved(&root.join("setup-v1.json"));
        let storage_error = result.is_err();
        Self {
            root,
            saved: result.unwrap_or_default(),
            storage_error,
        }
    }

    pub fn snapshot(&self, logical: usize, no_process: bool) -> MiningReadiness {
        let verification = if !supported(std::env::consts::OS, std::env::consts::ARCH)
            || !provisioner::platform_supported()
        {
            Err(provisioner::VerificationIssue::UnsupportedPlatform)
        } else if !self.root.exists() {
            Err(provisioner::VerificationIssue::NotInstalled)
        } else {
            provisioner::verify_installation(&self.root)
        };
        let engine_issue = verification
            .as_ref()
            .err()
            .map(|issue| issue.owner_message());
        let engine = match verification {
            Ok(_) => EngineState::Ready,
            Err(provisioner::VerificationIssue::UnsupportedPlatform) => EngineState::Unsupported,
            Err(provisioner::VerificationIssue::NotInstalled) => EngineState::NotInstalled,
            Err(
                provisioner::VerificationIssue::UnsafeInstallPath
                | provisioner::VerificationIssue::MetadataUnreadable
                | provisioner::VerificationIssue::ExecutableUnreadable,
            ) => EngineState::Error,
            Err(_) => EngineState::Modified,
        };
        let threads = self.saved.profile.and_then(|p| p.threads(logical));
        let address_valid = self
            .saved
            .public_address
            .as_deref()
            .is_some_and(wallet::valid);
        let pool_valid = self
            .saved
            .pool
            .clone()
            .is_some_and(|p| p.normalize().is_ok());
        let acknowledged = self.saved.acknowledgement.as_ref().is_some_and(|a| {
            a.disclosure_version == DISCLOSURE && a.setup_revision == self.saved.revision
        });
        let runtime_valid = engine == EngineState::Ready
            && address_valid
            && pool_valid
            && threads.is_some()
            && self.candidate(threads.unwrap_or(0)).is_ok();
        let mut snapshot = MiningReadiness {
            engine,
            engine_issue,
            engine_version: provisioner::VERSION,
            wallet_masked: self
                .saved
                .public_address
                .as_deref()
                .filter(|_| address_valid)
                .map(mask_address),
            pool: self.saved.pool.clone(),
            profile: self.saved.profile,
            logical_processors: logical,
            threads,
            profile_options: [
                ResourceProfile::Quiet,
                ResourceProfile::Balanced,
                ResourceProfile::Performance,
            ]
            .into_iter()
            .map(|profile| ProfileOption {
                profile,
                threads: profile.threads(logical),
            })
            .collect(),
            revision: self.saved.revision,
            acknowledged,
            checks: vec![],
            ready: false,
            start_allowed: false,
            start_reason: "Complete the required setup checks before starting.",
            storage_error: self.storage_error.then_some(STORAGE_ERROR),
        };
        snapshot.checks = checks([
            engine == EngineState::Ready,
            address_valid,
            pool_valid,
            threads.is_some(),
            runtime_valid,
            acknowledged,
            no_process,
            engine != EngineState::Unsupported && logical > 0,
            !self.storage_error,
        ]);
        if engine_issue.is_some() {
            snapshot.checks[0].label = "Mining engine needs attention";
        }
        snapshot.ready = snapshot.checks.iter().all(|c| c.passed);
        snapshot.start_allowed = snapshot.ready && no_process;
        if snapshot.start_allowed {
            snapshot.start_reason = "Ready to start a controlled mining session.";
        }
        snapshot
    }

    /// Generates a fresh validated config and reserves its loopback port until launch.
    pub fn prepare_start(&self, logical: usize) -> Result<RuntimeCandidate, String> {
        let readiness = self.snapshot(logical, true);
        if !readiness.start_allowed {
            return Err(readiness
                .engine_issue
                .unwrap_or("Complete setup and review the current choices before starting")
                .into());
        }
        self.candidate(
            readiness
                .threads
                .ok_or("Choose a supported resource profile")?,
        )
    }

    fn candidate(&self, threads: usize) -> Result<RuntimeCandidate, String> {
        let pool = self
            .saved
            .pool
            .clone()
            .ok_or("Pool is required")?
            .normalize()?;
        let reservation = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0))
            .map_err(|_| "Local API port could not be reserved")?;
        let port = reservation
            .local_addr()
            .map_err(|_| "Local API port is unavailable")?
            .port();
        let mut bytes = [0u8; 32];
        getrandom::fill(&mut bytes).map_err(|_| "Secure API token generation failed")?;
        let config = MiningConfig {
            pool: PoolConfig {
                host: pool.host,
                port: pool.port,
                tls: pool.tls,
            },
            public_address: self
                .saved
                .public_address
                .clone()
                .ok_or("Wallet is required")?,
            worker_id: pool.worker,
            cpu: CpuConfig {
                enabled: true,
                max_threads_hint: 100,
                threads: Some(threads),
            },
            api: LocalApiConfig {
                host: "127.0.0.1".into(),
                port,
                access_token: hex::encode(bytes),
                restricted: true,
            },
        };
        let validated = config::validate(config, provisioner::VERSION).map_err(|e| e.message)?;
        let json = config::generate_json(&validated).map_err(|e| e.message)?;
        Ok(RuntimeCandidate {
            reservation: Some(reservation),
            json,
            validated,
            profile: self.saved.profile.ok_or("Choose a supported resource profile")?,
        })
    }

    pub fn data_root(&self) -> &Path {
        &self.root
    }

    pub fn update(
        &mut self,
        change: SetupChange,
        logical: usize,
        no_process: bool,
    ) -> Result<MiningReadiness, String> {
        if !no_process {
            return Err("Stop the owned engine before editing setup".into());
        }
        if self.storage_error && !matches!(change, SetupChange::Reset) {
            return Err(STORAGE_ERROR.into());
        }
        let mut next = self.saved.clone();
        match change {
            SetupChange::Wallet(address) => {
                next.public_address = match address {
                    Some(s) if wallet::valid(s.trim()) => Some(s.trim().into()),
                    Some(_) => return Err("Enter a valid mainnet Monero public receiving address. Never enter private keys or seed words.".into()),
                    None => None,
                };
                invalidate(&mut next)?;
            }
            SetupChange::Pool(pool) => {
                next.pool = pool.map(PoolSetup::normalize).transpose()?;
                invalidate(&mut next)?;
            }
            SetupChange::Profile(profile) => {
                next.profile = profile;
                invalidate(&mut next)?;
            }
            SetupChange::Acknowledge(review) => {
                let snapshot = self.snapshot(logical, no_process);
                if !review.risks
                    || !review.selections
                    || !review.donations
                    || review.revision != next.revision
                    || snapshot
                        .checks
                        .iter()
                        .any(|c| c.id != "consent" && !c.passed)
                {
                    return Err(
                        "Complete setup and review the current selections before acknowledging"
                            .into(),
                    );
                }
                next.acknowledgement = Some(Acknowledgement {
                    disclosure_version: DISCLOSURE,
                    setup_revision: review.revision,
                });
            }
            SetupChange::Revoke => next.acknowledgement = None,
            SetupChange::Reset => {
                next = SavedSetup::default();
                next.revision = self.saved.revision.checked_add(1).ok_or(STORAGE_ERROR)?;
            }
        }
        save_saved(&self.root, &next)?;
        self.saved = next;
        self.storage_error = false;
        Ok(self.snapshot(logical, no_process))
    }
}

// Neither this candidate nor persisted personal configuration implements Debug/Serialize to IPC.
pub struct RuntimeCandidate {
    reservation: Option<TcpListener>,
    json: String,
    pub validated: super::domain::ValidatedMiningConfig,
    pub profile: ResourceProfile,
}

impl RuntimeCandidate {
    pub fn config_json(&self) -> &str {
        &self.json
    }
    pub fn release_port(&mut self) {
        self.reservation.take();
    }
}

fn invalidate(saved: &mut SavedSetup) -> Result<(), String> {
    saved.revision = saved.revision.checked_add(1).ok_or(STORAGE_ERROR)?;
    saved.acknowledgement = None;
    Ok(())
}

fn mask_address(address: &str) -> String {
    format!("{}…{}", &address[..6], &address[address.len() - 6..])
}

fn checks(values: [bool; 9]) -> Vec<ReadinessCheck> {
    [
        ("engine", "Engine verified"),
        ("wallet", "Public wallet validated"),
        ("pool", "Pool configured (connection untested)"),
        ("profile", "Resource profile selected"),
        ("runtime", "Candidate config validated locally"),
        ("consent", "Disclosures acknowledged"),
        ("process", "No owned engine process"),
        ("platform", "Supported platform and CPU count"),
        ("storage", "Local setup available"),
    ]
    .into_iter()
    .zip(values)
    .map(|((id, label), passed)| ReadinessCheck { id, label, passed })
    .collect()
}

fn load_saved(path: &Path) -> Result<SavedSetup, String> {
    let metadata = match fs::symlink_metadata(path) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(SavedSetup::default()),
        Err(_) => return Err(STORAGE_ERROR.into()),
        Ok(m) => m,
    };
    use std::os::windows::fs::MetadataExt;
    if metadata.len() > 16 * 1024 || metadata.file_attributes() & 0x400 != 0 {
        return Err(STORAGE_ERROR.into());
    }
    let data = fs::read(path).map_err(|_| STORAGE_ERROR)?;
    let saved: SavedSetup = serde_json::from_slice(&data).map_err(|_| STORAGE_ERROR)?;
    if saved.schema_version != SCHEMA
        || saved
            .public_address
            .as_deref()
            .is_some_and(|s| !wallet::valid(s))
        || saved.pool.clone().is_some_and(|p| {
            p.clone().normalize().is_err() || p.clone().normalize().ok().as_ref() != Some(&p)
        })
    {
        return Err(STORAGE_ERROR.into());
    }
    Ok(saved)
}

fn save_saved(root: &Path, saved: &SavedSetup) -> Result<(), String> {
    fs::create_dir_all(root).map_err(|_| STORAGE_ERROR)?;
    provisioner::verify_install_location(root).map_err(|_| STORAGE_ERROR)?;
    let mut nonce = [0u8; 16];
    getrandom::fill(&mut nonce).map_err(|_| STORAGE_ERROR)?;
    let temporary = root.join(format!(".setup-{}.tmp", hex::encode(nonce)));
    let result = (|| {
        let mut file = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&temporary)
            .map_err(|_| STORAGE_ERROR)?;
        let bytes = serde_json::to_vec_pretty(saved).map_err(|_| STORAGE_ERROR)?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|_| STORAGE_ERROR)?;
        drop(file);
        replace_file(&temporary, &root.join("setup-v1.json"))
    })();
    if result.is_err() {
        let _ = fs::remove_file(temporary);
    }
    result
}

fn replace_file(source: &Path, destination: &Path) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{
        MoveFileExW, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH,
    };
    let source: Vec<u16> = source.as_os_str().encode_wide().chain(Some(0)).collect();
    let destination: Vec<u16> = destination
        .as_os_str()
        .encode_wide()
        .chain(Some(0))
        .collect();
    // Same-directory atomic replacement; no truncation of the previous setup on failure.
    if unsafe {
        MoveFileExW(
            source.as_ptr(),
            destination.as_ptr(),
            MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH,
        )
    } == 0
    {
        return Err(STORAGE_ERROR.into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn static_profiles_are_bounded_and_deterministic() {
        assert_eq!(ResourceProfile::Quiet.threads(16), Some(4));
        assert_eq!(ResourceProfile::Balanced.threads(16), Some(8));
        assert_eq!(ResourceProfile::Performance.threads(16), Some(16));
        assert_eq!(ResourceProfile::Quiet.threads(1), Some(1));
        assert_eq!(ResourceProfile::Balanced.threads(0), None);
        assert!(!supported("windows", "aarch64"));
        assert!(!supported("linux", "x86_64"));
    }
    #[test]
    fn pool_inputs_are_normalized_without_network() {
        let pool = PoolSetup {
            host: " POOL.EXAMPLE.INVALID ".into(),
            port: 443,
            tls: true,
            worker: Some("worker-1".into()),
        };
        assert_eq!(pool.normalize().unwrap().host, "pool.example.invalid");
        for host in [
            "user@pool.example",
            "https://pool.example",
            "a;whoami",
            "a/b",
            "a:443",
            "-a",
            "",
            "a..b",
        ] {
            assert!(PoolSetup {
                host: host.into(),
                port: 443,
                tls: true,
                worker: None
            }
            .normalize()
            .is_err());
        }
        assert!(PoolSetup {
            host: "::1".into(),
            port: 443,
            tls: false,
            worker: None
        }
        .normalize()
        .is_ok());
        assert!(PoolSetup {
            host: "pool.example".into(),
            port: 0,
            tls: true,
            worker: None
        }
        .normalize()
        .is_err());
        assert!(PoolSetup {
            host: "pool.example".into(),
            port: 443,
            tls: true,
            worker: Some("a --config".into())
        }
        .normalize()
        .is_err());
    }
    #[test]
    fn every_prerequisite_is_required() {
        assert!(checks([true; 9]).iter().all(|c| c.passed));
        for index in 0..9 {
            let mut values = [true; 9];
            values[index] = false;
            assert!(!checks(values).iter().all(|c| c.passed));
        }
    }
    #[test]
    fn persistence_replacement_roundtrip_and_consent_invalidation() {
        let root = std::env::temp_dir().join(format!(
            "ember-setup-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let mut service = SetupService::load(root.clone());
        service
            .update(SetupChange::Wallet(Some(wallet::fixture(18))), 8, true)
            .unwrap();
        service
            .update(
                SetupChange::Profile(Some(ResourceProfile::Balanced)),
                8,
                true,
            )
            .unwrap();
        let loaded = SetupService::load(root.clone());
        assert_eq!(loaded.saved.public_address, service.saved.public_address);
        assert_eq!(loaded.saved.profile, Some(ResourceProfile::Balanced));
        assert!(!loaded.snapshot(8, true).ready);
        assert!(service
            .update(
                SetupChange::Acknowledge(ConsentReview {
                    revision: service.saved.revision,
                    risks: true,
                    selections: true,
                    donations: true
                }),
                8,
                true
            )
            .is_err());
        service.saved.acknowledgement = Some(Acknowledgement {
            disclosure_version: DISCLOSURE,
            setup_revision: service.saved.revision,
        });
        service
            .update(SetupChange::Profile(Some(ResourceProfile::Quiet)), 8, true)
            .unwrap();
        assert!(service.saved.acknowledgement.is_none());
        let dto = serde_json::to_string(&service.snapshot(8, true)).unwrap();
        assert!(!dto.contains(&wallet::fixture(18)));
        assert!(!dto.contains("accessToken") && !dto.contains("access-token"));
        let persisted = fs::read_to_string(root.join("setup-v1.json")).unwrap();
        assert!(
            !persisted.contains("token")
                && !persisted.contains("runtime")
                && !persisted.contains("diagnostics")
        );
        fs::write(root.join("setup-v1.json"), b"{broken").unwrap();
        assert!(SetupService::load(root.clone()).storage_error);
        fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn complete_configuration_candidate_and_acknowledgement_are_required() {
        let root = std::env::temp_dir().join(format!(
            "ember-ready-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        provisioner::install_fixture(&root);
        let mut service = SetupService::load(root.clone());
        let ui_verification = service.snapshot(8, true);
        assert_eq!(ui_verification.engine, EngineState::Ready);
        assert_eq!(ui_verification.engine_issue, None);
        let first = provisioner::verify_installation(&root).unwrap();
        assert_eq!(first.metadata().engine, "xmrig");
        let fresh_pre_spawn = provisioner::verify_installation(&root).unwrap();
        assert!(first.same_installation(&fresh_pre_spawn));
        let artifact = fresh_pre_spawn.artifact();
        assert_eq!(artifact.engine_name(), "XMRig");
        assert!(artifact.is_verified());
        assert!(super::super::xmrig::XmrigAdapter::new(artifact).is_ok());
        let legacy_id_artifact = super::super::domain::EngineArtifact::verified_fixture(
            "xmrig",
            "6.26.0",
            "windows-x64",
            "fixture://pinned-release",
            &"a".repeat(64),
            fresh_pre_spawn.executable_path(),
        );
        assert!(legacy_id_artifact.is_verified());
        let identity_error = super::super::xmrig::XmrigAdapter::new(legacy_id_artifact)
            .err()
            .unwrap();
        assert_eq!(
            identity_error.message,
            "The verified installation has an unsupported engine identity"
        );
        assert!(!service.snapshot(8, true).ready);
        service
            .update(SetupChange::Wallet(Some(wallet::fixture(42))), 8, true)
            .unwrap();
        service
            .update(
                SetupChange::Pool(Some(PoolSetup {
                    host: "pool.example.invalid".into(),
                    port: 443,
                    tls: true,
                    worker: None,
                })),
                8,
                true,
            )
            .unwrap();
        service
            .update(
                SetupChange::Profile(Some(ResourceProfile::Balanced)),
                8,
                true,
            )
            .unwrap();
        let revision = service.saved.revision;
        assert!(service
            .update(
                SetupChange::Acknowledge(ConsentReview {
                    revision: revision - 1,
                    risks: true,
                    selections: true,
                    donations: true
                }),
                8,
                true
            )
            .is_err());
        assert!(service
            .update(
                SetupChange::Acknowledge(ConsentReview {
                    revision,
                    risks: false,
                    selections: true,
                    donations: true
                }),
                8,
                true
            )
            .is_err());
        let snapshot = service
            .update(
                SetupChange::Acknowledge(ConsentReview {
                    revision,
                    risks: true,
                    selections: true,
                    donations: true,
                }),
                8,
                true,
            )
            .unwrap();
        assert!(snapshot.ready);
        assert!(snapshot.start_allowed);
        assert!(!service.snapshot(8, false).ready);
        assert!(!service.snapshot(0, true).ready);
        let candidate = service.candidate(4).unwrap();
        let json: serde_json::Value = serde_json::from_str(candidate.config_json()).unwrap();
        assert_eq!(json["cpu"]["rx"], serde_json::json!([-1, -1, -1, -1]));
        assert_eq!(json["randomx"]["init"], 4);
        assert_eq!(json["cpu"]["huge-pages"], false);
        assert_eq!(json["randomx"]["wrmsr"], false);
        assert_eq!(json["http"]["host"], "127.0.0.1");
        assert_eq!(json["http"]["restricted"], true);
        let token = json["http"]["access-token"].as_str().unwrap();
        assert_eq!(token.len(), 64);
        let dto = serde_json::to_string(&snapshot).unwrap();
        assert!(!dto.contains(token));
        let second = service.candidate(4).unwrap();
        assert_ne!(candidate.json, second.json); // Fresh ephemeral secrets and port; JSON otherwise deterministic.
        let directory = provisioner::verify_install_location(&root).unwrap();
        fs::write(directory.join("xmrig.exe"), b"modified").unwrap();
        let snapshot = service.snapshot(8, true);
        assert_eq!(snapshot.engine, EngineState::Modified);
        assert_eq!(
            snapshot.engine_issue,
            Some(provisioner::VerificationIssue::ExecutableDigestMismatch.owner_message())
        );
        assert!(!snapshot.ready);
        assert!(!snapshot.start_allowed);
        fs::remove_file(directory.join("ember-verification.json")).unwrap();
        assert_eq!(service.snapshot(8, true).engine, EngineState::Modified);
        fs::remove_dir_all(root).unwrap();
    }
}
