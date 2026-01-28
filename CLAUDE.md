# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grin GUI is a desktop application providing an integrated graphical interface for both Grin Wallet and Grin Node. Built using Rust and the iced-rs GUI framework, it aims to make Grin cryptocurrency accessible through a user-friendly interface.

**Current Status**: Work in progress. Windows is the primary development platform, with macOS and Linux also supported.

## Build Commands

### Prerequisites
- Rust >= 1.59 (recommend latest version via `rustup update`)
- Windows: `llvm` required
- Linux: Install dependencies:
  ```bash
  sudo apt install build-essential cmake git libgit2-dev clang libncurses5-dev libncursesw5-dev zlib1g-dev pkg-config libssl-dev llvm libfontconfig libfontconfig1-dev
  ```

### Building
```bash
# Build release version
cargo build --release

# Build debug version
cargo build

# Build with specific features
cargo build --release --features wgpu
cargo build --release --features no-self-update
```

### Testing
```bash
# Run all tests
cargo test --release --all

# Test specific workspace member
cargo test --release -p grin-gui-core
```

### Running
```bash
# Run debug build
cargo run

# Run release build
cargo run --release
```

## Project Architecture

### Workspace Structure

This is a Cargo workspace with two main crates:
- **Root crate (`grin-gui`)**: Main application binary - handles GUI presentation, user interaction, and application lifecycle
- **Core crate (`crates/core`)**: Business logic library (`grin-gui-core`) - integrates with Grin node and wallet APIs

### Key Components

**Main Application (`src/`)**:
- `main.rs`: Entry point, logging setup, single-instance enforcement (Windows), system tray integration
- `gui/`: Iced application implementation
  - `mod.rs`: Main `GrinGui` struct implementing `iced::Application` trait
  - `update.rs`: Message handling and state updates
  - `element/`: UI component definitions (menu, wallet, node, settings, about)
- `localization.rs`: i18n support using json-gettext (see `locale/` directory)
- `tray/`: Windows system tray integration
- `process.rs`: Windows-specific process management

**Core Library (`crates/core/src/`)**:
- `wallet/`: Wallet interface wrapping `grin-wallet` APIs
- `node/`: Node interface wrapping `grin` node APIs and subscription system
- `config/`: Application configuration management
- `theme/`: UI theming system built on iced
- `fs/`: File system utilities and persistent data handling
- `logger.rs`: Logging configuration (separate for GUI, wallet, and node)
- `network.rs`: Network-related utilities

### Message Flow

The application uses Elm-style architecture:
1. User interactions generate `Interaction` messages
2. `Message::Interaction` wraps these and flows to `update::handle_message()`
3. Updates modify application state and return `Command`s for async operations
4. Node events flow through `subscriber::subscriber()` as `Message::SendNodeMessage`

### State Management

Application state is split across multiple `StateContainer` structs:
- `menu_state`: Top menu navigation
- `wallet_state`: Wallet setup and operations UI state
- `node_state`: Node management UI state
- `settings_state`: Settings screens (wallet, node, general)
- `about_state`: About screen

### Grin Integration

The core library depends on upstream Grin repositories:
- Node libraries: `grin_config`, `grin_core`, `grin_util`, `grin_servers`, `grin_keychain`, `grin_chain`
  - Currently using master branch from github.com/mimblewimble/grin
- Wallet libraries: `grin_wallet`, `grin_wallet_config`, `grin_wallet_util`, `grin_wallet_controller`, `grin_wallet_api`, `grin_wallet_impls`, `grin_wallet_libwallet`
  - Currently using contracts branch from github.com/mimblewimble/grin-wallet

**For local testing**: Uncomment local path dependencies in `crates/core/Cargo.toml`

### Theme System

Themes are defined in `crates/core/src/theme/` and stored in user config. Built-in themes can be extended. The UI uses custom styled widgets (Button, Container, Text, etc.) from the theme module.

### Localization

Translation files in `locale/` directory (JSON format). Currently supports English (en.json) and German (de.json). Use `localized_string()` function for translatable text.

## Windows-Specific Features

- System tray integration with show/hide functionality
- Single instance enforcement (`process::avoid_multiple_instances()`)
- Close-to-tray and start-closed-to-tray options
- MSI installer built with cargo-wix

## CI/CD

- **CI** (`.github/workflows/ci.yaml`): Runs `cargo test --release` on Linux, macOS, and Windows
- **CD** (`.github/workflows/cd.yaml`): On version tags, builds release binaries for all platforms and creates GitHub releases
  - Windows: Produces .zip and .msi installer
  - Linux/macOS: Produces .tar.gz archives
  - All include SHA256 checksums
