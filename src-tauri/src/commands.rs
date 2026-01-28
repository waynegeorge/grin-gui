use std::path::PathBuf;
use std::sync::{Arc, RwLock};

use grin_gui_core::config::{Config, Wallet};
use grin_gui_core::fs::PersistentData;
use grin_gui_core::node::subscriber;
use grin_gui_core::theme::Theme;
use grin_gui_core::wallet::{
	self, ChainTypes, ContractNewArgsAPI, ContractSetupArgsAPI, HTTPNodeClient, InitTxArgs,
	WalletInterfaceHttpNodeClient,
};
use serde::Serialize;
use tauri::{AppHandle, State};

use crate::types::*;
use crate::AppState;

#[derive(Serialize)]
pub struct ThemeInfo {
	pub name: String,
	pub palette: ThemePalette,
}

#[derive(Serialize)]
pub struct ThemePalette {
	pub base_bg: String,
	pub base_fg: String,
	pub normal_primary: String,
	pub normal_secondary: String,
	pub normal_surface: String,
	pub normal_error: String,
	pub bright_primary: String,
	pub bright_secondary: String,
	pub bright_surface: String,
	pub bright_error: String,
}

impl From<Theme> for ThemeInfo {
	fn from(t: Theme) -> Self {
		let p = t.palette;
		ThemeInfo {
			name: t.name,
			palette: ThemePalette {
				base_bg: p.base.background.to_hex(),
				base_fg: p.base.foreground.to_hex(),
				normal_primary: p.normal.primary.to_hex(),
				normal_secondary: p.normal.secondary.to_hex(),
				normal_surface: p.normal.surface.to_hex(),
				normal_error: p.normal.error.to_hex(),
				bright_primary: p.bright.primary.to_hex(),
				bright_secondary: p.bright.secondary.to_hex(),
				bright_surface: p.bright.surface.to_hex(),
				bright_error: p.bright.error.to_hex(),
			},
		}
	}
}

fn parse_chain_type(s: &str) -> Result<ChainTypes, String> {
	match s.to_lowercase().as_str() {
		"mainnet" => Ok(ChainTypes::Mainnet),
		"testnet" => Ok(ChainTypes::Testnet),
		_ => Err(format!("Unknown chain type: {}", s)),
	}
}

fn get_wallet_arc(state: &State<'_, AppState>) -> Result<Arc<RwLock<WalletInterfaceHttpNodeClient>>, String> {
	let wallet_lock = state.wallet.lock().map_err(|e| e.to_string())?;
	wallet_lock
		.as_ref()
		.cloned()
		.ok_or_else(|| "Wallet not open".to_string())
}

fn create_wallet_interface() -> Result<Arc<RwLock<WalletInterfaceHttpNodeClient>>, String> {
	let node_client = HTTPNodeClient::new("http://127.0.0.1:3413", None).map_err(|e| e.to_string())?;
	Ok(Arc::new(RwLock::new(WalletInterfaceHttpNodeClient::new(node_client))))
}

// ── Config Commands ──

#[tauri::command]
pub async fn config_get(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
	let config = state.config.lock().map_err(|e| e.to_string())?;
	let mut result = serde_json::to_value(&*config).map_err(|e| e.to_string())?;
	result["version"] = serde_json::json!(env!("CARGO_PKG_VERSION"));
	Ok(result)
}

#[tauri::command]
pub async fn config_save(
	state: State<'_, AppState>,
	config_json: serde_json::Value,
) -> Result<(), String> {
	let new_config: Config =
		serde_json::from_value(config_json).map_err(|e| format!("Invalid config: {}", e))?;
	new_config.save().map_err(|e| e.to_string())?;
	let mut config = state.config.lock().map_err(|e| e.to_string())?;
	*config = new_config;
	Ok(())
}

#[tauri::command]
pub async fn get_themes() -> Result<Vec<ThemeInfo>, String> {
	Ok(Theme::all()
		.into_iter()
		.map(|(_, t)| ThemeInfo::from(t))
		.collect())
}

#[tauri::command]
pub async fn get_locale(lang: String) -> Result<serde_json::Value, String> {
	let locale_path = format!("../locale/{}.json", lang);
	let content = std::fs::read_to_string(&locale_path)
		.map_err(|e| format!("Failed to load locale {}: {}", lang, e))?;
	serde_json::from_str(&content).map_err(|e| format!("Invalid locale JSON: {}", e))
}

// ── Wallet Commands ──

#[tauri::command]
pub async fn wallet_list(state: State<'_, AppState>) -> Result<Vec<WalletListEntry>, String> {
	let config = state.config.lock().map_err(|e| e.to_string())?;
	Ok(config
		.wallets
		.iter()
		.enumerate()
		.map(|(i, w)| WalletListEntry {
			index: i,
			display_name: w.display_name.clone(),
			chain_type: format!("{:?}", w.chain_type),
		})
		.collect())
}

