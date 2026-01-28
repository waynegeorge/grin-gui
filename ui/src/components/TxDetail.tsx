import type { TxEntry } from "./TxTable.tsx";

interface Props {
	tx: TxEntry;
	onClose: () => void;
	onCancel?: () => void;
}

export default function TxDetail(props: Props) {
	const row = (label: string, value: string) => (
		<div class="flex justify-between py-1">
			<span class="text-xs" style={{ color: "var(--normal-surface)" }}>{label}</span>
			<span class="text-xs font-mono" style={{ color: "var(--bright-surface)" }}>{value}</span>
		</div>
	);

	return (
		<div
			class="rounded-lg p-4 mb-4"
			style={{
				"background-color": "var(--base-fg)",
				border: "1px solid var(--bright-primary)",
			}}
		>
			<div class="flex justify-between items-center mb-3">
				<h4 class="text-sm font-medium" style={{ color: "var(--bright-primary)" }}>
					Transaction #{props.tx.id}
				</h4>
				<button
					class="text-xs"
					style={{ color: "var(--normal-surface)" }}
					onClick={props.onClose}
				>
					Close
				</button>
			</div>
			<div class="divide-y" style={{ "border-color": "var(--normal-primary)" }}>
				{row("Type", props.tx.tx_type)}
				{row("Credited", props.tx.amount_credited)}
				{row("Debited", props.tx.amount_debited)}
				{row("Fee", props.tx.fee)}
				{row("Status", props.tx.confirmed ? "Confirmed" : "Pending")}
				{row("Created", props.tx.creation_ts)}
				{props.tx.confirmation_ts && row("Confirmed", props.tx.confirmation_ts)}
				{props.tx.tx_slate_id && row("Slate ID", props.tx.tx_slate_id)}
				{row("Inputs", String(props.tx.num_inputs))}
				{row("Outputs", String(props.tx.num_outputs))}
			</div>
			{props.onCancel && (
				<button
					class="mt-3 px-3 py-1 rounded text-xs"
					style={{
						color: "var(--bright-error)",
						border: "1px solid var(--normal-error)",
					}}
					onClick={props.onCancel}
				>
					Cancel Transaction
				</button>
			)}
		</div>
	);
}
