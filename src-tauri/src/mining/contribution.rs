//! Transparent Ember developer-fee schedule, separate from XMRig's donation.
use std::time::Duration;

pub const DEVELOPER_WALLET: &str =
    "46cWExuig3c1th8mqaZXwfP3HMuZkwgY5QmEmaBmQK3KC2xJfR1LoEucArZPoDnc1c4EtvQrK6LJN7cLA2KWn8j8N7Kuq2t";
pub const USER_SLOT: Duration = Duration::from_secs(19 * 60);
pub const DEVELOPER_SLOT: Duration = Duration::from_secs(60);
