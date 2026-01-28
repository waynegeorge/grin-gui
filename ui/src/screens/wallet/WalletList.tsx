import { createSignal, onMount, For } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface WalletEntry {
	index: number;
	display_name: string;
	chain_type: string;
}

interface Props {
	onSelect: (index: number) => void;
	onCreateNew: () => void;
}

export default function WalletList(props: Props) {
	const [wallets, setWallets] = createSignal<WalletEntry[]>([]);

	onMount(async () => {
		try {
			const list = await invoke<WalletEntry[]>("wallet_list");
			setWallets(list);
		} catch (e) {
			console.error("Failed to list wallets:", e);
		}
	});

	return (
		<div class="max-w-md mx-auto">
			<h2 class="text-xl font-semibold mb-4" style={{ color: "var(--bright-primary)" }}>
				Select Wallet
			</h2>
			<div class="space-y-2 mb-4">
				<For each={wallets()}>
					{(w) => (
						<button
							class="w-full text-left px-4 py-3 rounded transition-colors flex justify-between items-center"
							style={{
								"background-color": "var(--base-fg)",
								color: "var(--bright-surface)",
								border: "1px solid var(--normal-primary)",
							}}
							onClick={() => props.onSelect(w.index)}
						>
							<span class="font-medium">{w.display_name}</span>
							<span class="text-xs" style={{ color: "var(--normal-surface)" }}>
								{w.chain_type}
							</span>
						</button>
					)}
				</For>
			</div>
			<button
				class="text-sm underline"
				style={{ color: "var(--normal-surface)" }}
				onClick={props.onCreateNew}
			>
				+ Create New Wallet
			</button>
		</div>
	);
}
