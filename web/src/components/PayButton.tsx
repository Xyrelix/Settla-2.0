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
    <div className="space-y-2">
      <button
        onClick={onPay}
        disabled={!isConnected || busy || status === "done" || insufficient}
        className="w-full rounded-md bg-neutral-900 px-4 py-3 font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {!isConnected && "Connect a wallet to pay"}
        {isConnected && status === "idle" && `Pay ${formatUsdc(amount)} USDC`}
        {status === "approving" && "Approving USDC (1/2)..."}
        {status === "paying" && "Settling..."}
        {status === "done" && "Paid"}
        {isConnected && status === "error" && "Failed. Retry"}
      </button>
      {insufficient && status !== "done" && (
        <p className="text-sm text-red-600">
          Your wallet holds {formatUsdc(balance)} USDC, less than this invoice. Keep some extra for gas.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
