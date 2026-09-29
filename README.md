# Ember

Ember is an active reboot of Tray-XMR into a beginner-friendly, transparent desktop application for Monero mining. It is **Windows-first** and currently establishing its desktop design foundation; no production release or mining functionality exists.

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

- [Product direction](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security and trust model](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
- [Decision log](docs/DECISIONS.md)
- [Legacy implementation notes](docs/LEGACY.md)