#[tauri::command]
pub async fn wallet_init(
	state: State<'_, AppState>,
	password: String,
	display_name: String,
	chain_type: String,
	recovery_phrase: Option<String>,
) -> Result<WalletInitResponse, String> {
	let chain = parse_chain_type(&chain_type)?;
	let top_level_dir = wallet::get_grin_wallet_default_path(&chain);

	let wallet_interface = create_wallet_interface()?;

	let (_tld, mnemonic, name, chain_result) = WalletInterfaceHttpNodeClient::init(
		wallet_interface.clone(),
		password,
		top_level_dir,
		display_name.clone(),
		chain,
		recovery_phrase,
	)
	.await
	.map_err(|e| e.to_string())?;

	let wallet_entry = Wallet::new(
		Some(wallet::get_grin_wallet_default_path(&chain_result)),
		name.clone(),
		chain_result,
	);

	{
		let mut config = state.config.lock().map_err(|e| e.to_string())?;
		config.add_wallet(wallet_entry);
		config.current_wallet_index = Some(config.wallets.len() - 1);
		config.save().map_err(|e| e.to_string())?;
	}

	{
		let mut wallet_lock = state.wallet.lock().map_err(|e| e.to_string())?;
		*wallet_lock = Some(wallet_interface);
	}

	Ok(WalletInitResponse {
		mnemonic,
		display_name: name,
	})
}

#[tauri::command]
pub async fn wallet_open(
	state: State<'_, AppState>,
	wallet_index: usize,
	password: String,
) -> Result<(), String> {
	let (tld, chain_type) = {
		let config = state.config.lock().map_err(|e| e.to_string())?;
		let w = config
			.wallets
			.get(wallet_index)
			.ok_or("Wallet index out of range")?;
		let tld = w
			.tld
			.clone()
			.unwrap_or_else(|| wallet::get_grin_wallet_default_path(&w.chain_type));
		(tld, w.chain_type)
	};

	let wallet_interface = create_wallet_interface()?;

	WalletInterfaceHttpNodeClient::open_wallet(
		wallet_interface.clone(),
		password,
		tld,
		chain_type,
	)
	.await
	.map_err(|e| e.to_string())?;

	{
		let mut wallet_lock = state.wallet.lock().map_err(|e| e.to_string())?;
		*wallet_lock = Some(wallet_interface);
	}

	{
		let mut config = state.config.lock().map_err(|e| e.to_string())?;
		config.current_wallet_index = Some(wallet_index);
		config.save().map_err(|e| e.to_string())?;
	}

	Ok(())
}

#[tauri::command]
pub async fn wallet_close(state: State<'_, AppState>) -> Result<(), String> {
	let wallet_arc = {
		let mut wallet_lock = state.wallet.lock().map_err(|e| e.to_string())?;
		wallet_lock.take()
	};
	if let Some(wi) = wallet_arc {
		WalletInterfaceHttpNodeClient::close_wallet(wi)
			.await
			.map_err(|e| e.to_string())?;
	}
	Ok(())
}

#[tauri::command]
pub async fn wallet_config_exists(chain_type: String, dir: Option<String>) -> Result<bool, String> {
	let chain = parse_chain_type(&chain_type)?;
	let path = match dir {
		Some(d) => PathBuf::from(d),
		None => wallet::get_grin_wallet_default_path(&chain),
	};
	Ok(grin_gui_core::wallet::GlobalWalletConfig::new(path.to_str().unwrap_or("")).is_ok())
}

#[tauri::command]
pub async fn wallet_get_info(state: State<'_, AppState>) -> Result<WalletInfoResponse, String> {
	let wi = get_wallet_arc(&state)?;
	let (_updated, info) = WalletInterfaceHttpNodeClient::get_wallet_info(wi, true)
		.await
		.map_err(|e| e.to_string())?;
	Ok(WalletInfoResponse::from(info))
}

#[tauri::command]
pub async fn wallet_get_txs(state: State<'_, AppState>) -> Result<Vec<TxLogEntryResponse>, String> {
	let wi = get_wallet_arc(&state)?;
	let (_updated, txs) = WalletInterfaceHttpNodeClient::get_txs(wi, None)
		.await
		.map_err(|e| e.to_string())?;
	Ok(txs.iter().map(TxLogEntryResponse::from).collect())
}

#[tauri::command]
pub async fn wallet_get_address(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
	let wi = get_wallet_arc(&state)?;
	let (address_str, _addr) = WalletInterfaceHttpNodeClient::get_slatepack_address(wi)
		.await
		.map_err(|e| e.to_string())?;
	Ok(serde_json::json!({ "address": address_str }))
}

