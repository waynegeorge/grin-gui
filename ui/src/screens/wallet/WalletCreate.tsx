import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface Props {
	onSuccess: (mnemonic: string, displayName: string) => void;
	onCancel: () => void;
}

export default function WalletCreate(props: Props) {
	const [password, setPassword] = createSignal("");
	const [confirmPassword, setConfirmPassword] = createSignal("");
	const [displayName, setDisplayName] = createSignal("Default");
	const [chainType, setChainType] = createSignal("Mainnet");
	const [recoveryPhrase, setRecoveryPhrase] = createSignal("");
	const [showAdvanced, setShowAdvanced] = createSignal(false);
	const [error, setError] = createSignal("");
	const [loading, setLoading] = createSignal(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		setError("");

		if (password() !== confirmPassword()) {
			setError("Passwords do not match");
			return;
		}
		if (password().length < 1) {
			setError("Password is required");
			return;
		}

		setLoading(true);
		try {
			const result = await invoke<{ mnemonic: string; display_name: string }>("wallet_init", {
				password: password(),
				displayName: displayName(),
				chainType: chainType(),
				recoveryPhrase: recoveryPhrase() || null,
			});
			props.onSuccess(result.mnemonic, result.display_name);
		} catch (e: any) {
			setError(typeof e === "string" ? e : e.message || "Failed to create wallet");
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
				Create Wallet
			</h2>
			<form onSubmit={handleSubmit} class="space-y-4">
				<div>
					<label class="block text-xs mb-1" style={{ color: "var(--normal-surface)" }}>
						Password
					</label>
					<input
						type="password"
						class="w-full px-3 py-2 rounded text-sm"
						style={inputStyle}
						value={password()}
						onInput={(e) => setPassword(e.currentTarget.value)}
					/>
				</div>
				<div>
					<label class="block text-xs mb-1" style={{ color: "var(--normal-surface)" }}>
						Confirm Password
					</label>
					<input
						type="password"
						class="w-full px-3 py-2 rounded text-sm"
						style={inputStyle}
						value={confirmPassword()}
						onInput={(e) => setConfirmPassword(e.currentTarget.value)}
					/>
				</div>
				<div>
					<label class="block text-xs mb-1" style={{ color: "var(--normal-surface)" }}>
						Chain
					</label>
					<select
						class="w-full px-3 py-2 rounded text-sm"
						style={inputStyle}
						value={chainType()}
						onChange={(e) => setChainType(e.currentTarget.value)}
					>
						<option value="Mainnet">Mainnet</option>
						<option value="Testnet">Testnet</option>
					</select>
				</div>

				<button
					type="button"
					class="text-xs underline"
					style={{ color: "var(--normal-surface)" }}
					onClick={() => setShowAdvanced(!showAdvanced())}
				>
					{showAdvanced() ? "Hide" : "Show"} Advanced Options
				</button>

				{showAdvanced() && (
					<div class="space-y-4">
						<div>
							<label class="block text-xs mb-1" style={{ color: "var(--normal-surface)" }}>
								Display Name
							</label>
							<input
								type="text"
								class="w-full px-3 py-2 rounded text-sm"
								style={inputStyle}
								value={displayName()}
								onInput={(e) => setDisplayName(e.currentTarget.value)}
							/>
						</div>
						<div>
							<label class="block text-xs mb-1" style={{ color: "var(--normal-surface)" }}>
								Recovery Phrase (leave blank to create new)
							</label>
							<textarea
								class="w-full px-3 py-2 rounded text-sm h-20"
								style={inputStyle}
								value={recoveryPhrase()}
								onInput={(e) => setRecoveryPhrase(e.currentTarget.value)}
								placeholder="Enter existing recovery phrase to restore..."
							/>
						</div>
					</div>
				)}

				{error() && (
					<p class="text-sm" style={{ color: "var(--bright-error)" }}>
						{error()}
					</p>
				)}

				<div class="flex gap-3 pt-2">
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
						{loading() ? "Creating..." : "Create"}
					</button>
					<button
						type="button"
						class="px-6 py-2 rounded text-sm transition-colors"
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
