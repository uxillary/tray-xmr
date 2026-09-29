# Tray-XMR Legacy Notes

**Source:** Repository evidence reviewed for M00A; summarized 2026-09-29. These prototypes are historical context, not Ember implementation requirements.

## Historical versions

- **Initial scripts** — `legacy/initial-scripts/xmr_balance_check.py` prints a SupportXMR balance and payout-threshold progress; `xmr_balance_check_gui.py` presents similar output in a one-shot Tk message box. Both hard-code a wallet address.
- **v1** — `legacy/v1/xmr_tray.py` periodically fetches SupportXMR stats, places balance/progress in a `pystray` tooltip, and sends a one-time payout-threshold notification. It uses a generated icon and fixed wallet address.
- **v1.1-temp** — `legacy/v1.1-temp/xmr_tray.py` adds CPU usage to the tooltip and loads a packaged icon resource. It retains periodic pool-stat polling and notification behavior.
- **v2** — `legacy/v2/xmr_tray.py` prompts for an address/pool when config is absent, stores config next to the script, and has URL templates for SupportXMR and MoneroOcean. It displays balance and payout progress in the tray and sends a threshold notification. `legacy/v2/setup.bat` separately writes the config and launches an executable; it does not provide XMRig mining control.
- **v3-gui** — `legacy/v3-gui/working/mine_gui.py` is an early CustomTkinter start/stop wrapper around an externally installed XMRig executable at a fixed Windows path. `legacy/v3-gui/mine_gui.py` adds an editable/saved executable path, status, hashrate/share labels, and output parsing. It attempts to relaunch elevated. The repository contains no XMRig executable; the GUI source starts an external miner process and does not combine the earlier tray/pool-balance functionality.

## Useful concepts

Convenient tray status, pool/mining information, understandable payout progress, notifications, visible wallet/pool configuration, explicit start/stop controls, and hashrate/share information are product concepts worth considering. See [Product](PRODUCT.md) for intended future direction.

## Known shortcomings

The old code hard-codes a wallet in several files, embeds provider URLs, stores config beside scripts, and lacks dependency manifests. Tray versions use simple polling and response assumptions. The miner GUI uses unconditional elevation, starts an external binary with minimal lifecycle management, scrapes console output, updates Tk widgets from a reader thread, and has limited handling for unexpected exits and process trees. The prototypes do not implement resource limits, Smart Mining, robust telemetry, secure binary acquisition, modern local history, or the broader Ember product.

Historical scripts, selected meaningful assets, configs, launcher/spec files, and the old tests are kept under `legacy/`. Generated PyInstaller build/dist trees, compiled executables, and exact duplicate asset copies were removed from the working tree; Git history retains removed tracked files.

## Why Ember is a rewrite

The historical versions are separate experiments rather than a unified application. They establish a few useful user-facing ideas but do not provide a sound architecture for Ember’s consent, process safety, local-first storage, contribution transparency, extensibility, or Windows lifecycle needs. Ember should retain product concepts and replace the implementations with a deliberately designed Tauri/Rust/React application. Do not infer unimplemented capabilities from the legacy code.

See [Architecture](ARCHITECTURE.md), [Security](SECURITY.md), and [Roadmap](ROADMAP.md).
