"use client";
import { useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arc } from "@/lib/arc";

const noop = () => () => {};

const btn =
  "rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50";

export function ConnectButton() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  // Wallet state only exists in the browser; render a stable placeholder until mounted.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  if (!mounted) return <div className="h-8 w-28" />;

  if (!isConnected) {
    const connector = connectors[0];
    return (
      <div className="flex flex-col items-end">
        <button
          onClick={() => connector && connect({ connector, chainId: arc.id })}
          disabled={!connector || isPending}
          className={`${btn} bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200`}
        >
          {isPending ? "Connecting..." : "Connect wallet"}
        </button>
        {error && <span className="mt-1 text-xs text-red-600">{error.message.split("\n")[0]}</span>}
      </div>
    );
  }

  if (chainId !== arc.id) {
    return (
      <button
        onClick={() => switchChain({ chainId: arc.id })}
        disabled={switching}
        className={`${btn} bg-amber-500 text-white hover:bg-amber-600`}
      >
        {switching ? "Switching..." : "Switch to Arc"}
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      title="Disconnect"
      className={`${btn} border border-neutral-300 font-mono hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900`}
    >
      {address!.slice(0, 6)}…{address!.slice(-4)}
    </button>
  );
}
