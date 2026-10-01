//! Explicit, verified installation of the pinned upstream XMRig release.

use anyhow::{anyhow, bail, Context, Result};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Component, Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

pub const VERSION: &str = "6.26.0";
const ARCHIVE: &str = "xmrig-6.26.0-windows-x64.zip";
const ARCHIVE_SHA256: &str = "bba8097cb37d9b458a1cb1137876b27cde6740d17fe4ccbc086ba07d87d9e147";
const SIGNING_FINGERPRINT: &str = "9AC4CEA8E66E35A5C7CDDC1B446A53638BE94409";
const RELEASE_BASE: &str = "https://github.com/xmrig/xmrig/releases/download/v6.26.0";
const MAX_MANIFEST: usize = 32 * 1024;
const MAX_SIGNATURE: usize = 16 * 1024;
const MAX_ARCHIVE: usize = 16 * 1024 * 1024;
const MAX_EXTRACTED: u64 = 64 * 1024 * 1024;
const MAX_FILES: usize = 128;
const MAX_REDIRECTS: usize = 5;

const PUBLIC_KEY: &str = "-----BEGIN PGP PUBLIC KEY BLOCK-----\nmQENBF3VSRIBCADfFjDUbq0WLGulFeSou0A+jTvweNllPyLNOn3SNCC0XLEYyEcu\nJiEBK80DlvR06TVr8Aw1rT5S2iH0i5Tl8DqShH2mmcN1rBp1M0Y95D89KVj3BIhE\nnxmgmD4N3Wgm+5FmEH4W/RpG1xdYWJx3eJhtWPdFJqpg083E2D5P30wIQem+EnTR\n5YrtTZPh5cPj2KRY+UmsDE3ahmxCgP7LYgnnpZQlWBBiMV932s7MvYBPJQc1wecS\n0wi1zxyS81xHc3839EkA7wueCeNo+5jha+KH66tMKsfrI2WvfPHTCPjK9v7WJc/O\n/eRp9d+wacn09D1L6CoRO0ers5p10GO84VhTABEBAAG0GVhNUmlnIDxzdXBwb3J0\nQHhtcmlnLmNvbT6JAU4EEwEIADgWIQSaxM6o5m41pcfN3BtEalNji+lECQUCXdVJ\nEgIbAwULCQgHAgYVCgkICwIEFgIDAQIeAQIXgAAKCRBEalNji+lECbkQB/9nRou0\ntOlBwYn8xVgBu7IiDWNVETRWfrjrtdTvSahgbbo6lWgjA/vBLkjN9fISdBQ/n/Mt\nhNDJbEtxHHt2baJhvT8du1eWcIHHXCV/rmv+iY/hTXa1gKqHiHDJrtYSVBG3BMme\n1rdsUHTiKf3t5yRHOXAfY2C+XNblKAV7mhlxQBiKxdFDIkFEQKNrHNUvnzkOqoCT\n2kTZZ2tPUMQdOn1eek6zG/+C7SwcBpJnakJ8jce4yA/xZbOVKetNWO3Ufu3TE34k\nOdA+H4PU9+fV77XfOY8DtXeS3boUI97ei+4s/mwX/NFC0i8CPXyefxl3WRUBGDOI\nw//kPNQVh4HobOCeuQENBF3VSRIBCADl29WorEi+vRA/3kg9VUXtxSU6caibFS3N\nVXANiFRjrOmICdfrIgOSGNrYCQFsXu0Xe0udDYVX8yX6WJk+CT02Pdg0gkXiKoze\nKrnK15mo3xXbb2tr1o9ROPgwY/o2AwQHj0o1JhdS2cybfuRiUQRoGgBX7a9X0cTY\nr4ZJvOjzgAajl3ciwB3yWUmDiRlzZpO7YWESXbOhGVzyCnP5MlMEJ/fPRw9h38vK\nHNKLhzcRfsLpXk34ghY3SxIv4NWUfuZXFWqpSdC9JgNc5zA72lJEQcF4DHJCKl7B\nddmrfsr9mdiIpo+/ZZFPPngdeZ2kvkJ2YKaZNVu2XooJARPQ8B8tABEBAAGJATYE\nGAEIACAWIQSaxM6o5m41pcfN3BtEalNji+lECQUCXdVJEgIbDAAKCRBEalNji+lE\nCdPUB/4nH1IdhHGmfko2kxdaHqQgCGLqh3pcrQXD9mBv/LYVnoHZpVRHsIDgg2Z4\nlQYrIRRqe69FjVxo7sA2eMIlV0GRDlUrw+HeURFpEhKPEdwFy6i/cti2MY0YxOrB\nTvQoRutUoMnyjM4TBJWaaqccbTsavMdLmG3JHdAkiHtUis/fUwVctmEQwN+d/J2b\nwJAtliqw3nXchUfdIfwHF/7hg8seUuYUaifzkazBZhVWvRkTVLVanzZ51HRfuzwD\nntaa7kfYGdE+4TKOylAPh+8E6WnR19RRTpsaW0dVBgOiBTE0uc7rUv2HWS/u6RUR\nt7ldSBzkuDTlM2V59Iq2hXoSC6dT\n=cIG9\n-----END PGP PUBLIC KEY BLOCK-----\n";
#[cfg(test)]
const SIGNED_MANIFEST_FIXTURE: &str = "a49c08f780484d0a50e18065132228556c64e857bb6783ebf1da3eec0beceee6 *xmrig-6.26.0-focal-x64.tar.gz\nf766ec3ead48a21f9d478c309086b2fc4bd675747d91436d8ccf86d8fc57b18c *xmrig-6.26.0-freebsd-static-x64.tar.gz\nca82fc8426187880dffa502363849af6258e65fdb675a9cc9984a2b843854087 *xmrig-6.26.0-jammy-x64.tar.gz\nfc6f8ae5f64e4f17481f7e3be29a1c56949f216a998414188003eae1db20c9e5 *xmrig-6.26.0-linux-static-x64.tar.gz\n6ae4eb4216e99a201ae9a3d2c3a7c275207c5165cfc25da1f3d735d6c4829c18 *xmrig-6.26.0-macos-arm64.tar.gz\n1da924b358c0089e361540c4a9e6f8b09538b29efeafa2379590e0f6db358ff4 *xmrig-6.26.0-macos-x64.tar.gz\n18198537f741405f569db0e6ecdc11c01f514aa861843b49bfa1ef60fe2877e7 *xmrig-6.26.0-noble-x64.tar.gz\n958952de131c392a4e1e9656a1d70c3916d09d5a1f5e3f8c67dc0e6f35dbd76a *xmrig-6.26.0-windows-arm64.zip\n2de2ae3c2d01e6245e41101571cf7bb83e9236e8361213026308228d227b16fb *xmrig-6.26.0-windows-gcc-x64.zip\nbba8097cb37d9b458a1cb1137876b27cde6740d17fe4ccbc086ba07d87d9e147 *xmrig-6.26.0-windows-x64.zip\n";
#[cfg(test)]
const SIGNATURE_FIXTURE: &str = "-----BEGIN PGP SIGNATURE-----\n\niQEzBAABCgAdFiEEmsTOqOZuNaXHzdwbRGpTY4vpRAkFAmnH1jkACgkQRGpTY4vp\nRAlokgf/QwXQe9DfrQdEtHCH8N821QEvol/iVMyeajsFRAVvw2Qxrfxcpvq50WqD\n1DFt5yT4WZzuRC+SM/soXA6Xiq/v+/BeiN4dWoXBCtdMVwiP5oMRxlOBELXtCknW\n5viL085uyvbGON5cFn/K0mcF1x7L0sH/yXX70UAbV1GI3wPwvKQ3n7EczdRYyjms\ndic9seyPU3caorevYAvZm+4M5ufsh8L4r35MsCk5ildNW4Kn40qzm14DEUCvlOQq\nNyagOwzH08F5RA2wzl0dMYZYzzWEqHYBJBUc6nBxZKvbBmMHyPzb36yp9yYRdiHv\nfNYGuS+zQqoNM1G6Oc0hFwmcA9mtdA==\n=oKx5\n-----END PGP SIGNATURE-----\n";

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase", tag = "state", content = "detail")]
pub enum ProvisioningState {
    NotInstalled,
    Downloading,
    Verifying,
    Installing,
    Ready(InstalledEngine),
    Error(String),
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct InstalledEngine {
    pub engine: String,
    pub version: String,
    pub architecture: String,
    pub archive_sha256: String,
    pub executable_sha256: String,
    pub signing_fingerprint: String,
    pub upstream_source: String,
    pub installed_at_unix_ms: u128,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum VerificationIssue {
    UnsupportedPlatform,
    NotInstalled,
    UnsafeInstallPath,
    MetadataMissing,
    MetadataUnreadable,
    MetadataCorrupt,
    MetadataOutdated,
    ExecutableMissing,
    ExecutableUnreadable,
    ExecutableDigestMismatch,
}

impl VerificationIssue {
    pub fn owner_message(self) -> &'static str {
        match self {
            Self::UnsupportedPlatform => "This device cannot run the pinned XMRig build.",
            Self::NotInstalled => "XMRig is not installed. Set up the verified engine to continue.",
            Self::UnsafeInstallPath => "XMRig is in an unsafe or unsupported location. Use Repair to install it again.",
            Self::MetadataMissing => "XMRig verification metadata is missing. Repair the mining engine before starting.",
            Self::MetadataUnreadable => "XMRig verification metadata could not be read. Repair the mining engine before starting.",
            Self::MetadataCorrupt => "XMRig verification metadata is corrupt. Repair the mining engine before starting.",
            Self::MetadataOutdated => "XMRig verification metadata is outdated or does not match v6.26.0. Repair the mining engine before starting.",
            Self::ExecutableMissing => "The verified XMRig executable is missing. Repair the mining engine before starting.",
            Self::ExecutableUnreadable => "The XMRig executable could not be checked. Repair the mining engine before starting.",
            Self::ExecutableDigestMismatch => "The XMRig executable changed after verification. Repair the mining engine before starting.",
        }
    }

    fn diagnostic(self) -> &'static str {
        match self {
            Self::UnsupportedPlatform => "unsupported platform or architecture",
            Self::NotInstalled => "pinned install directory missing",
            Self::UnsafeInstallPath => "reparse point or unsafe install path rejected",
            Self::MetadataMissing => "verification metadata missing",
            Self::MetadataUnreadable => "verification metadata unreadable",
            Self::MetadataCorrupt => {
                "verification metadata malformed or has an unsupported field shape"
            }
            Self::MetadataOutdated => {
                "verification metadata does not match pinned release provenance"
            }
            Self::ExecutableMissing => "xmrig.exe missing",
            Self::ExecutableUnreadable => "xmrig.exe could not be hashed",
            Self::ExecutableDigestMismatch => {
                "xmrig.exe SHA-256 differs from persisted verification metadata"
            }
        }
    }
}

