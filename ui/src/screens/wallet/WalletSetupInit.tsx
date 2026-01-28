export type WalletSetupAction = "create" | "list";

interface Props {
	onAction: (action: WalletSetupAction) => void;
	hasWallets: boolean;
}

export default function WalletSetupInit(props: Props) {
	return (
		<div class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
			<h2 class="text-2xl font-bold" style={{ color: "var(--bright-primary)" }}>
				Welcome to Grin
			</h2>
			<p class="text-sm max-w-md text-center" style={{ color: "var(--normal-surface)" }}>
				Create a new wallet to get started, or select an existing one.
			</p>
			<div class="flex gap-4">
				<button
					class="px-6 py-3 rounded font-medium transition-colors"
					style={{
						"background-color": "var(--normal-primary)",
						color: "var(--bright-primary)",
						border: "1px solid var(--bright-primary)",
					}}
					onClick={() => props.onAction("create")}
				>
					Create Wallet
				</button>
				{props.hasWallets && (
					<button
						class="px-6 py-3 rounded font-medium transition-colors"
						style={{
							"background-color": "transparent",
							color: "var(--bright-surface)",
							border: "1px solid var(--normal-surface)",
						}}
						onClick={() => props.onAction("list")}
					>
						Select Existing
					</button>
				)}
			</div>
		</div>
	);
}
