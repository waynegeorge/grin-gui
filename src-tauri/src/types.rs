use grin_gui_core::node::amount_to_hr_string;
use grin_gui_core::wallet::{TxLogEntry, TxLogEntryType, WalletInfo};
use serde::Serialize;

#[derive(Serialize)]
pub struct WalletInfoResponse {
	pub spendable: String,
	pub awaiting_confirmation: String,
	pub awaiting_finalization: String,
	pub locked: String,
	pub immature: String,
	pub total: String,
}

impl From<WalletInfo> for WalletInfoResponse {
	fn from(info: WalletInfo) -> Self {
		WalletInfoResponse {
			spendable: amount_to_hr_string(info.amount_currently_spendable, true),
			awaiting_confirmation: amount_to_hr_string(info.amount_awaiting_confirmation, true),
			awaiting_finalization: amount_to_hr_string(info.amount_awaiting_finalization, true),
			locked: amount_to_hr_string(info.amount_locked, true),
			immature: amount_to_hr_string(info.amount_immature, true),
			total: amount_to_hr_string(info.total, true),
		}
	}
}

#[derive(Serialize)]
pub struct TxLogEntryResponse {
	pub id: u32,
	pub tx_slate_id: Option<String>,
	pub tx_type: String,
	pub amount_credited: String,
	pub amount_debited: String,
	pub fee: String,
	pub confirmed: bool,
	pub confirmation_ts: Option<String>,
	pub creation_ts: String,
	pub num_inputs: usize,
	pub num_outputs: usize,
}

impl From<&TxLogEntry> for TxLogEntryResponse {
	fn from(tx: &TxLogEntry) -> Self {
		let fee = match tx.fee {
			Some(f) => amount_to_hr_string(f.fee(), true),
			None => "0".to_string(),
		};
		TxLogEntryResponse {
			id: tx.id,
			tx_slate_id: tx.tx_slate_id.map(|id| id.to_string()),
			tx_type: match tx.tx_type {
				TxLogEntryType::ConfirmedCoinbase => "Coinbase".to_string(),
				TxLogEntryType::TxReceived => "Received".to_string(),
				TxLogEntryType::TxSent => "Sent".to_string(),
				TxLogEntryType::TxReceivedCancelled => "Received (Cancelled)".to_string(),
				TxLogEntryType::TxSentCancelled => "Sent (Cancelled)".to_string(),
				TxLogEntryType::TxReverted => "Reverted".to_string(),
				TxLogEntryType::TxSelfSpend => "Self Spend".to_string(),
				TxLogEntryType::TxSelfSpendCancelled => "Self Spend (Cancelled)".to_string(),
			},
			amount_credited: amount_to_hr_string(tx.amount_credited, true),
			amount_debited: amount_to_hr_string(tx.amount_debited, true),
			fee,
			confirmed: tx.confirmed,
			confirmation_ts: tx.confirmation_ts.map(|ts| ts.to_string()),
			creation_ts: tx.creation_ts.to_string(),
			num_inputs: tx.num_inputs,
			num_outputs: tx.num_outputs,
		}
	}
}

#[derive(Serialize)]
pub struct WalletListEntry {
	pub index: usize,
	pub display_name: String,
	pub chain_type: String,
}

#[derive(Serialize)]
pub struct WalletInitResponse {
	pub mnemonic: String,
	pub display_name: String,
}
