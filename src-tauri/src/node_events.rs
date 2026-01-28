use grin_gui_core::node::subscriber::UIMessage;
use grin_gui_core::node::{ServerStats, SyncStatus};
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc as tokio_mpsc;

#[derive(Serialize, Clone)]
pub struct NodeStatusEvent {
	pub sync_status: String,
	pub sync_progress: f64,
	pub block_height: u64,
	pub peer_count: u32,
	pub difficulty: u64,
}

fn format_sync_status(stats: &ServerStats) -> (String, f64) {
	match &stats.sync_status {
		SyncStatus::Initial => ("Initializing...".to_string(), 0.0),
		SyncStatus::NoSync => ("Running".to_string(), 1.0),
		SyncStatus::AwaitingPeers(_) => ("Awaiting Peers...".to_string(), 0.0),
		SyncStatus::HeaderSync {
			sync_head,
			highest_height,
			..
		} => {
			let progress = if *highest_height > 0 {
				sync_head.height as f64 / *highest_height as f64
			} else {
				0.0
			};
			(
				format!("Syncing Headers ({}/{})", sync_head.height, highest_height),
				progress * 0.25,
			)
		}
		SyncStatus::TxHashsetDownload(stat) => {
			let progress = if stat.total_size > 0 {
				stat.downloaded_size as f64 / stat.total_size as f64
			} else {
				0.0
			};
			("Downloading State...".to_string(), 0.25 + progress * 0.25)
		}
		SyncStatus::TxHashsetSetup { .. } => ("Setting Up State...".to_string(), 0.5),
		SyncStatus::TxHashsetRangeProofsValidation {
			rproofs,
			rproofs_total,
		} => {
			let progress = if *rproofs_total > 0 {
				*rproofs as f64 / *rproofs_total as f64
			} else {
				0.0
			};
			(
				format!("Validating Range Proofs ({}/{})", rproofs, rproofs_total),
				0.5 + progress * 0.15,
			)
		}
		SyncStatus::TxHashsetKernelsValidation {
			kernels,
			kernels_total,
		} => {
			let progress = if *kernels_total > 0 {
				*kernels as f64 / *kernels_total as f64
			} else {
				0.0
			};
			(
				format!("Validating Kernels ({}/{})", kernels, kernels_total),
				0.65 + progress * 0.15,
			)
		}
		SyncStatus::TxHashsetSave => ("Saving State...".to_string(), 0.8),
		SyncStatus::TxHashsetDone => ("State Sync Complete".to_string(), 0.85),
		SyncStatus::BodySync {
			current_height,
			highest_height,
		} => {
			let progress = if *highest_height > 0 {
				*current_height as f64 / *highest_height as f64
			} else {
				0.0
			};
			(
				format!("Syncing Blocks ({}/{})", current_height, highest_height),
				0.85 + progress * 0.15,
			)
		}
		SyncStatus::TxHashsetPibd { .. } => ("PIBD Sync...".to_string(), 0.5),
		SyncStatus::Shutdown => ("Shutting Down...".to_string(), 0.0),
	}
}

pub fn spawn_node_event_listener(app: AppHandle, mut rx: tokio_mpsc::Receiver<UIMessage>) {
	tokio::spawn(async move {
		while let Some(msg) = rx.recv().await {
			match msg {
				UIMessage::UpdateStatus(stats) => {
					let (status_text, progress) = format_sync_status(&stats);
					let event = NodeStatusEvent {
						sync_status: status_text,
						sync_progress: progress,
						block_height: stats.chain_stats.height,
						peer_count: stats.peer_count,
						difficulty: stats.chain_stats.total_difficulty.to_num(),
					};
					let _ = app.emit("node-status-update", event);
				}
				UIMessage::None => {}
			}
		}
	});
}
