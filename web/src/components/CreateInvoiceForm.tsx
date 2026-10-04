"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseEventLogs, parseUnits } from "viem";
import { useArcTx } from "@/lib/useArcTx";
import {
  errorMessage,
  MAX_MEMO_BYTES,
  memoBytes,
  settlaAbi,
  SETTLA_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/settla";

const AMOUNT_RE = new RegExp(`^\\d+(\\.\\d{1,${USDC_DECIMALS}})?$`);

export function CreateInvoiceForm() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { send } = useArcTx();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = amount.trim();
  const amountValid = AMOUNT_RE.test(trimmed) && parseUnits(trimmed, USDC_DECIMALS) > 0n;
  const memoLen = memoBytes(memo);
  const memoValid = memoLen <= MAX_MEMO_BYTES;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!SETTLA_ADDRESS || !amountValid || !memoValid) return;
    setBusy(true);
    setError(null);
    try {
      const receipt = await send({
        address: SETTLA_ADDRESS,
        abi: settlaAbi,
        functionName: "createInvoice",
        args: [parseUnits(trimmed, USDC_DECIMALS), memo.trim()],
      });
      const [log] = parseEventLogs({ abi: settlaAbi, logs: receipt.logs, eventName: "InvoiceCreated" });
      if (!log) throw new Error("Invoice created, but its ID could not be read. Check the dashboard.");
      router.push(`/pay/${log.args.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Amount (USDC)</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="25.00"
          className={input}
        />
        {trimmed && !amountValid && (
          <span className="text-xs text-red-600">Enter a positive amount with up to 6 decimals.</span>
        )}
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">What is this for?</span>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Order #1042"
          className={input}
        />
        <span className={`text-xs ${memoValid ? "text-neutral-500" : "text-red-600"}`}>
          {memoLen}/{MAX_MEMO_BYTES}
        </span>
      </label>
      <button
        disabled={busy || !isConnected || !SETTLA_ADDRESS || !amountValid || !memoValid}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {busy ? "Creating..." : isConnected ? "Create invoice" : "Connect a wallet to create"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
