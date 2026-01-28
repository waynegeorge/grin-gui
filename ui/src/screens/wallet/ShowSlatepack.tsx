import { createSignal } from "solid-js";

interface Props {
	slatepack: string;
	slateId: string;
	onDone: () => void;
}

export default function ShowSlatepack(props: Props) {
	const [copied, setCopied] = createSignal(false);

	function copy() {
		navigator.clipboard.writeText(props.slatepack);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<div class="max-w-lg mx-auto">
			<h2 class="text-xl font-semibold mb-2" style={{ color: "var(--bright-primary)" }}>
				Transaction Created
			</h2>
			<p class="text-xs mb-4" style={{ color: "var(--normal-surface)" }}>
				Slate ID: {props.slateId}
			</p>
			<p class="text-sm mb-3" style={{ color: "var(--normal-surface)" }}>
				Send this slatepack to the recipient:
			</p>
			<div
				class="rounded-lg p-3 mb-4 max-h-48 overflow-y-auto"
				style={{
					"background-color": "var(--base-bg)",
					border: "1px solid var(--normal-primary)",
				}}
			>
				<pre
					class="text-xs font-mono whitespace-pre-wrap break-all select-all"
					style={{ color: "var(--bright-surface)" }}
				>
					{props.slatepack}
				</pre>
			</div>
			<div class="flex gap-3">
				<button
					class="px-4 py-2 rounded text-sm"
					style={{ color: "var(--normal-surface)", border: "1px solid var(--normal-surface)" }}
					onClick={copy}
				>
					{copied() ? "Copied!" : "Copy"}
				</button>
				<button
					class="px-6 py-2 rounded font-medium text-sm"
					style={{
						"background-color": "var(--normal-primary)",
						color: "var(--bright-primary)",
						border: "1px solid var(--bright-primary)",
					}}
					onClick={props.onDone}
				>
					Done
				</button>
			</div>
		</div>
	);
}
