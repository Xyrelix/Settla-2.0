"use client";
import { useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arc } from "@/lib/arc";

const noop = () => () => {};


export function ConnectButton() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  // Wallet state only exists in the browser; render a stable placeholder until mounted.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  if (!mounted) return <div className="h-10 w-36" />;

  if (!isConnected) {
    const connector = connectors[0];
    return (
      <div className="flex flex-col items-end">
        <button
          onClick={() => connector && connect({ connector, chainId: arc.id })}
          disabled={!connector || isPending}
          className="btn-primary px-4 py-2 text-sm"
        >
          {isPending ? (
            "Connecting…"
          ) : (
            <span>
              Connect<span className="hidden min-[400px]:inline">&nbsp;wallet</span>
            </span>
          )}
        </button>
        {error && <span role="alert" className="mt-1 max-w-56 text-right text-xs text-danger">{error.message.split("\n")[0]}</span>}
      </div>
    );
  }

  if (chainId !== arc.id) {
    return (
      <button
        onClick={() => switchChain({ chainId: arc.id })}
        disabled={switching}
        className="btn bg-accent-soft px-4 py-2 text-sm text-accent hover:bg-accent hover:text-accent-ink"
      >
        {switching ? "Switching…" : `Switch to ${arc.name}`}
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      title="Disconnect"
      aria-label={`Connected as ${address}. Disconnect`}
      className="btn-quiet px-4 py-2 font-mono text-sm font-medium"
    >
      <span aria-hidden className="size-2 rounded-full bg-paid" />
      {address!.slice(0, 6)}…{address!.slice(-4)}
    </button>
  );
}
