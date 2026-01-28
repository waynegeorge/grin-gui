use tokio::sync::mpsc;

pub use grin_servers::ServerStats;

#[derive(Clone, Debug)]
pub enum UIMessage {
	None,
	UpdateStatus(ServerStats),
}

pub fn create_channel() -> (mpsc::Sender<UIMessage>, mpsc::Receiver<UIMessage>) {
	mpsc::channel(32)
}
