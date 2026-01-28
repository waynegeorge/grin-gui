interface Props {
	slateId: string;
	message?: string;
	onDone: () => void;
}

export default function TxDone(props: Props) {
	return (
		<div class="max-w-md mx-auto text-center py-12">
			<div
				class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
				style={{
					"background-color": "var(--normal-primary)",
					color: "var(--bright-primary)",
				}}
			>
				&#10003;
			</div>
			<h2 class="text-xl font-semibold mb-2" style={{ color: "var(--bright-primary)" }}>
				{props.message || "Transaction Complete"}
			</h2>
			<p class="text-xs mb-6" style={{ color: "var(--normal-surface)" }}>
				Slate ID: {props.slateId}
			</p>
			<button
				class="px-6 py-2 rounded font-medium text-sm"
				style={{
					"background-color": "var(--normal-primary)",
					color: "var(--bright-primary)",
					border: "1px solid var(--bright-primary)",
				}}
				onClick={props.onDone}
			>
				Back to Wallet
			</button>
		</div>
	);
}
