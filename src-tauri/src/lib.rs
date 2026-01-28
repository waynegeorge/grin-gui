mod commands;
mod node_events;
mod types;

use grin_gui_core::config::Config;
use grin_gui_core::fs::PersistentData;
use grin_gui_core::node::NodeInterface;
use grin_gui_core::wallet::WalletInterfaceHttpNodeClient;
use std::sync::{Arc, Mutex, RwLock};
use tauri::Manager;

pub struct AppState {
	pub config: Mutex<Config>,
	pub wallet: Mutex<Option<Arc<RwLock<WalletInterfaceHttpNodeClient>>>>,
	pub node: Mutex<NodeInterface>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
			if let Some(window) = app.get_webview_window("main") {
				let _ = window.set_focus();
			}
		}))
		.plugin(tauri_plugin_shell::init())
		.invoke_handler(tauri::generate_handler![
			commands::config_get,
			commands::config_save,
			commands::get_themes,
			commands::get_locale,
			commands::node_get_status,
			commands::node_start,
			commands::node_stop,
			commands::wallet_list,
			commands::wallet_init,
			commands::wallet_open,
			commands::wallet_close,
			commands::wallet_config_exists,
			commands::wallet_get_info,
			commands::wallet_get_txs,
			commands::wallet_get_address,
			commands::wallet_cancel_tx,
			commands::wallet_create_tx,
			commands::wallet_contract_new,
			commands::wallet_apply_tx,
			commands::wallet_contract_sign,
			commands::wallet_post_tx,
		])
		.setup(|app| {
			log::info!("Grin GUI starting up");

			let config = Config::load_or_default::<Config>().unwrap_or_default();

			let node = NodeInterface::new();

			app.manage(AppState {
				config: Mutex::new(config),
				wallet: Mutex::new(None),
				node: Mutex::new(node),
			});

			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
