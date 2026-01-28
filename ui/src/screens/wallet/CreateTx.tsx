import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface Props {
	onSuccess: (slateId: string, slatepack: string) => void;
	onCancel: () => void;
	useContracts: boolean;
}

export default function CreateTx(props: Props) {
	const [amount, setAmount] = createSignal("");
	const [address, setAddress] = createSignal("");
	const [error, setError] = createSignal("");
	const [loading, setLoading] = createSignal(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		setError("");

		const amtFloat = parseFloat(amount());
		if (isNaN(amtFloat) || amtFloat <= 0) {
			setError("Enter a valid amount");
			return;
		}
		if (!address()) {
			setError("Enter a recipient address");
			return;
		}

		setLoading(true);
		try {
			const amountNano = Math.round(amtFloat * 1_000_000_000);
			const command = props.useContracts ? "wallet_contract_new" : "wallet_create_tx";
			const result = await invoke<{ slate_id: string; encrypted_slatepack: string }>(command, {
				amount: amountNano,
				destAddress: address(),
			});
			props.onSuccess(result.slate_id, result.encrypted_slatepack);
		} catch (e: any) {
			setError(typeof e === "string" ? e : e.message || "Failed to create transaction");
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
		<div class="max-w-md mx-auto">
			<h2 class="text-xl font-semibold mb-6" style={{ color: "var(--bright-primary)" }}>
				Send Grin
			</h2>
			<form onSubmit={handleSubmit} class="space-y-4">
				<div>
					<label class="block text-xs mb-1" style={{ color: "var(--normal-surface)" }}>
						Amount (GRIN)
					</label>
					<input
						type="text"
						class="w-full px-3 py-2 rounded text-sm"
						style={inputStyle}
						value={amount()}
						onInput={(e) => setAmount(e.currentTarget.value)}
						placeholder="0.00"
					/>
				</div>
				<div>
					<label class="block text-xs mb-1" style={{ color: "var(--normal-surface)" }}>
						Recipient Slatepack Address
					</label>
					<input
						type="text"
						class="w-full px-3 py-2 rounded text-sm font-mono"
						style={inputStyle}
						value={address()}
						onInput={(e) => setAddress(e.currentTarget.value)}
						placeholder="grin1..."
					/>
				</div>

				{error() && (
					<p class="text-sm" style={{ color: "var(--bright-error)" }}>{error()}</p>
				)}

				<div class="flex gap-3 pt-2">
					<button
						type="submit"
						disabled={loading()}
						class="px-6 py-2 rounded font-medium text-sm"
						style={{
							"background-color": "var(--normal-primary)",
							color: "var(--bright-primary)",
							border: "1px solid var(--bright-primary)",
							opacity: loading() ? "0.6" : "1",
						}}
					>
						{loading() ? "Sending..." : "Send"}
					</button>
					<button
						type="button"
						class="px-6 py-2 rounded text-sm"
						style={{ color: "var(--normal-surface)", border: "1px solid var(--normal-surface)" }}
						onClick={props.onCancel}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
