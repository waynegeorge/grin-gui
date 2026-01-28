import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

interface NodeInfo {
	running: boolean;
	status: string;
}

interface NodeStatusEvent {
	sync_status: string;
	sync_progress: number;
	block_height: number;
	network_height: number;
	peer_count: number;
	difficulty: number;
}

export default function NodeStatus() {
	const [running, setRunning] = createSignal(false);
	const [loading, setLoading] = createSignal(false);
	const [error, setError] = createSignal("");
	const [status, setStatus] = createSignal<NodeStatusEvent | null>(null);
	const [chainType, setChainType] = createSignal("Mainnet");

	let unlisten: UnlistenFn | null = null;

	onMount(async () => {
		try {
			const info = await invoke<NodeInfo>("node_get_status");
			setRunning(info.running);
		} catch (e) {
			console.error("Failed to get node status:", e);
		}

		unlisten = await listen<NodeStatusEvent>("node-status-update", (event) => {
			setStatus(event.payload);
		});
	});

	onCleanup(() => {
		if (unlisten) unlisten();
	});

	async function handleStart() {
		setError("");
		setLoading(true);
		try {
			await invoke("node_start", { chainType: chainType() });
			setRunning(true);
		} catch (e: any) {
			setError(typeof e === "string" ? e : "Failed to start node");
		} finally {
			setLoading(false);
		}
	}

	async function handleStop() {
		setError("");
		setLoading(true);
		try {
			await invoke("node_stop");
			setRunning(false);
			setStatus(null);
		} catch (e: any) {
			setError(typeof e === "string" ? e : "Failed to stop node");
		} finally {
			setLoading(false);
		}
	}

	const cardStyle = {
		"background-color": "var(--base-fg)",
		border: "1px solid var(--normal-primary)",
	};

	const labelStyle = { color: "var(--normal-surface)" };
	const valueStyle = { color: "var(--bright-surface)" };

	return (
		<div>
			<h2 class="text-xl font-semibold mb-4" style={{ color: "var(--bright-primary)" }}>
				Node
			</h2>

			<div class="rounded-lg p-6 mb-4" style={cardStyle}>
				<div class="flex items-center gap-3 mb-4">
					<div
						class="w-3 h-3 rounded-full"
						style={{
							"background-color": running()
								? "var(--bright-secondary)"
								: "var(--normal-error)",
						}}
					/>
					<span style={valueStyle}>
						{running() ? (status()?.sync_status || "Running") : "Stopped"}
					</span>
				</div>

				<Show when={running() && status()}>
					{(s) => (
						<div class="space-y-3 mb-4">
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span style={labelStyle}>Sync Progress</span>
									<span style={valueStyle}>{(s().sync_progress * 100).toFixed(1)}%</span>
								</div>
								<div
									class="w-full h-2 rounded-full overflow-hidden"
									style={{ "background-color": "var(--base-bg)" }}
								>
									<div
										class="h-full rounded-full transition-all"
										style={{
											width: `${s().sync_progress * 100}%`,
											"background-color": "var(--bright-primary)",
										}}
									/>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-3 text-xs">
								<div>
									<span style={labelStyle}>Block Height: </span>
									<span class="font-mono" style={valueStyle}>{s().block_height.toLocaleString()}</span>
								</div>
								<div>
									<span style={labelStyle}>Peers: </span>
									<span class="font-mono" style={valueStyle}>{s().peer_count}</span>
								</div>
								<div>
									<span style={labelStyle}>Difficulty: </span>
									<span class="font-mono" style={valueStyle}>{s().difficulty.toLocaleString()}</span>
								</div>
							</div>
						</div>
					)}
				</Show>

				<Show when={!running()}>
					<div class="mb-4">
						<label class="block text-xs mb-1" style={labelStyle}>Chain</label>
						<select
							class="px-3 py-1 rounded text-sm"
							style={{
								"background-color": "var(--base-bg)",
								color: "var(--bright-surface)",
								border: "1px solid var(--normal-primary)",
							}}
							value={chainType()}
							onChange={(e) => setChainType(e.currentTarget.value)}
						>
							<option value="Mainnet">Mainnet</option>
							<option value="Testnet">Testnet</option>
						</select>
					</div>
				</Show>

				{error() && (
					<p class="text-sm mb-3" style={{ color: "var(--bright-error)" }}>{error()}</p>
				)}

				<button
					class="px-4 py-2 rounded text-sm font-medium transition-colors"
					style={{
						"background-color": "var(--normal-primary)",
						color: "var(--bright-primary)",
						border: "1px solid var(--bright-primary)",
						opacity: loading() ? "0.6" : "1",
					}}
					disabled={loading()}
					onClick={running() ? handleStop : handleStart}
				>
					{loading() ? "..." : running() ? "Stop Node" : "Start Node"}
				</button>
			</div>
		</div>
	);
}
