# Tauri + SolidJS Port Status

This document tracks the migration of Grin GUI from the iced-rs Rust GUI framework to a Tauri v2 + SolidJS desktop application.

## Completed Phases

### Phase 0 — Project Scaffolding
- Created `src-tauri/` with Tauri v2 configuration, `Cargo.toml`, `main.rs`, `lib.rs`, `build.rs`
- Created `ui/` with SolidJS + Vite + Tailwind CSS v4 project
- Configured `tauri.conf.json` (window size, tray icon, dev/build commands)
- Set up single-instance enforcement via `tauri-plugin-single-instance`
- Set up shell integration via `tauri-plugin-shell`
- Added `rust-toolchain.toml`

### Phase 1 — Basic Screens & Theme System
- Built initial four-screen layout: Wallet, Node, Settings, About
- Implemented sidebar navigation (`ui/src/components/Sidebar.tsx`)
- Ported theme system: `get_themes` command returns all built-in themes as CSS-variable-compatible palettes
- Settings screen applies themes dynamically via CSS custom properties
- Locale loading command (`get_locale`) reads JSON translation files
- Config stub commands for version display

### Phase 2 — Full Screen Port with Real Backend Commands

#### Step 1: AppState & Config Commands
- **`src-tauri/src/lib.rs`** — `AppState` struct with:
  - `Mutex<Config>` — application config loaded from disk at startup
  - `Mutex<Option<Arc<RwLock<WalletInterfaceHttpNodeClient>>>>` — active wallet instance
  - `Mutex<NodeInterface>` — embedded node interface
- **`config_get`** — returns full serialized config + version
- **`config_save`** — accepts config JSON, persists to disk, updates in-memory state

#### Step 2: Wallet Setup Flow
**Rust commands:**
- `wallet_list` — returns configured wallets with display name, chain type, index
- `wallet_init` — creates a new wallet (calls `core::wallet::init()`), saves to config, returns mnemonic
- `wallet_open` — opens existing wallet by index with password (calls `core::wallet::open_wallet()`)
- `wallet_close` — closes active wallet
- `wallet_config_exists` — checks if wallet config exists at path

**SolidJS screens:**
- `WalletSetupInit.tsx` — welcome screen with Create / Select Existing buttons
- `WalletCreate.tsx` — password fields, chain type picker, advanced options (display name, recovery phrase restore)
- `WalletCreateSuccess.tsx` — displays mnemonic with copy button, confirmation
- `WalletList.tsx` — lists configured wallets, click to select
- `WalletOpen.tsx` — password input to unlock selected wallet

#### Step 3: Wallet Home & Transactions
**Rust commands & types (`src-tauri/src/types.rs`):**
- `wallet_get_info` — returns balance breakdown (spendable, locked, immature, awaiting confirmation/finalization, total) as human-readable strings
- `wallet_get_txs` — returns full transaction list as `Vec<TxLogEntryResponse>` with id, type, amounts, fee, status, timestamps
- `wallet_get_address` — returns slatepack address
- `wallet_cancel_tx` — cancels a pending transaction by UUID

**SolidJS screens & components:**
- `WalletHome.tsx` — balance card, slatepack address with copy, Send/Receive buttons, Lock button
- `TxTable.tsx` — transaction table with columns: ID, Type, Amount (color-coded send/receive), Fee, Status badge, Date. Click row to expand detail.
- `TxDetail.tsx` — expanded view showing all transaction fields, cancel button for unconfirmed transactions

#### Step 4: Create/Apply Transactions & Contracts
**Rust commands:**
- `wallet_create_tx` — legacy send: init_send_tx + lock_outputs + encrypt slatepack
- `wallet_contract_new` — contracts send: contract_new + encrypt slatepack
- `wallet_apply_tx` — decrypt incoming slatepack, return parsed slate info
- `wallet_contract_sign` — sign a contract slate, post if ready
- `wallet_post_tx` — placeholder (requires full slate retrieval)

**SolidJS screens:**
- `CreateTx.tsx` — amount + recipient address form, supports both Legacy and Contracts mode
- `ApplyTx.tsx` — paste slatepack, parse & display details, confirm/reject
- `ShowSlatepack.tsx` — display encrypted slatepack with copy button
- `TxDone.tsx` — success confirmation with slate ID

#### Step 5: Node Status with Live Events
**Rust side:**
- `node_start` — starts embedded grin node, spawns background event listener
- `node_stop` — shuts down node
- `node_get_status` — returns running/stopped state
- **`src-tauri/src/node_events.rs`** — background tokio task that reads `UIMessage::UpdateStatus(ServerStats)` from the node's channel and emits Tauri events

**Sync status formatting** covers all grin sync phases:
Initial → AwaitingPeers → HeaderSync → TxHashsetDownload → TxHashsetSetup → RangeProofsValidation → KernelsValidation → TxHashsetSave → TxHashsetDone → BodySync → NoSync (Running)

**SolidJS screen:**
- `NodeStatus.tsx` — listens to `"node-status-update"` Tauri events, displays sync progress bar, block height, peer count, difficulty, chain type selector, start/stop button

#### Step 6: Settings Screen
- Tabbed layout: General | Wallet | Node
- **General tab:** theme picker (persisted to config), language selector
- **Wallet tab:** transaction method toggle (Legacy / Contracts), persisted to config
- **Node tab:** placeholder for future config
- All changes auto-save via `config_save` command

#### Step 7: About Screen
- Version display
- Links to grin.mw, GitHub, Forum (opened via shell plugin)
- Donate section linking to community fund

**App routing (`App.tsx`):**
- Top-level: wallet | node | settings | about
- Wallet sub-routing state machine with 10 states: init → create → success → list → open → home → send → receive → slatepack → done

## File Inventory

### New files created
```
src-tauri/src/types.rs
src-tauri/src/node_events.rs
ui/src/screens/wallet/WalletSetupInit.tsx
ui/src/screens/wallet/WalletCreate.tsx
ui/src/screens/wallet/WalletCreateSuccess.tsx
ui/src/screens/wallet/WalletList.tsx
ui/src/screens/wallet/WalletOpen.tsx
ui/src/screens/wallet/WalletHome.tsx
ui/src/screens/wallet/CreateTx.tsx
ui/src/screens/wallet/ApplyTx.tsx
ui/src/screens/wallet/ShowSlatepack.tsx
ui/src/screens/wallet/TxDone.tsx
ui/src/components/TxTable.tsx
ui/src/components/TxDetail.tsx
```

### Modified files
```
src-tauri/Cargo.toml          — added uuid dependency
src-tauri/src/lib.rs           — AppState, setup, command registration
src-tauri/src/commands.rs      — 20 real commands replacing stubs
ui/src/App.tsx                 — wallet sub-routing
ui/src/screens/NodeStatus.tsx  — full rewrite with live events
ui/src/screens/Settings.tsx    — tabbed layout with persistence
ui/src/screens/About.tsx       — links, donate section
```

### Deleted files
```
ui/src/screens/WalletHome.tsx  — replaced by ui/src/screens/wallet/WalletHome.tsx
```

## Known Limitations / Future Work
- `wallet_post_tx` is a placeholder — posting requires retrieving the full slate from storage
- Node events listener (`ui_rx`) is created per `node_start` call; if the node is restarted, the old listener's channel closes naturally
- No localization wired into the UI yet (locale files load but aren't applied to components)
- No wallet backup/restore UI
- No payment proof verification UI
- Contract revoke not yet exposed as a command
- Node settings tab is a placeholder
- No error boundaries in the frontend
