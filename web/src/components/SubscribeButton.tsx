"use client";
import { useState } from "react";
import { useAccount, useConfig, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { erc20Abi } from "viem";
import { arc } from "@/lib/arc";
import { useArcTx } from "@/lib/useArcTx";
import {
  errorMessage,
  formatUsdc,
  settlaV2Abi,
  SETTLA_V2_ADDRESS,
  USDC_ADDRESS,
} from "@/lib/settlaV2";

type SubStatus = "idle" | "approving" | "subscribing" | "done" | "error";

export function SubscribeButton({
  planId,
  amount,
  onSubscribed,
}: {
  planId: bigint;
  amount: bigint;
  onSubscribed?: () => void;
}) {
  const config = useConfig();
  const { address, isConnected } = useAccount();
  const { send } = useArcTx();
  const [status, setStatus] = useState<SubStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: !!address },
  });
  const insufficient = balance !== undefined && balance < amount;

  async function onSubscribe() {
    if (!address || !SETTLA_V2_ADDRESS) return;
    setError(null);
    try {
      const allowance = await readContract(config, {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, SETTLA_V2_ADDRESS],
        chainId: arc.id,
      });
      // Subscribe pulls first charge immediately; ensure allowance covers it
      if (allowance < amount) {
        setStatus("approving");
        await send({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          // Approve a large allowance so future charges don't need re-approvals
          args: [SETTLA_V2_ADDRESS, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")],
        });
      }

      setStatus("subscribing");
      await send({ address: SETTLA_V2_ADDRESS, abi: settlaV2Abi, functionName: "subscribe", args: [planId] });
      setStatus("done");
      onSubscribed?.();
    } catch (err) {
      setError(errorMessage(err));
      setStatus("error");
    }
  }

  const busy = status === "approving" || status === "subscribing";

  return (
    <div className="space-y-3">
      <button
        onClick={onSubscribe}
        aria-live="polite"
        disabled={!isConnected || busy || status === "done" || insufficient}
        className="btn-primary w-full py-3.5 text-lg"
      >
        {!isConnected && "Connect a wallet to subscribe"}
        {isConnected && status === "idle" && `Subscribe — ${formatUsdc(amount)} USDC now`}
        {status === "approving" && "Approving USDC (step 1 of 2)…"}
        {status === "subscribing" && "Subscribing…"}
        {status === "done" && "Subscribed"}
        {isConnected && status === "error" && "Try again"}
      </button>
      {insufficient && status !== "done" && (
        <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          Your wallet holds {formatUsdc(balance ?? 0n)} USDC, which isn&apos;t enough for the first charge.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      {isConnected && status === "idle" && !insufficient && (
        <p className="text-center text-xs text-muted">
          First-time subscribers sign twice: once to allow USDC, once to subscribe.
        </p>
      )}
    </div>
  );
}
