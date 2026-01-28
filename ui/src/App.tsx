import { createSignal, onMount, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar.tsx";
import NodeStatus from "./screens/NodeStatus.tsx";
import Settings from "./screens/Settings.tsx";
import About from "./screens/About.tsx";
import WalletSetupInit from "./screens/wallet/WalletSetupInit.tsx";
import WalletCreate from "./screens/wallet/WalletCreate.tsx";
import WalletCreateSuccess from "./screens/wallet/WalletCreateSuccess.tsx";
import WalletList from "./screens/wallet/WalletList.tsx";
import WalletOpen from "./screens/wallet/WalletOpen.tsx";
import WalletHome from "./screens/wallet/WalletHome.tsx";
import CreateTx from "./screens/wallet/CreateTx.tsx";
import ApplyTx from "./screens/wallet/ApplyTx.tsx";
import ShowSlatepack from "./screens/wallet/ShowSlatepack.tsx";
import TxDone from "./screens/wallet/TxDone.tsx";

export type Screen = "wallet" | "node" | "settings" | "about";
type WalletScreen =
	| "init"
	| "create"
	| "success"
	| "list"
	| "open"
	| "home"
	| "send"
	| "receive"
	| "slatepack"
	| "done";

interface WalletEntry {
	index: number;
	display_name: string;
	chain_type: string;
}

export default function App() {
	const [screen, setScreen] = createSignal<Screen>("wallet");
	const [walletScreen, setWalletScreen] = createSignal<WalletScreen>("init");
	const [version, setVersion] = createSignal("");
	const [wallets, setWallets] = createSignal<WalletEntry[]>([]);
	const [walletOpen, setWalletOpen] = createSignal(false);
	const [txMethod, setTxMethod] = createSignal("Legacy");

	// State for wallet flow
	const [selectedWalletIndex, setSelectedWalletIndex] = createSignal(0);
	const [selectedWalletName, setSelectedWalletName] = createSignal("");
	const [mnemonic, setMnemonic] = createSignal("");
	const [createdName, setCreatedName] = createSignal("");
	const [slatepack, setSlatepack] = createSignal("");
	const [slateId, setSlateId] = createSignal("");

	onMount(async () => {
		try {
			const config = await invoke<any>("config_get");
			setVersion(config.version || "");
			setTxMethod(config.tx_method || "Legacy");

			const list = await invoke<WalletEntry[]>("wallet_list");
			setWallets(list);

			if (list.length === 0) {
				setWalletScreen("init");
			} else {
				setWalletScreen("list");
			}
		} catch (e) {
			console.error("Failed to load config:", e);
		}
	});

	function handleWalletCreated(mne: string, name: string) {
		setMnemonic(mne);
		setCreatedName(name);
		setWalletScreen("success");
	}

	function handleWalletCreateConfirm() {
		setWalletOpen(true);
		setWalletScreen("home");
	}

	function handleSelectWallet(index: number) {
		const w = wallets().find((w) => w.index === index);
		setSelectedWalletIndex(index);
		setSelectedWalletName(w?.display_name || "");
		setWalletScreen("open");
	}

	function handleWalletOpened() {
		setWalletOpen(true);
		setWalletScreen("home");
	}

	async function handleWalletClose() {
		try {
			await invoke("wallet_close");
		} catch (e) {
			console.error("Failed to close wallet:", e);
		}
		setWalletOpen(false);
		const list = await invoke<WalletEntry[]>("wallet_list");
		setWallets(list);
		setWalletScreen(list.length > 0 ? "list" : "init");
	}

	function handleTxCreated(sid: string, sp: string) {
		setSlateId(sid);
		setSlatepack(sp);
		setWalletScreen("slatepack");
	}

	function handleTxApplied(sid: string, responseSp?: string) {
		setSlateId(sid);
		if (responseSp) {
			setSlatepack(responseSp);
			setWalletScreen("slatepack");
		} else {
			setWalletScreen("done");
		}
	}

	function renderWalletScreen() {
		switch (walletScreen()) {
			case "init":
				return (
					<WalletSetupInit
						hasWallets={wallets().length > 0}
						onAction={(a) => setWalletScreen(a === "create" ? "create" : "list")}
					/>
				);
			case "create":
				return (
					<WalletCreate
						onSuccess={handleWalletCreated}
						onCancel={() => setWalletScreen(wallets().length > 0 ? "list" : "init")}
					/>
				);
			case "success":
				return (
					<WalletCreateSuccess
						mnemonic={mnemonic()}
						displayName={createdName()}
						onConfirm={handleWalletCreateConfirm}
					/>
				);
			case "list":
				return (
					<WalletList
						onSelect={handleSelectWallet}
						onCreateNew={() => setWalletScreen("create")}
					/>
				);
			case "open":
				return (
					<WalletOpen
						walletIndex={selectedWalletIndex()}
						walletName={selectedWalletName()}
						onSuccess={handleWalletOpened}
						onCancel={() => setWalletScreen("list")}
					/>
				);
			case "home":
				return (
					<WalletHome
						onSend={() => setWalletScreen("send")}
						onReceive={() => setWalletScreen("receive")}
						onClose={handleWalletClose}
					/>
				);
			case "send":
				return (
					<CreateTx
						useContracts={txMethod() === "Contracts"}
						onSuccess={handleTxCreated}
						onCancel={() => setWalletScreen("home")}
					/>
				);
			case "receive":
				return (
					<ApplyTx
						useContracts={txMethod() === "Contracts"}
						onSuccess={handleTxApplied}
						onCancel={() => setWalletScreen("home")}
					/>
				);
			case "slatepack":
				return (
					<ShowSlatepack
						slatepack={slatepack()}
						slateId={slateId()}
						onDone={() => setWalletScreen("home")}
					/>
				);
			case "done":
				return (
					<TxDone
						slateId={slateId()}
						onDone={() => setWalletScreen("home")}
					/>
				);
		}
	}

	return (
		<div class="flex h-screen w-screen">
			<Sidebar current={screen()} onNavigate={setScreen} />
			<main class="flex-1 overflow-y-auto p-6" style={{ "background-color": "var(--base-bg)" }}>
				<Show when={screen() === "wallet"}>
					{renderWalletScreen()}
				</Show>
				<Show when={screen() === "node"}>
					<NodeStatus />
				</Show>
				<Show when={screen() === "settings"}>
					<Settings />
				</Show>
				<Show when={screen() === "about"}>
					<About version={version()} />
				</Show>
			</main>
		</div>
	);
}
