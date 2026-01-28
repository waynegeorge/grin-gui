import { createSignal, onMount, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface ThemeInfo {
	name: string;
	palette: Record<string, string>;
}

type Tab = "general" | "wallet" | "node";

export default function Settings() {
	const [tab, setTab] = createSignal<Tab>("general");
	const [themes, setThemes] = createSignal<ThemeInfo[]>([]);
	const [currentTheme, setCurrentTheme] = createSignal("");
	const [language, setLanguage] = createSignal("English");
	const [txMethod, setTxMethod] = createSignal("Legacy");
	const [saving, setSaving] = createSignal(false);

	onMount(async () => {
		try {
			const [t, config] = await Promise.all([
				invoke<ThemeInfo[]>("get_themes"),
				invoke<any>("config_get"),
			]);
			setThemes(t);
			setCurrentTheme(config.theme || "Dark");
			setLanguage(config.language || "English");
			setTxMethod(config.tx_method || "Legacy");
		} catch (e) {
			console.error("Failed to load settings:", e);
		}
	});

	function applyTheme(theme: ThemeInfo) {
		const root = document.documentElement;
		const p = theme.palette;
		root.style.setProperty("--base-bg", p.base_bg);
		root.style.setProperty("--base-fg", p.base_fg);
		root.style.setProperty("--normal-primary", p.normal_primary);
		root.style.setProperty("--normal-secondary", p.normal_secondary);
		root.style.setProperty("--normal-surface", p.normal_surface);
		root.style.setProperty("--normal-error", p.normal_error);
		root.style.setProperty("--bright-primary", p.bright_primary);
		root.style.setProperty("--bright-secondary", p.bright_secondary);
		root.style.setProperty("--bright-surface", p.bright_surface);
		root.style.setProperty("--bright-error", p.bright_error);
		setCurrentTheme(theme.name);
		saveConfig({ theme: theme.name });
	}

	async function saveConfig(partial: Record<string, any>) {
		setSaving(true);
		try {
			const current = await invoke<any>("config_get");
			delete current.version;
			const updated = { ...current, ...partial };
			await invoke("config_save", { configJson: updated });
		} catch (e) {
			console.error("Failed to save config:", e);
		} finally {
			setSaving(false);
		}
	}

	const cardStyle = {
		"background-color": "var(--base-fg)",
		border: "1px solid var(--normal-primary)",
	};

	const tabs: { id: Tab; label: string }[] = [
		{ id: "general", label: "General" },
		{ id: "wallet", label: "Wallet" },
		{ id: "node", label: "Node" },
	];

	return (
		<div>
			<h2 class="text-xl font-semibold mb-4" style={{ color: "var(--bright-primary)" }}>
				Settings
			</h2>

			<div class="flex gap-1 mb-4">
				{tabs.map((t) => (
					<button
						class="px-4 py-1.5 rounded-t text-sm"
						style={{
							"background-color": tab() === t.id ? "var(--base-fg)" : "transparent",
							color: tab() === t.id ? "var(--bright-primary)" : "var(--normal-surface)",
							"border-bottom": tab() === t.id ? "2px solid var(--bright-primary)" : "2px solid transparent",
						}}
						onClick={() => setTab(t.id)}
					>
						{t.label}
					</button>
				))}
			</div>

			<Show when={tab() === "general"}>
				<div class="rounded-lg p-6 space-y-6" style={cardStyle}>
					<div>
						<h3 class="text-sm font-medium mb-3" style={{ color: "var(--bright-surface)" }}>
							Theme
						</h3>
						<div class="grid grid-cols-3 gap-2">
							<For each={themes()}>
								{(theme) => (
									<button
										class="px-3 py-2 rounded text-xs transition-colors"
										style={{
											"background-color":
												currentTheme() === theme.name
													? "var(--normal-primary)"
													: "transparent",
											color:
												currentTheme() === theme.name
													? "var(--bright-primary)"
													: "var(--normal-surface)",
											border: "1px solid var(--normal-primary)",
										}}
										onClick={() => applyTheme(theme)}
									>
										{theme.name}
									</button>
								)}
							</For>
						</div>
					</div>

					<div>
						<h3 class="text-sm font-medium mb-2" style={{ color: "var(--bright-surface)" }}>
							Language
						</h3>
						<select
							class="px-3 py-2 rounded text-sm"
							style={{
								"background-color": "var(--base-bg)",
								color: "var(--bright-surface)",
								border: "1px solid var(--normal-primary)",
							}}
							value={language()}
							onChange={(e) => {
								setLanguage(e.currentTarget.value);
								saveConfig({ language: e.currentTarget.value });
							}}
						>
							<option value="English">English</option>
							<option value="German">Deutsch</option>
						</select>
					</div>
				</div>
			</Show>

			<Show when={tab() === "wallet"}>
				<div class="rounded-lg p-6 space-y-6" style={cardStyle}>
					<div>
						<h3 class="text-sm font-medium mb-2" style={{ color: "var(--bright-surface)" }}>
							Transaction Method
						</h3>
						<p class="text-xs mb-3" style={{ color: "var(--normal-surface)" }}>
							Contracts is the newer protocol for interactive transactions.
						</p>
						<div class="flex gap-2">
							{["Legacy", "Contracts"].map((method) => (
								<button
									class="px-4 py-2 rounded text-sm"
									style={{
										"background-color":
											txMethod() === method ? "var(--normal-primary)" : "transparent",
										color:
											txMethod() === method ? "var(--bright-primary)" : "var(--normal-surface)",
										border: "1px solid var(--normal-primary)",
									}}
									onClick={() => {
										setTxMethod(method);
										saveConfig({ tx_method: method });
									}}
								>
									{method}
								</button>
							))}
						</div>
					</div>
				</div>
			</Show>

			<Show when={tab() === "node"}>
				<div class="rounded-lg p-6" style={cardStyle}>
					<p class="text-sm" style={{ color: "var(--normal-surface)" }}>
						Node configuration options coming soon.
					</p>
				</div>
			</Show>

			{saving() && (
				<p class="text-xs mt-2" style={{ color: "var(--normal-surface)" }}>Saving...</p>
			)}
		</div>
	);
}
