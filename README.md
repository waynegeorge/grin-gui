# Grin GUI

An integrated desktop GUI for both Grin Wallet and Grin Node, built with [Tauri v2](https://tauri.app/) and [SolidJS](https://www.solidjs.com/).

## Goals

The Grin team has spent countless hours making Grin's infrastructure extremely flexible, with multiple ways of running nodes and wallets and extensive developer APIs and documentation for both.

This project aims to pull all of this work together to create a lightweight, flexible and user-friendly method of using Grin. This includes:

  * Presenting a completely working Single UI for both Grin Node and Grin Wallet.
  * Allowing all wallet transaction operations to be performed in a user-friendly and intuitive manner
  * Create and manage a Grin node in-application if desired, while also retaining the options to communicate with other configured or public nodes.
  * The ability to create, configure and manage multiple wallets and nodes including existing installations

## Architecture

The application is split into three layers:

- **Core library** (`crates/core/`) — Rust business logic wrapping the upstream `grin` and `grin-wallet` crates. Handles wallet operations, node management, config, and theming.
- **Tauri backend** (`src-tauri/`) — Thin Rust layer exposing core functionality as IPC commands. Manages application state (`Config`, `WalletInterface`, `NodeInterface`) and emits node status events.
- **SolidJS frontend** (`ui/`) — Reactive UI built with SolidJS, Vite, and Tailwind CSS v4. Communicates with the backend exclusively through Tauri's `invoke()` and event listener APIs.

## Status

**Work in progress.** The application builds and runs. The UI is functional with real backend integration for wallet and node operations.

### What works
- Wallet creation and restoration from recovery phrase
- Multiple wallet management (create, list, select, open/close)
- Wallet balance display and slatepack address
- Transaction list with detail view
- Send and receive flows (Legacy and Contracts modes) with slatepack exchange
- Embedded Grin node with live sync status (progress bar, block height, peers, difficulty)
- Theme system with multiple built-in themes, persisted to config
- Settings persistence (theme, language, transaction method)
- Single-instance enforcement and system tray (Windows)

### What's next
- Localization (translation files exist but aren't wired into UI components yet)
- Payment proof verification UI
- Contract revoke command
- Node configuration options
- Wallet backup/restore UI
- Error boundaries in the frontend
- Cross-platform testing (Linux, macOS)

## Building

### Prerequisites
- Rust >= 1.59 (recommend latest via `rustup update`)
- Node.js >= 18
- Windows: `llvm` must be installed
- Linux:
  ```bash
  sudo apt install build-essential cmake git libgit2-dev clang libncurses5-dev libncursesw5-dev zlib1g-dev pkg-config libssl-dev llvm libfontconfig libfontconfig1-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev
  ```

### Build & Run

```bash
# Install frontend dependencies
cd ui && npm install && cd ..

# Development (debug build)
cargo run -p grin-gui

# Release build
cargo build -p grin-gui --release

# Build frontend separately
cd ui && npm run build
```

### Testing

```bash
cargo test --release --all
```

## Project Structure

```
grin-gui/
├── crates/core/          # grin-gui-core: wallet, node, config, theme
│   └── src/
│       ├── wallet/       # Wallet interface (grin-wallet APIs)
│       ├── node/         # Node interface + event subscriber
│       ├── config/       # Config structs, persistence
│       └── theme/        # Theme definitions
├── src-tauri/            # Tauri v2 backend
│   └── src/
│       ├── lib.rs        # AppState, setup, command registration
│       ├── commands.rs   # 20 IPC command handlers
│       ├── types.rs      # Serializable response types
│       └── node_events.rs # Node status event emitter
├── ui/                   # SolidJS frontend
│   └── src/
│       ├── App.tsx       # Router with wallet sub-routing
│       ├── components/   # Sidebar, TxTable, TxDetail
│       └── screens/      # About, NodeStatus, Settings, wallet/*
└── locale/               # i18n translation files (en, de)
```

## Contributing

Contributions are welcome. This is an excellent project for anyone wanting to get involved with Grin development. The frontend uses SolidJS (similar to React but with fine-grained reactivity) and the backend is standard Rust with Tauri IPC.

See [Grin project contribution guidelines](https://github.com/mimblewimble/grin/blob/master/CONTRIBUTING.md) for general guidance.

In contrast to most Grin development, Grin GUI is primarily developed on Windows, with Windows being the first-class citizen. macOS and Linux are also supported.

## Acknowledgement

- [Tauri](https://tauri.app/) for the desktop application framework
- [SolidJS](https://www.solidjs.com/) for the reactive UI library
- [ajour](https://github.com/ajour/ajour) for the original project structure inspiration

## License

GPL 3.0 (for the time being)

Note this differs from the rest of the Grin codebase (which uses Apache 2) due to [ajour](https://github.com/ajour/ajour)'s licensing. Currently attempting to get copyright holder's permission to change this to Apache 2.
