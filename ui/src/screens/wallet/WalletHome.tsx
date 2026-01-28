import { createSignal, onMount, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import TxTable from "../../components/TxTable.tsx";

interface WalletInfo {
	spendable: string;
	awaiting_confirmation: string;
	awaiting_finalization: string;
	locked: string;
	immature: string;
	total: string;
}

interface Props {
	onSend: () => void;
	onReceive: () => void;
	onClose: () => void;
}

export default function WalletHome(props: Props) {
	const [info, setInfo] = createSignal<WalletInfo | null>(null);
	const [address, setAddress] = createSignal("");
	const [error, setError] = createSignal("");
	const [copied, setCopied] = createSignal(false);

	onMount(async () => {
		try {
			const [walletInfo, addrResult] = await Promise.all([
				invoke<WalletInfo>("wallet_get_info"),
				invoke<{ address: string }>("wallet_get_address"),
			]);
			setInfo(walletInfo);
			setAddress(addrResult.address);
		} catch (e: any) {
			setError(typeof e === "string" ? e : e.message || "Failed to load wallet info");
		}
	});

	function copyAddress() {
		navigator.clipboard.writeText(address());
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	const cardStyle = {
		"background-color": "var(--base-fg)",
		border: "1px solid var(--normal-primary)",
	};

	return (
		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold" style={{ color: "var(--bright-primary)" }}>
					Wallet
				</h2>
				<button
					class="text-xs px-3 py-1 rounded"
					style={{ color: "var(--normal-surface)", border: "1px solid var(--normal-surface)" }}
					onClick={props.onClose}
				>
					Lock
				</button>
			</div>

			{error() && (
				<div class="rounded p-3 mb-4" style={{ ...cardStyle, "border-color": "var(--normal-error)" }}>
					<p class="text-sm" style={{ color: "var(--bright-error)" }}>{error()}</p>
				</div>
			)}

			<Show when={info()}>
				{(i) => (
					<>
						<div class="rounded-lg p-4 mb-4" style={cardStyle}>
							<div class="text-xs mb-1" style={{ color: "var(--normal-surface)" }}>Spendable</div>
							<div class="text-2xl font-bold mb-3" style={{ color: "var(--bright-secondary)" }}>
								{i().spendable} <span class="text-sm font-normal">grin</span>
							</div>
							<div class="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--normal-surface)" }}>
								<div>Awaiting Confirmation: <span style={{ color: "var(--bright-surface)" }}>{i().awaiting_confirmation}</span></div>
								<div>Awaiting Finalization: <span style={{ color: "var(--bright-surface)" }}>{i().awaiting_finalization}</span></div>
								<div>Locked: <span style={{ color: "var(--bright-surface)" }}>{i().locked}</span></div>
								<div>Immature: <span style={{ color: "var(--bright-surface)" }}>{i().immature}</span></div>
							</div>
						</div>

						<div class="rounded-lg p-3 mb-4 flex items-center gap-2" style={cardStyle}>
							<span class="text-xs" style={{ color: "var(--normal-surface)" }}>Address:</span>
							<span
								class="text-xs font-mono flex-1 truncate"
								style={{ color: "var(--bright-surface)" }}
							>
								{address()}
							</span>
							<button
								class="text-xs px-2 py-1 rounded"
								style={{ color: "var(--normal-surface)", border: "1px solid var(--normal-surface)" }}
								onClick={copyAddress}
							>
								{copied() ? "Copied!" : "Copy"}
							</button>
						</div>

						<div class="flex gap-2 mb-6">
							<button
								class="px-4 py-2 rounded text-sm font-medium transition-colors"
								style={{
									"background-color": "var(--normal-primary)",
									color: "var(--bright-primary)",
									border: "1px solid var(--bright-primary)",
								}}
								onClick={props.onSend}
							>
								Send
							</button>
							<button
								class="px-4 py-2 rounded text-sm font-medium transition-colors"
								style={{
									color: "var(--bright-surface)",
									border: "1px solid var(--normal-surface)",
								}}
								onClick={props.onReceive}
							>
								Receive
							</button>
						</div>
					</>
				)}
			</Show>

			<TxTable />
		</div>
	);
}
