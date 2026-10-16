"use client";
/**
 * BridgeAndPay — lets a customer on Base Sepolia, Arbitrum Sepolia, Optimism Sepolia,
 * or Ethereum Sepolia bridge USDC to Arc Testnet via CCTP (Circle App Kit), then pay
 * an invoice in one flow.
 *
 * @circle-fin/adapter-viem-v2 and @circle-fin/app-kit rely on Node built-ins
 * (crypto, stream) that Next.js cannot statically bundle. We import them lazily
 * at call-time so the server/build phase never touches those modules.
 */
import { useState } from "react";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import type { EIP1193Provider } from "viem";
import { formatUsdc } from "@/lib/settlaV2";

const SOURCE_CHAINS: { label: string; chainId: number; kitChain: string }[] = [
  { label: "Base Sepolia",      chainId: 84532,    kitChain: "Base_Sepolia" },
  { label: "Arbitrum Sepolia",  chainId: 421614,   kitChain: "Arb_Sepolia"  },
  { label: "Optimism Sepolia",  chainId: 11155420, kitChain: "Op_Sepolia"   },
  { label: "Ethereum Sepolia",  chainId: 11155111, kitChain: "Eth_Sepolia"  },
];

const ARC_TESTNET_KIT_CHAIN = "Arc_Testnet";

type BridgeStatus =
  | "idle" | "switching" | "approving" | "burning"
  | "attesting" | "minting" | "done" | "error";

const STATUS_LABEL: Record<BridgeStatus, string> = {
  idle:      "Bridge & pay from another chain",
  switching: "Switching chain…",
  approving: "Approving USDC (1/4)…",
  burning:   "Burning USDC (2/4)…",
  attesting: "Waiting for Circle attestation (3/4)…",
  minting:   "Minting on Arc (4/4)…",
  done:      "Bridged — pay below",
  error:     "Bridge failed — try again",
};

interface Props {
  invoiceAmount: bigint;
  onBridged: () => void;
}

export function BridgeAndPay({ invoiceAmount, onBridged }: Props) {
  const { connector, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const [selectedSource, setSelectedSource] = useState(SOURCE_CHAINS[0]);
  const [status, setStatus] = useState<BridgeStatus>("idle");
  const [stepError, setStepError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const bridgeAmount = (Number(invoiceAmount) / 1e6).toFixed(6);

  async function handleBridge() {
    if (!connector) return;
    setStepError(null);
    try {
      if (chainId !== selectedSource.chainId) {
        setStatus("switching");
        await switchChainAsync({ chainId: selectedSource.chainId });
      }

      // Lazy-load the Node-dependent packages at call-time only (never at build time)
      const [{ createViemAdapterFromProvider }, { AppKit }] = await Promise.all([
        import("@circle-fin/adapter-viem-v2"),
        import("@circle-fin/app-kit"),
      ]);

      const provider = (await connector.getProvider()) as EIP1193Provider;
      const adapter = await createViemAdapterFromProvider({ provider });
      const appKit = new AppKit();

      setStatus("approving");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (appKit as any).bridge({
        from: { adapter, chain: selectedSource.kitChain },
        to:   { adapter, chain: ARC_TESTNET_KIT_CHAIN },
        amount: bridgeAmount,
      });

      if (result.steps) {
        for (const step of result.steps) {
          if (step.name === "burn")             setStatus("burning");
          if (step.name === "fetchAttestation") setStatus("attesting");
          if (step.name === "mint")             setStatus("minting");
        }
      }

      if (result.state !== "success") {
        throw new Error(`Bridge ended with state: ${result.state}`);
      }

      setStatus("done");
      onBridged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bridge failed";
      setStepError(msg);
      setStatus("error");
    }
  }

  const busy = ["switching", "approving", "burning", "attesting", "minting"].includes(status);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-quiet w-full py-2.5 text-sm">
        Pay from Base, Arbitrum, Optimism, or Ethereum
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-paper/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Bridge USDC to Arc Testnet</p>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-muted transition hover:text-ink"
          disabled={busy}
        >
          Close
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Source chain</p>
        <div className="flex flex-wrap gap-2">
          {SOURCE_CHAINS.map((c) => (
            <button
              key={c.chainId}
              type="button"
              disabled={busy}
              onClick={() => setSelectedSource(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition duration-300 ease-spring ${
                selectedSource.chainId === c.chainId
                  ? "bg-accent text-accent-ink"
                  : "bg-accent-soft text-accent hover:bg-accent/20"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <dl className="space-y-1.5 rounded-xl bg-card p-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">From</dt>
          <dd className="font-medium">{selectedSource.label}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">To</dt>
          <dd className="font-medium">Arc Testnet</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Amount</dt>
          <dd className="amount font-semibold">{formatUsdc(invoiceAmount)} USDC</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Time</dt>
          <dd className="text-muted">~10–20 s (CCTP fast mode)</dd>
        </div>
      </dl>

      {busy && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-all duration-700 ease-spring"
              style={{
                width:
                  status === "switching" ? "15%" :
                  status === "approving" ? "30%" :
                  status === "burning"   ? "55%" :
                  status === "attesting" ? "75%" :
                  status === "minting"   ? "92%" : "100%",
              }}
            />
          </div>
          <p className="text-xs text-muted">{STATUS_LABEL[status]}</p>
        </div>
      )}

      {status === "done" && (
        <p className="rounded-xl bg-paid-soft px-3.5 py-2.5 text-sm font-medium text-paid">
          USDC bridged to Arc Testnet. Use the Pay button above to complete the invoice.
        </p>
      )}

      {stepError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {stepError}
        </p>
      )}

      {status !== "done" && (
        <button
          onClick={handleBridge}
          disabled={busy || !isConnected}
          className="btn-primary w-full py-3"
        >
          {!isConnected ? "Connect a wallet" : STATUS_LABEL[status]}
        </button>
      )}

      <p className="text-center text-xs text-muted">
        Powered by{" "}
        <a
          href="https://developers.circle.com/cctp"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-ink"
        >
          Circle CCTP
        </a>
        . Testnet only.
      </p>
    </div>
  );
}