impl std::fmt::Display for VerificationIssue {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.diagnostic())
    }
}

impl std::error::Error for VerificationIssue {}

/// Evidence returned only after the pinned metadata, provenance and executable digest pass.
#[derive(Clone, Debug)]
pub struct VerifiedInstallation {
    metadata: InstalledEngine,
    directory: PathBuf,
}

impl VerifiedInstallation {
    pub fn metadata(&self) -> &InstalledEngine {
        &self.metadata
    }
    pub fn executable_path(&self) -> PathBuf {
        self.directory.join("xmrig.exe")
    }

    pub fn same_installation(&self, other: &Self) -> bool {
        self.metadata == other.metadata && self.directory == other.directory
    }

    pub(crate) fn artifact(&self) -> super::domain::EngineArtifact {
        let verified_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_millis().min(u64::MAX as u128) as u64)
            .unwrap_or(1);
        super::domain::EngineArtifact::verified_installed(
            "XMRig".into(),
            self.metadata.version.clone(),
            self.metadata.architecture.clone(),
            self.metadata.upstream_source.clone(),
            self.metadata.archive_sha256.clone(),
            self.executable_path(),
            verified_at,
        )
    }
}

pub fn provision(root: &Path) -> Result<InstalledEngine> {
    ensure_supported_architecture()?;
    let miners = root.join("miners").join("xmrig");
    fs::create_dir_all(&miners).context("Could not create Ember's local engine directory")?;
    verify_install_location(root)?;
    let destination = miners.join(VERSION);
    if destination.exists() {
        let installed = read_and_verify_install(&destination)?;
        return Ok(installed);
    }

    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let staging = miners.join(format!(".staging-{nonce}"));
    fs::create_dir(&staging).context("Could not create a fresh staging directory")?;
    let result = provision_staged(&staging, &destination);
    if result.is_err() {
        let _ = fs::remove_dir_all(&staging);
    }
    result
}

