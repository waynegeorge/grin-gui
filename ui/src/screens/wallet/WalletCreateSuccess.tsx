import { createSignal } from "solid-js";

interface Props {
	mnemonic: string;
	displayName: string;
	onConfirm: () => void;
}

export default function WalletCreateSuccess(props: Props) {
	const [copied, setCopied] = createSignal(false);

	function copyMnemonic() {
		navigator.clipboard.writeText(props.mnemonic);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<div class="max-w-lg mx-auto">
			<h2 class="text-xl font-semibold mb-2" style={{ color: "var(--bright-primary)" }}>
				Wallet Created
			</h2>
			<p class="text-sm mb-6" style={{ color: "var(--normal-surface)" }}>
				Wallet "{props.displayName}" has been created. Write down your recovery phrase
				and store it safely. You will need it to recover your wallet.
			</p>

			<div
				class="rounded-lg p-4 mb-4"
				style={{
					"background-color": "var(--base-bg)",
					border: "1px solid var(--normal-secondary)",
				}}
			>
				<label class="block text-xs mb-2 font-medium" style={{ color: "var(--bright-secondary)" }}>
					Recovery Phrase
				</label>
				<p
					class="text-sm font-mono leading-relaxed select-all"
					style={{ color: "var(--bright-surface)" }}
				>
					{props.mnemonic}
				</p>
			</div>

			<div class="flex gap-3">
				<button
					class="px-4 py-2 rounded text-xs transition-colors"
					style={{
						color: "var(--normal-surface)",
						border: "1px solid var(--normal-surface)",
					}}
					onClick={copyMnemonic}
				>
					{copied() ? "Copied!" : "Copy"}
				</button>
				<button
					class="px-6 py-2 rounded font-medium text-sm transition-colors"
					style={{
						"background-color": "var(--normal-primary)",
						color: "var(--bright-primary)",
						border: "1px solid var(--bright-primary)",
					}}
					onClick={props.onConfirm}
				>
					I've saved my phrase
				</button>
			</div>
		</div>
	);
}
