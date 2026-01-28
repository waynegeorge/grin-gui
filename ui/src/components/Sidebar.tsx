import type { Screen } from "../App.tsx";

interface SidebarProps {
	current: Screen;
	onNavigate: (screen: Screen) => void;
}

const items: { id: Screen; label: string }[] = [
	{ id: "wallet", label: "Wallet" },
	{ id: "node", label: "Node" },
	{ id: "settings", label: "Settings" },
	{ id: "about", label: "About" },
];

export default function Sidebar(props: SidebarProps) {
	return (
		<nav
			class="flex flex-col w-48 h-full py-4 border-r"
			style={{
				"background-color": "var(--base-fg)",
				"border-color": "var(--normal-primary)",
			}}
		>
			<div class="px-4 mb-6">
				<h1
					class="text-lg font-bold tracking-wide"
					style={{ color: "var(--bright-primary)" }}
				>
					Grin
				</h1>
			</div>
			{items.map((item) => (
				<button
					class="px-4 py-2 text-left text-sm transition-colors duration-150"
					style={{
						"background-color":
							props.current === item.id
								? "var(--normal-primary)"
								: "transparent",
						color:
							props.current === item.id
								? "var(--bright-primary)"
								: "var(--normal-surface)",
					}}
					onClick={() => props.onNavigate(item.id)}
				>
					{item.label}
				</button>
			))}
		</nav>
	);
}