/// Fixed Rust-owned location, checked before any read, rename or extraction.
pub fn verify_install_location(root: &Path) -> Result<PathBuf> {
    let mut directory = root.to_path_buf();
    reject_reparse(&directory)?;
    for component in ["miners", "xmrig", VERSION] {
        directory.push(component);
        match fs::symlink_metadata(&directory) {
            Ok(_) => reject_reparse(&directory)?,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(error.into()),
        }
    }
    Ok(directory)
}

fn reject_reparse(path: &Path) -> Result<()> {
    use std::os::windows::fs::MetadataExt;
    let metadata = fs::symlink_metadata(path)?;
    if metadata.file_attributes() & 0x400 != 0 {
        bail!("Reparse locations are unsupported");
    }
    Ok(())
}

pub fn verify_installed(root: &Path) -> Result<InstalledEngine> {
    verify_installation(root)
        .map(|verified| verified.metadata)
        .map_err(anyhow::Error::new)
}

pub fn verify_installation(
    root: &Path,
) -> std::result::Result<VerifiedInstallation, VerificationIssue> {
    ensure_supported_architecture().map_err(|_| VerificationIssue::UnsupportedPlatform)?;
    let directory =
        verify_install_location(root).map_err(|_| VerificationIssue::UnsafeInstallPath)?;
    if !directory.exists() {
        return Err(VerificationIssue::NotInstalled);
    }
    let metadata = read_and_verify_install_detailed(&directory)?;
    Ok(VerifiedInstallation {
        metadata,
        directory,
    })
}

pub fn platform_supported() -> bool {
    ensure_supported_architecture().is_ok()
}

/// Explicit repair preserves the previous install until a verified replacement succeeds.
pub fn repair(root: &Path) -> Result<InstalledEngine> {
    repair_with(root, provision)
}

