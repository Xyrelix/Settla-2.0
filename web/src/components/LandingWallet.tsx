"use client";
import { useRouter } from "next/navigation";
import { useAccount, useAccountEffect, useConnect } from "wagmi";
import { arc } from "@/lib/arc";

/**
 * Landing-page wallet button. It always reads "Connect wallet": a fresh connect goes
 * straight to the dashboard, and if a wallet is already connected it just goes there.
 */
export function LandingWallet() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();

  useAccountEffect({
    onConnect({ isReconnected }) {
      if (!isReconnected) router.push("/dashboard");
    },
  });

  function onClick() {
    if (isConnected) return router.push("/dashboard");
    const connector = connectors[0];
    if (connector) connect({ connector, chainId: arc.id });
  }

  return (
    <div className="flex flex-col items-end">
      <button onClick={onClick} disabled={isPending} className="btn-primary px-4 py-2 text-sm">
        {isPending ? (
          "Connecting…"
        ) : (
          <span>
            Connect<span className="hidden min-[400px]:inline">&nbsp;wallet</span>
          </span>
        )}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-56 text-right text-xs text-danger">
          {error.message.split("\n")[0]}
        </span>
      )}
    </div>
  );
}