#[tauri::command]
pub async fn wallet_cancel_tx(state: State<'_, AppState>, tx_id: String) -> Result<(), String> {
	let wi = get_wallet_arc(&state)?;
	let uuid = uuid::Uuid::parse_str(&tx_id).map_err(|e| format!("Invalid UUID: {}", e))?;
	WalletInterfaceHttpNodeClient::cancel_tx(wi, uuid)
		.await
		.map_err(|e| e.to_string())?;
	Ok(())
}

#[tauri::command]
pub async fn wallet_create_tx(
	state: State<'_, AppState>,
	amount: u64,
	dest_address: String,
) -> Result<serde_json::Value, String> {
	let wi = get_wallet_arc(&state)?;
	let mut args = InitTxArgs::default();
	args.amount = amount;
	let (slate, encrypted) = WalletInterfaceHttpNodeClient::create_tx(wi, args, dest_address)
		.await
		.map_err(|e| e.to_string())?;
	Ok(serde_json::json!({
		"slate_id": slate.id.to_string(),
		"encrypted_slatepack": encrypted,
	}))
}

#[tauri::command]
pub async fn wallet_contract_new(
	state: State<'_, AppState>,
	amount: u64,
	dest_address: String,
) -> Result<serde_json::Value, String> {
	let wi = get_wallet_arc(&state)?;
	let args = ContractNewArgsAPI {
		setup_args: ContractSetupArgsAPI {
			net_change: Some(-(amount as i64)),
			..Default::default()
		},
		..Default::default()
	};
	let (slate, encrypted) =
		WalletInterfaceHttpNodeClient::contract_new(wi, args, dest_address)
			.await
			.map_err(|e| e.to_string())?;
	Ok(serde_json::json!({
		"slate_id": slate.id.to_string(),
		"encrypted_slatepack": encrypted,
	}))
}

#[tauri::command]
pub async fn wallet_apply_tx(
	state: State<'_, AppState>,
	slatepack: String,
) -> Result<serde_json::Value, String> {
	let wi = get_wallet_arc(&state)?;
	let (_sp, slate, tx) = WalletInterfaceHttpNodeClient::decrypt_slatepack(wi.clone(), slatepack)
		.map_err(|e| e.to_string())?;

	Ok(serde_json::json!({
		"slate_id": slate.id.to_string(),
		"state": format!("{:?}", slate.state),
		"amount": slate.amount,
		"has_existing_tx": tx.is_some(),
	}))
}

#[tauri::command]
pub async fn wallet_contract_sign(
	state: State<'_, AppState>,
	slatepack: String,
) -> Result<serde_json::Value, String> {
	let wi = get_wallet_arc(&state)?;

	let (_sp, slate, _tx) = WalletInterfaceHttpNodeClient::decrypt_slatepack(wi.clone(), slatepack)
		.map_err(|e| e.to_string())?;

	let args = ContractSetupArgsAPI::default();

	let (result_slate, response) =
		WalletInterfaceHttpNodeClient::contract_sign(wi, slate, args, String::new(), true)
			.await
			.map_err(|e| e.to_string())?;

	Ok(serde_json::json!({
		"slate_id": result_slate.id.to_string(),
		"state": format!("{:?}", result_slate.state),
		"response_slatepack": response,
	}))
}

#[tauri::command]
pub async fn wallet_post_tx(_state: State<'_, AppState>, _slate_id: String) -> Result<(), String> {
	// Post requires a full slate, which we'd need to retrieve from storage
	// For now this is a placeholder - full implementation needs slate retrieval
	Err("Post TX requires full slate - use contract_sign with send_to_chain_if_ready".to_string())
}

// ── Node Commands ──

#[tauri::command]
pub async fn node_get_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
	let node = state.node.lock().map_err(|e| e.to_string())?;
	Ok(serde_json::json!({
		"running": node.node_started,
		"status": if node.node_started { "running" } else { "stopped" },
	}))
}

#[tauri::command]
pub async fn node_start(
	app: AppHandle,
	state: State<'_, AppState>,
	chain_type: String,
) -> Result<(), String> {
	let chain = parse_chain_type(&chain_type)?;
	let mut node = state.node.lock().map_err(|e| e.to_string())?;

	if node.node_started {
		return Err("Node already running".to_string());
	}

	let (ui_tx, ui_rx) = subscriber::create_channel();
	node.set_ui_sender(ui_tx);
	node.start_server(chain);

	crate::node_events::spawn_node_event_listener(app, ui_rx);

	Ok(())
}

#[tauri::command]
pub async fn node_stop(state: State<'_, AppState>) -> Result<(), String> {
	let mut node = state.node.lock().map_err(|e| e.to_string())?;
	if !node.node_started {
		return Err("Node not running".to_string());
	}
	node.shutdown_server(false);
	Ok(())
}