fn repair_with(
    root: &Path,
    provision_again: impl FnOnce(&Path) -> Result<InstalledEngine>,
) -> Result<InstalledEngine> {
    ensure_supported_architecture()?;
    let destination = verify_install_location(root)?;
    if !destination.exists() {
        return provision(root);
    }
    if let Ok(installed) = verify_installed(root) {
        return Ok(installed);
    }
    let quarantine = destination.with_file_name(format!(
        ".repair-{}",
        SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos()
    ));
    fs::rename(&destination, &quarantine)?;
    match provision_again(root) {
        Ok(installed) => {
            let _ = fs::remove_dir_all(quarantine);
            Ok(installed)
        }
        Err(error) => {
            fs::rename(&quarantine, &destination)
                .context("Could not restore previous installation")?;
            Err(error)
        }
    }
}

fn provision_staged(staging: &Path, destination: &Path) -> Result<InstalledEngine> {
    let client = reqwest::blocking::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(10))
        .timeout(std::time::Duration::from_secs(90))
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() >= MAX_REDIRECTS {
                return attempt.stop();
            }
            let url = attempt.url();
            let host = url.host_str().unwrap_or_default();
            if url.scheme() == "https"
                && (host == "github.com" || host.ends_with(".githubusercontent.com"))
            {
                attempt.follow()
            } else {
                attempt.stop()
            }
        }))
        .build()?;

    let manifest = download_bounded(&client, &format!("{RELEASE_BASE}/SHA256SUMS"), MAX_MANIFEST)?;
    let signature = download_bounded(
        &client,
        &format!("{RELEASE_BASE}/SHA256SUMS.sig"),
        MAX_SIGNATURE,
    )?;
    verify_signature(&manifest, &signature)?;
    let digest_from_manifest = parse_manifest(&manifest)?;
    if digest_from_manifest != ARCHIVE_SHA256 {
        bail!("Signed manifest digest does not match reviewed release metadata");
    }

    let archive = download_bounded(&client, &format!("{RELEASE_BASE}/{ARCHIVE}"), MAX_ARCHIVE)?;
    let actual_digest = hex::encode(Sha256::digest(&archive));
    if actual_digest != ARCHIVE_SHA256 {
        bail!("XMRig archive checksum verification failed");
    }

    extract_archive(&archive, staging)?;
    let installed = write_install_verification_metadata(staging, &actual_digest)?;
    fs::rename(staging, destination).context("Could not atomically promote verified XMRig")?;
    Ok(installed)
}

/// Persist install metadata only after the archive signature, archive digest and extraction pass.
fn write_install_verification_metadata(
    directory: &Path,
    archive_sha256: &str,
) -> Result<InstalledEngine> {
    let executable_sha256 = hash_file(&directory.join("xmrig.exe"))?;
    let installed = InstalledEngine {
        engine: "xmrig".into(),
        version: VERSION.into(),
        architecture: "windows-x64".into(),
        archive_sha256: archive_sha256.into(),
        executable_sha256,
        signing_fingerprint: SIGNING_FINGERPRINT.into(),
        upstream_source: format!("{RELEASE_BASE}/{ARCHIVE}"),
        installed_at_unix_ms: SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis(),
    };
    let metadata = serde_json::to_vec_pretty(&installed)?;
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(directory.join("ember-verification.json"))?;
    file.write_all(&metadata)?;
    file.sync_all()?;
    drop(file);
    Ok(installed)
}

fn download_bounded(client: &reqwest::blocking::Client, url: &str, max: usize) -> Result<Vec<u8>> {
    let response = client.get(url).send()?.error_for_status()?;
    let final_url = response.url();
    if final_url.scheme() != "https" {
        bail!("Upstream redirected to a non-HTTPS URL");
    }
    let host = final_url.host_str().unwrap_or_default();
    if !(host == "github.com" || host.ends_with(".githubusercontent.com")) {
        bail!("Upstream redirected outside approved GitHub hosts");
    }
    if response
        .content_length()
        .is_some_and(|length| length > max as u64)
    {
        bail!("Upstream artifact exceeded its size limit");
    }
    let mut bytes = Vec::new();
    response.take(max as u64 + 1).read_to_end(&mut bytes)?;
    if bytes.len() > max {
        bail!("Upstream artifact exceeded its size limit");
    }
    Ok(bytes)
}

fn verify_signature(manifest: &[u8], signature: &[u8]) -> Result<()> {
    verify_signature_for_fingerprint(manifest, signature, SIGNING_FINGERPRINT)
}

