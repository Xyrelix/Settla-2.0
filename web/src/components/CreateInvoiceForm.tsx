"use client";
import { useRef, useState } from "react";
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
  const [submitted, setSubmitted] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);

  const trimmed = amount.trim();
  const amountValid = AMOUNT_RE.test(trimmed) && parseUnits(trimmed, USDC_DECIMALS) > 0n;
  const memoLen = memoBytes(memo);
  const memoValid = memoLen <= MAX_MEMO_BYTES;
  const showAmountError = (submitted || !!trimmed) && !amountValid;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!amountValid) return amountRef.current?.focus();
    if (!memoValid) return memoRef.current?.focus();
    if (!SETTLA_ADDRESS) return;
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

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Amount</span>
        <div className="relative">
          <input
            ref={amountRef}
            name="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder="25.00"
            aria-invalid={showAmountError}
            aria-describedby="amount-error"
            className="field amount pr-16 text-2xl"
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm font-semibold text-muted">
            USDC
          </span>
        </div>
        <span id="amount-error" aria-live="polite" className="block text-sm text-danger empty:hidden">
          {showAmountError && "Enter an amount above zero, with up to 6 decimals."}
        </span>
      </label>
      <label className="block space-y-1.5">
        <span className="flex justify-between text-sm">
          <span className="font-medium">What&apos;s it for?</span>
          <span className={`amount ${memoValid ? "text-muted" : "text-danger"}`}>
            {memoLen}/{MAX_MEMO_BYTES}
          </span>
        </span>
        <input
          ref={memoRef}
          name="memo"
          autoComplete="off"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="2 loaves of sourdough…"
          aria-invalid={!memoValid}
          aria-describedby="memo-hint"
          className="field"
        />
        <span id="memo-hint" className="block text-xs text-muted">Visible to anyone on-chain. Skip names and contact details.</span>
      </label>
      <button
        disabled={busy || !isConnected || !SETTLA_ADDRESS}
        className="btn-primary w-full py-3"
      >
        {busy ? "Creating invoice…" : isConnected ? "Create invoice" : "Connect a wallet to start"}
      </button>
      {error && (
        <p role="alert" className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
