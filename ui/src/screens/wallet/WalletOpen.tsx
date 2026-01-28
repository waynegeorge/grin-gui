import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface Props {
	walletIndex: number;
	walletName: string;
	onSuccess: () => void;
	onCancel: () => void;
}

export default function WalletOpen(props: Props) {
	const [password, setPassword] = createSignal("");
	const [error, setError] = createSignal("");
	const [loading, setLoading] = createSignal(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await invoke("wallet_open", {
				walletIndex: props.walletIndex,
				password: password(),
			});
			props.onSuccess();
		} catch (e: any) {
			setError(typeof e === "string" ? e : e.message || "Failed to open wallet");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div class="max-w-sm mx-auto">
			<h2 class="text-xl font-semibold mb-2" style={{ color: "var(--bright-primary)" }}>
				Open Wallet
			</h2>
			<p class="text-sm mb-6" style={{ color: "var(--normal-surface)" }}>
				Enter password for "{props.walletName}"
			</p>
			<form onSubmit={handleSubmit} class="space-y-4">
				<input
					type="password"
					class="w-full px-3 py-2 rounded text-sm"
					style={{
						"background-color": "var(--base-bg)",
						color: "var(--bright-surface)",
						border: "1px solid var(--normal-primary)",
					}}
					value={password()}
					onInput={(e) => setPassword(e.currentTarget.value)}
					placeholder="Password"
					autofocus
				/>

				{error() && (
					<p class="text-sm" style={{ color: "var(--bright-error)" }}>
						{error()}
					</p>
				)}

				<div class="flex gap-3">
					<button
						type="submit"
						disabled={loading()}
						class="px-6 py-2 rounded font-medium text-sm transition-colors"
						style={{
							"background-color": "var(--normal-primary)",
							color: "var(--bright-primary)",
							border: "1px solid var(--bright-primary)",
							opacity: loading() ? "0.6" : "1",
						}}
					>
						{loading() ? "Opening..." : "Open"}
					</button>
					<button
						type="button"
						class="px-6 py-2 rounded text-sm"
						style={{
							color: "var(--normal-surface)",
							border: "1px solid var(--normal-surface)",
						}}
						onClick={props.onCancel}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