fn verify_signature_for_fingerprint(
    manifest: &[u8],
    signature: &[u8],
    expected_fingerprint: &str,
) -> Result<()> {
    use openpgp::{
        parse::{
            stream::{
                DetachedVerifierBuilder, GoodChecksum, MessageLayer, MessageStructure,
                VerificationHelper,
            },
            Parse,
        },
        policy::StandardPolicy,
        Cert, KeyHandle,
    };
    use sequoia_openpgp as openpgp;
    struct Helper {
        cert: Cert,
        expected_fingerprint: String,
    }
    impl VerificationHelper for Helper {
        fn get_certs(&mut self, _ids: &[KeyHandle]) -> openpgp::Result<Vec<Cert>> {
            Ok(vec![self.cert.clone()])
        }
        fn check(&mut self, structure: MessageStructure) -> openpgp::Result<()> {
            let mut matched = false;
            for layer in structure {
                let MessageLayer::SignatureGroup { results } = layer else {
                    return Err(anyhow!("Unexpected signature message structure").into());
                };
                for result in results {
                    match result {
                        Ok(GoodChecksum { ka, .. })
                            if ka
                                .cert()
                                .fingerprint()
                                .to_hex()
                                .eq_ignore_ascii_case(&self.expected_fingerprint) =>
                        {
                            matched = true
                        }
                        Ok(_) => {
                            return Err(openpgp::Error::InvalidOperation(
                                "Signature came from an unexpected key".into(),
                            )
                            .into())
                        }
                        Err(_) => {
                            return Err(openpgp::Error::InvalidOperation(
                                "Signature verification failed".into(),
                            )
                            .into())
                        }
                    }
                }
            }
            if matched {
                Ok(())
            } else {
                Err(anyhow!("No valid signature from pinned key").into())
            }
        }
    }
    let cert = Cert::from_bytes(PUBLIC_KEY.as_bytes())?;
    if cert.fingerprint().to_hex() != expected_fingerprint {
        bail!("Embedded upstream key does not match the pinned fingerprint");
    }
    let helper = Helper {
        cert,
        expected_fingerprint: expected_fingerprint.into(),
    };
    let policy = StandardPolicy::new();
    let mut verifier =
        DetachedVerifierBuilder::from_bytes(signature)?.with_policy(&policy, None, helper)?;
    verifier
        .verify_bytes(manifest)
        .context("XMRig checksum manifest signature verification failed")
}

fn parse_manifest(manifest: &[u8]) -> Result<String> {
    let text = std::str::from_utf8(manifest).context("Checksum manifest is not UTF-8")?;
    let mut found = None;
    for line in text.lines() {
        let line = line.trim_end_matches('\r');
        if line.is_empty() {
            continue;
        }
        let (digest, filename) = line
            .split_once(" *")
            .ok_or_else(|| anyhow!("Malformed checksum manifest entry"))?;
        if digest.len() != 64
            || !digest.bytes().all(|b| b.is_ascii_hexdigit())
            || filename.is_empty()
            || filename.contains(['/', '\\'])
        {
            bail!("Malformed checksum manifest entry");
        }
        if filename == ARCHIVE && found.replace(digest.to_ascii_lowercase()).is_some() {
            bail!("Checksum manifest contains duplicate archive entries");
        }
    }
    found.ok_or_else(|| anyhow!("Expected archive is missing from checksum manifest"))
}

fn extract_archive(archive: &[u8], destination: &Path) -> Result<()> {
    let mut zip = zip::ZipArchive::new(std::io::Cursor::new(archive))
        .context("Could not read upstream ZIP archive")?;
    if zip.len() == 0 || zip.len() > MAX_FILES {
        bail!("Archive file count is outside the allowed range");
    }
    let mut total = 0u64;
    let mut executable_seen = false;
    let mut paths = std::collections::HashSet::new();
    for index in 0..zip.len() {
        let mut entry = zip.by_index(index)?;
        let relative = entry
            .enclosed_name()
            .ok_or_else(|| anyhow!("Archive contains an unsafe path"))?
            .to_path_buf();
        if relative
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
        {
            bail!("Archive contains an unsafe path");
        }
        for component in relative.components() {
            let Component::Normal(name) = component else {
                unreachable!()
            };
            let name = name
                .to_str()
                .ok_or_else(|| anyhow!("Archive path was not valid UTF-8"))?;
            if name.is_empty()
                || name.contains(':')
                || name.ends_with([' ', '.'])
                || name.chars().any(char::is_control)
            {
                bail!("Archive contains a path unsafe for Windows");
            }
        }
        if entry
            .unix_mode()
            .is_some_and(|mode| mode & 0o170000 == 0o120000)
        {
            bail!("Archive contains a symbolic link");
        }
        let mut components = relative.components();
        if components.next().and_then(|c| c.as_os_str().to_str()) != Some("xmrig-6.26.0") {
            bail!("Archive layout did not match the pinned release");
        }
        let inner: PathBuf = components.collect();
        if inner.as_os_str().is_empty() {
            continue;
        }
        if !paths.insert(inner.clone()) {
            bail!("Archive contains duplicate paths");
        }
        total = total
            .checked_add(entry.size())
            .ok_or_else(|| anyhow!("Extracted size overflow"))?;
        if total > MAX_EXTRACTED {
            bail!("Archive extracted size exceeds the limit");
        }
        let output = destination.join(&inner);
        if entry.is_dir() {
            fs::create_dir_all(&output)?;
            continue;
        }
        if let Some(parent) = output.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut out = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&output)?;
        let copied = std::io::copy(&mut entry, &mut out)?;
        if copied != entry.size() {
            bail!("Archive entry size did not match its directory record");
        }
        out.sync_all()?;
        if inner == Path::new("xmrig.exe") {
            executable_seen = true;
        }
    }
    if !executable_seen {
        bail!("Expected xmrig.exe was missing from the upstream archive");
    }
    Ok(())
}

