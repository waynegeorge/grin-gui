import { createSignal, onMount, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import TxDetail from "./TxDetail.tsx";

export interface TxEntry {
	id: number;
	tx_slate_id: string | null;
	tx_type: string;
	amount_credited: string;
	amount_debited: string;
	fee: string;
	confirmed: boolean;
	confirmation_ts: string | null;
	creation_ts: string;
	num_inputs: number;
	num_outputs: number;
}

export default function TxTable() {
	const [txs, setTxs] = createSignal<TxEntry[]>([]);
	const [selected, setSelected] = createSignal<TxEntry | null>(null);
	const [error, setError] = createSignal("");

	onMount(async () => {
		try {
			const list = await invoke<TxEntry[]>("wallet_get_txs");
			setTxs(list);
		} catch (e: any) {
			setError(typeof e === "string" ? e : "Failed to load transactions");
		}
	});

	async function cancelTx(txSlateId: string) {
		try {
			await invoke("wallet_cancel_tx", { txId: txSlateId });
			const list = await invoke<TxEntry[]>("wallet_get_txs");
			setTxs(list);
			setSelected(null);
		} catch (e: any) {
			setError(typeof e === "string" ? e : "Failed to cancel transaction");
		}
	}

	const headerStyle = { color: "var(--normal-surface)" };
	const cellStyle = { color: "var(--bright-surface)" };

	return (
		<div>
			<h3 class="text-sm font-medium mb-3" style={{ color: "var(--bright-primary)" }}>
				Transactions
			</h3>

			{error() && (
				<p class="text-xs mb-2" style={{ color: "var(--bright-error)" }}>{error()}</p>
			)}

			<Show when={selected()}>
				{(tx) => (
					<TxDetail
						tx={tx()}
						onClose={() => setSelected(null)}
						onCancel={tx().tx_slate_id && !tx().confirmed ? () => cancelTx(tx().tx_slate_id!) : undefined}
					/>
				)}
			</Show>

			<div
				class="rounded-lg overflow-hidden"
				style={{
					"background-color": "var(--base-fg)",
					border: "1px solid var(--normal-primary)",
				}}
			>
				<table class="w-full text-xs">
					<thead>
						<tr style={{ "border-bottom": "1px solid var(--normal-primary)" }}>
							<th class="px-3 py-2 text-left" style={headerStyle}>ID</th>
							<th class="px-3 py-2 text-left" style={headerStyle}>Type</th>
							<th class="px-3 py-2 text-right" style={headerStyle}>Amount</th>
							<th class="px-3 py-2 text-right" style={headerStyle}>Fee</th>
							<th class="px-3 py-2 text-center" style={headerStyle}>Status</th>
							<th class="px-3 py-2 text-right" style={headerStyle}>Date</th>
						</tr>
					</thead>
					<tbody>
						<For each={txs()} fallback={
							<tr>
								<td colspan="6" class="px-3 py-4 text-center" style={{ color: "var(--normal-surface)" }}>
									No transactions
								</td>
							</tr>
						}>
							{(tx) => {
								const isSend = tx.tx_type.includes("Sent") || tx.tx_type.includes("Self Spend");
								const amount = isSend ? tx.amount_debited : tx.amount_credited;
								return (
									<tr
										class="cursor-pointer transition-colors"
										style={{ "border-bottom": "1px solid var(--normal-primary)" }}
										onClick={() => setSelected(tx)}
										onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--normal-primary)"}
										onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
									>
										<td class="px-3 py-2" style={cellStyle}>{tx.id}</td>
										<td class="px-3 py-2" style={cellStyle}>{tx.tx_type}</td>
										<td class="px-3 py-2 text-right font-mono" style={{
											color: isSend ? "var(--bright-error)" : "var(--bright-secondary)",
										}}>
											{isSend ? "-" : "+"}{amount}
										</td>
										<td class="px-3 py-2 text-right font-mono" style={cellStyle}>{tx.fee}</td>
										<td class="px-3 py-2 text-center">
											<span
												class="px-2 py-0.5 rounded-full text-xs"
												style={{
													"background-color": tx.confirmed ? "var(--normal-primary)" : "var(--normal-secondary)",
													color: tx.confirmed ? "var(--bright-primary)" : "var(--bright-secondary)",
												}}
											>
												{tx.confirmed ? "Confirmed" : "Pending"}
											</span>
										</td>
										<td class="px-3 py-2 text-right" style={cellStyle}>
											{tx.confirmation_ts || tx.creation_ts.split("T")[0]}
										</td>
									</tr>
								);
							}}
						</For>
					</tbody>
				</table>
			</div>
		</div>
	);
}
