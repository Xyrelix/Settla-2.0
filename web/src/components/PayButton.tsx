"use client";
import { useState } from "react";
import { useAccount, useConfig, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { erc20Abi } from "viem";
import { arc } from "@/lib/arc";
import { useArcTx } from "@/lib/useArcTx";
import { errorMessage, formatUsdc, settlaAbi, SETTLA_ADDRESS, USDC_ADDRESS } from "@/lib/settla";

type PayStatus = "idle" | "approving" | "paying" | "done" | "error";

export function PayButton({ id, amount, onPaid }: { id: bigint; amount: bigint; onPaid?: () => void }) {
  const config = useConfig();
  const { address, isConnected } = useAccount();
  const { send } = useArcTx();
  const [status, setStatus] = useState<PayStatus>("idle");
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

  async function onPay() {
    if (!address || !SETTLA_ADDRESS) return;
    setError(null);
    try {
      const allowance = await readContract(config, {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, SETTLA_ADDRESS],
        chainId: arc.id,
      });
      if (allowance < amount) {
        setStatus("approving");
        await send({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [SETTLA_ADDRESS, amount],
        });
      }

      setStatus("paying");
      await send({ address: SETTLA_ADDRESS, abi: settlaAbi, functionName: "pay", args: [id] });
      setStatus("done");
      onPaid?.();
    } catch (err) {
      setError(errorMessage(err));
      setStatus("error");
    }
  }

  const busy = status === "approving" || status === "paying";

  return (
    <div className="space-y-3">
      <button
        onClick={onPay}
        aria-live="polite"
        disabled={!isConnected || busy || status === "done" || insufficient}
        className="btn-primary w-full py-3.5 text-lg"
      >
        {!isConnected && "Connect a wallet to pay"}
        {isConnected && status === "idle" && `Pay ${formatUsdc(amount)} USDC`}
        {status === "approving" && "Approving USDC (step 1 of 2)…"}
        {status === "paying" && "Paying…"}
        {status === "done" && "Paid"}
        {isConnected && status === "error" && "Try again"}
      </button>
      {insufficient && status !== "done" && (
        <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-danger">
          Your wallet holds {formatUsdc(balance)} USDC, which isn&apos;t enough for this invoice. Keep a little
          extra for the network fee.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      {isConnected && status === "idle" && !insufficient && (
        <p className="text-center text-xs text-muted">First-time payers sign twice: once to allow USDC, once to pay.</p>
      )}
    </div>
  );
}