fn read_and_verify_install(directory: &Path) -> Result<InstalledEngine> {
    read_and_verify_install_detailed(directory).map_err(anyhow::Error::new)
}

fn read_and_verify_install_detailed(
    directory: &Path,
) -> std::result::Result<InstalledEngine, VerificationIssue> {
    use std::os::windows::fs::MetadataExt;
    reject_reparse(directory).map_err(|_| VerificationIssue::UnsafeInstallPath)?;
    let metadata_path = directory.join("ember-verification.json");
    let executable_path = directory.join("xmrig.exe");
    for path in [&metadata_path, &executable_path] {
        match fs::symlink_metadata(path) {
            Ok(metadata) if metadata.file_attributes() & 0x400 != 0 => {
                return Err(VerificationIssue::UnsafeInstallPath);
            }
            Ok(_) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Err(if path == &metadata_path {
                    VerificationIssue::MetadataMissing
                } else {
                    VerificationIssue::ExecutableMissing
                });
            }
            Err(_) => {
                return Err(if path == &metadata_path {
                    VerificationIssue::MetadataUnreadable
                } else {
                    VerificationIssue::ExecutableUnreadable
                })
            }
        }
    }
    let metadata =
        fs::metadata(&metadata_path).map_err(|_| VerificationIssue::MetadataUnreadable)?;
    if metadata.len() > MAX_MANIFEST as u64 {
        return Err(VerificationIssue::MetadataCorrupt);
    }
    let data = fs::read(&metadata_path).map_err(|_| VerificationIssue::MetadataUnreadable)?;
    let value: serde_json::Value =
        serde_json::from_slice(&data).map_err(|_| VerificationIssue::MetadataCorrupt)?;
    let installed: InstalledEngine =
        serde_json::from_value(value).map_err(|_| VerificationIssue::MetadataOutdated)?;
    if installed.engine != "xmrig"
        || installed.version != VERSION
        || installed.architecture != "windows-x64"
        || installed.archive_sha256 != ARCHIVE_SHA256
        || installed.signing_fingerprint != SIGNING_FINGERPRINT
        || installed.upstream_source != format!("{RELEASE_BASE}/{ARCHIVE}")
        || installed.installed_at_unix_ms == 0
        || installed.executable_sha256.len() != 64
        || !installed
            .executable_sha256
            .bytes()
            .all(|b| b.is_ascii_hexdigit())
    {
        return Err(VerificationIssue::MetadataOutdated);
    }
    let actual_digest =
        hash_file(&executable_path).map_err(|_| VerificationIssue::ExecutableUnreadable)?;
    if actual_digest != installed.executable_sha256 {
        return Err(VerificationIssue::ExecutableDigestMismatch);
    }
    Ok(installed)
}

fn hash_file(path: &Path) -> Result<String> {
    let mut file = File::open(path).context("Verified XMRig executable is missing")?;
    let mut hash = Sha256::new();
    let mut buffer = [0u8; 16 * 1024];
    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hash.update(&buffer[..count]);
    }
    Ok(hex::encode(hash.finalize()))
}

fn ensure_supported_architecture() -> Result<()> {
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    {
        use windows_sys::Win32::System::SystemInformation::{
            GetNativeSystemInfo, PROCESSOR_ARCHITECTURE_AMD64, SYSTEM_INFO,
        };
        let mut information: SYSTEM_INFO = unsafe { std::mem::zeroed() };
        unsafe {
            GetNativeSystemInfo(&mut information);
        }
        if unsafe { information.Anonymous.Anonymous.wProcessorArchitecture }
            != PROCESSOR_ARCHITECTURE_AMD64
        {
            bail!("Native system architecture is unsupported");
        }
        Ok(())
    }
    #[cfg(not(all(target_os = "windows", target_arch = "x86_64")))]
    {
        bail!("XMRig v6.26.0 provisioning currently supports Windows x64 only")
    }
}

