import { invoke } from "@tauri-apps/api/core";

interface AboutProps {
	version: string;
}

async function openUrl(url: string) {
	try {
		await invoke("plugin:shell|open", { path: url });
	} catch {
		window.open(url, "_blank");
	}
}

export default function About(props: AboutProps) {
	const cardStyle = {
		"background-color": "var(--base-fg)",
		border: "1px solid var(--normal-primary)",
	};

	const linkStyle = {
		color: "var(--bright-primary)",
		cursor: "pointer",
	};

	return (
		<div>
			<h2 class="text-xl font-semibold mb-4" style={{ color: "var(--bright-primary)" }}>
				About
			</h2>
			<div class="rounded-lg p-6 mb-4" style={cardStyle}>
				<h3 class="text-lg font-bold mb-2" style={{ color: "var(--bright-primary)" }}>
					Grin GUI
				</h3>
				<p class="text-sm mb-1" style={{ color: "var(--normal-surface)" }}>
					Version: {props.version || "unknown"}
				</p>
				<p class="text-sm mb-4" style={{ color: "var(--normal-surface)" }}>
					A desktop interface for Grin wallet and node.
				</p>
				<p class="text-xs" style={{ color: "var(--normal-surface)" }}>
					Simple. Private. Scalable.
				</p>
			</div>

			<div class="rounded-lg p-6 mb-4" style={cardStyle}>
				<h3 class="text-sm font-medium mb-3" style={{ color: "var(--bright-surface)" }}>
					Links
				</h3>
				<div class="space-y-2 text-sm">
					<div>
						<span
							class="underline text-sm"
							style={linkStyle}
							onClick={() => openUrl("https://grin.mw")}
						>
							grin.mw
						</span>
						<span class="text-xs ml-2" style={{ color: "var(--normal-surface)" }}>
							- Official Website
						</span>
					</div>
					<div>
						<span
							class="underline text-sm"
							style={linkStyle}
							onClick={() => openUrl("https://github.com/mimblewimble/grin-gui")}
						>
							GitHub
						</span>
						<span class="text-xs ml-2" style={{ color: "var(--normal-surface)" }}>
							- Source Code
						</span>
					</div>
					<div>
						<span
							class="underline text-sm"
							style={linkStyle}
							onClick={() => openUrl("https://forum.grin.mw")}
						>
							Forum
						</span>
						<span class="text-xs ml-2" style={{ color: "var(--normal-surface)" }}>
							- Community
						</span>
					</div>
				</div>
			</div>

			<div class="rounded-lg p-6" style={cardStyle}>
				<h3 class="text-sm font-medium mb-3" style={{ color: "var(--bright-surface)" }}>
					Donate
				</h3>
				<p class="text-xs mb-2" style={{ color: "var(--normal-surface)" }}>
					Support Grin development through the community fund:
				</p>
				<span
					class="underline text-sm"
					style={linkStyle}
					onClick={() => openUrl("https://grin.mw/fund")}
				>
					grin.mw/fund
				</span>
			</div>
		</div>
	);
}
