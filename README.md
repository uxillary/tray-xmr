# Ember

Ember is a Windows-first, local-first desktop product for putting idle power to work through transparent Monero mining. Its M03 foundation verifies and provisions XMRig, owns its process lifecycle, and supports a controlled native mining session. Native owner-machine acceptance of authenticated API telemetry and real mining has subsequently passed; licensing, distribution, security-product and other release hardening remain open. See the [roadmap](docs/ROADMAP.md) for current scope and planned direction.

The application uses Tauri 2, Rust, React, TypeScript, and Vite. Historical Python prototypes are preserved separately in [`legacy/`](legacy/).

## Development

Prerequisites: Node.js 20.x or 22+, Rust stable with the MSVC Windows target, Microsoft C++ Build Tools, and the WebView2 runtime. See the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/#windows) for platform setup.

```powershell
npm install
npm run tauri dev
```

Create a production build with:

```powershell
npm run tauri build
```

`npm run build` checks TypeScript and builds the frontend only.

## Documentation

Current foundations are described separately from future product direction; planned telemetry, Ember Stream, Smart Mining, economics, progression and public beta features are not all available today.

- [Product direction](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security and trust model](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
- [Decision log](docs/DECISIONS.md)
- [Legacy implementation notes](docs/LEGACY.md)