#[cfg(test)]
pub(crate) fn install_fixture(root: &Path) {
    let directory = root.join("miners").join("xmrig").join(VERSION);
    fs::create_dir_all(&directory).unwrap();
    fs::write(
        directory.join("xmrig.exe"),
        b"non executable integrity fixture",
    )
    .unwrap();
    write_install_verification_metadata(&directory, ARCHIVE_SHA256).unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn release_metadata_is_pinned_to_windows_x64() {
        assert_eq!(VERSION, "6.26.0");
        assert_eq!(ARCHIVE, "xmrig-6.26.0-windows-x64.zip");
        assert_eq!(SIGNING_FINGERPRINT.len(), 40);
        assert_eq!(ARCHIVE_SHA256.len(), 64);
    }

    #[test]
    fn manifest_parser_requires_exact_single_expected_entry() {
        let manifest = format!("{} *{}\n", ARCHIVE_SHA256, ARCHIVE);
        assert_eq!(parse_manifest(manifest.as_bytes()).unwrap(), ARCHIVE_SHA256);
        assert!(parse_manifest(
            format!(
                "{} *{}\n{} *{}\n",
                ARCHIVE_SHA256, ARCHIVE, ARCHIVE_SHA256, ARCHIVE
            )
            .as_bytes()
        )
        .is_err());
        assert!(parse_manifest(b"not a manifest\n").is_err());
    }

    #[test]
    fn signed_official_manifest_verifies_only_for_the_pinned_key() {
        assert!(verify_signature(
            SIGNED_MANIFEST_FIXTURE.as_bytes(),
            SIGNATURE_FIXTURE.as_bytes()
        )
        .is_ok());
        assert!(verify_signature(SIGNED_MANIFEST_FIXTURE.as_bytes(), b"not a signature").is_err());
        assert!(verify_signature_for_fingerprint(
            SIGNED_MANIFEST_FIXTURE.as_bytes(),
            SIGNATURE_FIXTURE.as_bytes(),
            "0000000000000000000000000000000000000000"
        )
        .is_err());
        let altered = SIGNED_MANIFEST_FIXTURE.replace(ARCHIVE_SHA256, &"0".repeat(64));
        assert!(verify_signature(altered.as_bytes(), SIGNATURE_FIXTURE.as_bytes()).is_err());
    }

    #[test]
    fn archive_path_validation_rejects_escape_components() {
        assert!(Path::new("../xmrig.exe")
            .components()
            .any(|c| !matches!(c, Component::Normal(_))));
        assert!(Path::new("C:/xmrig.exe")
            .components()
            .any(|c| !matches!(c, Component::Normal(_))));
    }

    fn scratch_dir(label: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!(
            "ember-provisioner-{label}-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn zip_extraction_accepts_only_pinned_root_and_expected_executable() {
        let mut bytes = std::io::Cursor::new(Vec::new());
        {
            let mut writer = zip::ZipWriter::new(&mut bytes);
            writer
                .start_file(
                    "xmrig-6.26.0/xmrig.exe",
                    zip::write::SimpleFileOptions::default(),
                )
                .unwrap();
            writer.write_all(b"fixture executable bytes").unwrap();
            writer
                .start_file(
                    "xmrig-6.26.0/README.txt",
                    zip::write::SimpleFileOptions::default(),
                )
                .unwrap();
            writer.write_all(b"fixture notice").unwrap();
            writer.finish().unwrap();
        }
        let output = scratch_dir("safe-zip");
        extract_archive(bytes.get_ref(), &output).unwrap();
        assert_eq!(
            fs::read(output.join("xmrig.exe")).unwrap(),
            b"fixture executable bytes"
        );
        fs::remove_dir_all(output).unwrap();
    }

    #[test]
    fn zip_extraction_rejects_traversal_and_unexpected_layout() {
        for name in [
            "xmrig-6.26.0/../../escape.exe",
            "other-root/xmrig.exe",
            "xmrig-6.26.0/xmrig.exe:stream",
        ] {
            let mut bytes = std::io::Cursor::new(Vec::new());
            {
                let mut writer = zip::ZipWriter::new(&mut bytes);
                writer
                    .start_file(name, zip::write::SimpleFileOptions::default())
                    .unwrap();
                writer.write_all(b"bad").unwrap();
                writer.finish().unwrap();
            }
            let output = scratch_dir("unsafe-zip");
            assert!(extract_archive(bytes.get_ref(), &output).is_err());
            assert!(!output.parent().unwrap().join("escape.exe").exists());
            fs::remove_dir_all(output).unwrap();
        }
    }

    #[test]
    fn installed_executable_digest_detects_local_modification() {
        let directory = scratch_dir("tamper");
        fs::write(directory.join("xmrig.exe"), b"verified fixture").unwrap();
        let metadata = InstalledEngine {
            engine: "xmrig".into(),
            version: VERSION.into(),
            architecture: "windows-x64".into(),
            archive_sha256: ARCHIVE_SHA256.into(),
            executable_sha256: hash_file(&directory.join("xmrig.exe")).unwrap(),
            signing_fingerprint: SIGNING_FINGERPRINT.into(),
            upstream_source: format!("{RELEASE_BASE}/{ARCHIVE}"),
            installed_at_unix_ms: 1,
        };
        fs::write(
            directory.join("ember-verification.json"),
            serde_json::to_vec(&metadata).unwrap(),
        )
        .unwrap();
        assert!(read_and_verify_install(&directory).is_ok());
        fs::write(directory.join("xmrig.exe"), b"modified fixture").unwrap();
        assert!(read_and_verify_install(&directory).is_err());
        fs::remove_file(directory.join("ember-verification.json")).unwrap();
        assert!(read_and_verify_install(&directory).is_err());
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn repair_reprovision_metadata_is_accepted_by_readiness_and_fresh_pre_spawn_contract() {
        let root = scratch_dir("repair-contract");
        install_fixture(&root);
        let destination = verify_install_location(&root).unwrap();
        fs::write(destination.join("ember-verification.json"), b"{broken").unwrap();

        let repaired_metadata = repair_with(&root, |repair_root| {
            let install = verify_install_location(repair_root)?;
            fs::create_dir_all(&install)?;
            fs::write(
                install.join("xmrig.exe"),
                b"reprovisioned fixture executable",
            )?;
            write_install_verification_metadata(&install, ARCHIVE_SHA256)
        })
        .unwrap();

        let readiness_verification = verify_installation(&root).unwrap();
        assert_eq!(readiness_verification.metadata(), &repaired_metadata);
        assert_eq!(readiness_verification.metadata().engine, "xmrig");
        let fresh_pre_spawn = verify_installation(&root).unwrap();
        assert!(readiness_verification.same_installation(&fresh_pre_spawn));
        assert_eq!(
            super::super::readiness::SetupService::load(root.clone())
                .snapshot(8, true)
                .engine,
            super::super::readiness::EngineState::Ready
        );
        let artifact = fresh_pre_spawn.artifact();
        assert_eq!(artifact.engine_name(), "XMRig");
        assert!(artifact.is_verified());
        let adapter = super::super::xmrig::XmrigAdapter::new(artifact).unwrap();
        assert_eq!(adapter.version(), VERSION);
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn verifier_distinguishes_missing_corrupt_stale_and_modified_installations() {
        let root = scratch_dir("verification-failures");
        install_fixture(&root);
        let directory = verify_install_location(&root).unwrap();
        let metadata_path = directory.join("ember-verification.json");
        let valid = verify_installation(&root).unwrap().metadata().clone();

        let mut stale = valid.clone();
        stale.version = "6.25.0".into();
        fs::write(&metadata_path, serde_json::to_vec(&stale).unwrap()).unwrap();
        assert_eq!(
            verify_installation(&root).unwrap_err(),
            VerificationIssue::MetadataOutdated
        );
        assert!(VerificationIssue::MetadataOutdated
            .owner_message()
            .contains("Repair"));
        let snapshot = super::super::readiness::SetupService::load(root.clone()).snapshot(8, true);
        assert_eq!(
            snapshot.engine,
            super::super::readiness::EngineState::Modified
        );
        assert_eq!(
            snapshot.engine_issue,
            Some(VerificationIssue::MetadataOutdated.owner_message())
        );
        assert!(!snapshot.start_allowed);

        let mut old_schema = serde_json::to_value(&valid).unwrap();
        old_schema
            .as_object_mut()
            .unwrap()
            .remove("installedAtUnixMs");
        fs::write(&metadata_path, serde_json::to_vec(&old_schema).unwrap()).unwrap();
        assert_eq!(
            verify_installation(&root).unwrap_err(),
            VerificationIssue::MetadataOutdated
        );

        fs::write(&metadata_path, b"{broken").unwrap();
        assert_eq!(
            verify_installation(&root).unwrap_err(),
            VerificationIssue::MetadataCorrupt
        );
        let snapshot = super::super::readiness::SetupService::load(root.clone()).snapshot(8, true);
        assert_ne!(snapshot.engine, super::super::readiness::EngineState::Ready);
        assert_eq!(
            snapshot.engine_issue,
            Some(VerificationIssue::MetadataCorrupt.owner_message())
        );
        assert!(!snapshot.start_allowed);

        fs::write(&metadata_path, serde_json::to_vec(&valid).unwrap()).unwrap();
        fs::remove_file(&metadata_path).unwrap();
        assert_eq!(
            verify_installation(&root).unwrap_err(),
            VerificationIssue::MetadataMissing
        );
        let snapshot = super::super::readiness::SetupService::load(root.clone()).snapshot(8, true);
        assert_ne!(snapshot.engine, super::super::readiness::EngineState::Ready);
        assert_eq!(
            snapshot.engine_issue,
            Some(VerificationIssue::MetadataMissing.owner_message())
        );
        assert!(!snapshot.start_allowed);

        fs::write(&metadata_path, serde_json::to_vec(&valid).unwrap()).unwrap();
        fs::write(directory.join("xmrig.exe"), b"changed executable").unwrap();
        assert_eq!(
            verify_installation(&root).unwrap_err(),
            VerificationIssue::ExecutableDigestMismatch
        );
        let snapshot = super::super::readiness::SetupService::load(root.clone()).snapshot(8, true);
        assert_eq!(
            snapshot.engine,
            super::super::readiness::EngineState::Modified
        );
        assert_eq!(
            snapshot.engine_issue,
            Some(VerificationIssue::ExecutableDigestMismatch.owner_message())
        );
        assert!(!snapshot.start_allowed);
        fs::remove_dir_all(root).unwrap();
    }
}
