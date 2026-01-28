import { createSignal, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface ParsedSlate {
	slate_id: string;
	state: string;
	amount: number;
	has_existing_tx: boolean;
}

interface Props {
	onSuccess: (slateId: string, responseSlatepack?: string) => void;
	onCancel: () => void;
	useContracts: boolean;
}

export default function ApplyTx(props: Props) {
	const [slatepack, setSlatepack] = createSignal("");
	const [parsed, setParsed] = createSignal<ParsedSlate | null>(null);
	const [error, setError] = createSignal("");
	const [loading, setLoading] = createSignal(false);

	async function handleParse() {
		setError("");
		if (!slatepack()) {
			setError("Paste a slatepack message");
			return;
		}
		setLoading(true);
		try {
			const result = await invoke<ParsedSlate>("wallet_apply_tx", {
				slatepack: slatepack(),
			});
			setParsed(result);
		} catch (e: any) {
			setError(typeof e === "string" ? e : "Failed to parse slatepack");
		} finally {
			setLoading(false);
		}
	}

	async function handleSign() {
		setLoading(true);
		setError("");
		try {
			const command = props.useContracts ? "wallet_contract_sign" : "wallet_apply_tx";
			const result = await invoke<{ slate_id: string; response_slatepack?: string }>(command, {
				slatepack: slatepack(),
			});
			props.onSuccess(result.slate_id, result.response_slatepack || undefined);
		} catch (e: any) {
			setError(typeof e === "string" ? e : "Failed to process transaction");
		} finally {
			setLoading(false);
		}
	}

	const inputStyle = {
		"background-color": "var(--base-bg)",
		color: "var(--bright-surface)",
		border: "1px solid var(--normal-primary)",
	};

	return (
		<div class="max-w-lg mx-auto">
			<h2 class="text-xl font-semibold mb-6" style={{ color: "var(--bright-primary)" }}>
				Receive / Apply Transaction
			</h2>

			<div class="mb-4">
				<label class="block text-xs mb-1" style={{ color: "var(--normal-surface)" }}>
					Paste Slatepack Message
				</label>
				<textarea
					class="w-full px-3 py-2 rounded text-sm font-mono h-32"
					style={inputStyle}
					value={slatepack()}
					onInput={(e) => setSlatepack(e.currentTarget.value)}
					placeholder="BEGINSLATEPACK..."
				/>
			</div>

			<Show when={!parsed()}>
				<button
					class="px-4 py-2 rounded text-sm font-medium"
					style={{
						"background-color": "var(--normal-primary)",
						color: "var(--bright-primary)",
						border: "1px solid var(--bright-primary)",
						opacity: loading() ? "0.6" : "1",
					}}
					disabled={loading()}
					onClick={handleParse}
				>
					{loading() ? "Parsing..." : "Parse"}
				</button>
			</Show>

			<Show when={parsed()}>
				{(p) => (
					<div class="space-y-4">
						<div
							class="rounded-lg p-4"
							style={{
								"background-color": "var(--base-fg)",
								border: "1px solid var(--normal-primary)",
							}}
						>
							<div class="text-xs space-y-1" style={{ color: "var(--normal-surface)" }}>
								<div>Slate ID: <span style={{ color: "var(--bright-surface)" }}>{p().slate_id}</span></div>
								<div>State: <span style={{ color: "var(--bright-surface)" }}>{p().state}</span></div>
								<div>Amount: <span style={{ color: "var(--bright-secondary)" }}>{(p().amount / 1_000_000_000).toFixed(9)} grin</span></div>
							</div>
						</div>

						<div class="flex gap-3">
							<button
								class="px-6 py-2 rounded font-medium text-sm"
								style={{
									"background-color": "var(--normal-primary)",
									color: "var(--bright-primary)",
									border: "1px solid var(--bright-primary)",
									opacity: loading() ? "0.6" : "1",
								}}
								disabled={loading()}
								onClick={handleSign}
							>
								{loading() ? "Processing..." : "Confirm"}
							</button>
							<button
								class="px-6 py-2 rounded text-sm"
								style={{ color: "var(--normal-surface)", border: "1px solid var(--normal-surface)" }}
								onClick={props.onCancel}
							>
								Reject
							</button>
						</div>
					</div>
				)}
			</Show>

			{error() && (
				<p class="text-sm mt-3" style={{ color: "var(--bright-error)" }}>{error()}</p>
			)}
		</div>
	);
}
