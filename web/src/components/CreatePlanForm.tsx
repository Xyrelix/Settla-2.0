"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseEventLogs, parseUnits } from "viem";
import { useArcTx } from "@/lib/useArcTx";
import {
  errorMessage,
  formatInterval,
  INTERVAL_PRESETS,
  MAX_MEMO_BYTES,
  memoBytes,
  MIN_INTERVAL_SECONDS,
  settlaV2Abi,
  SETTLA_V2_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/settlaV2";

const AMOUNT_RE = new RegExp(`^\\d+(\\.\\d{1,${USDC_DECIMALS}})?$`);

export function CreatePlanForm() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { send } = useArcTx();

  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [intervalSecs, setIntervalSecs] = useState(INTERVAL_PRESETS[1].seconds); // weekly default
  const [customInterval, setCustomInterval] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [maxCharges, setMaxCharges] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const trimmedAmount = amount.trim();
  const amountValid = AMOUNT_RE.test(trimmedAmount) && parseUnits(trimmedAmount, USDC_DECIMALS) > 0n;
  const memoLen = memoBytes(memo);
  const memoValid = memoLen <= MAX_MEMO_BYTES;
  const effectiveInterval = useCustom ? parseInt(customInterval || "0", 10) : intervalSecs;
  const intervalValid = effectiveInterval >= MIN_INTERVAL_SECONDS;
  const maxChargesNum = parseInt(maxCharges || "0", 10);
  const maxChargesValid = !isNaN(maxChargesNum) && maxChargesNum >= 0;
  const showAmountError = (submitted || !!trimmedAmount) && !amountValid;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!amountValid || !memoValid || !intervalValid || !maxChargesValid) return;
    if (!SETTLA_V2_ADDRESS) return;
    setBusy(true);
    setError(null);
    try {
      const receipt = await send({
        address: SETTLA_V2_ADDRESS,
        abi: settlaV2Abi,
        functionName: "createPlan",
        args: [
          parseUnits(trimmedAmount, USDC_DECIMALS),
          BigInt(effectiveInterval),
          maxChargesNum,
          memo.trim(),
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logs = parseEventLogs({ abi: settlaV2Abi as any, logs: receipt.logs, eventName: "PlanCreated" });
      const log = logs[0];
      if (!log) throw new Error("Plan created, but its ID could not be read. Check the dashboard.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/plans/${(log as any).args.planId}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Amount */}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Amount per charge</span>
        <div className="relative">
          <input
            name="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder="9.99"
            aria-invalid={showAmountError}
            className="field amount pr-16 text-2xl"
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm font-semibold text-muted">
            USDC
          </span>
        </div>
        <span aria-live="polite" className="block text-sm text-danger empty:hidden">
          {showAmountError && "Enter an amount above zero, with up to 6 decimals."}
        </span>
      </label>

      {/* Billing interval */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Billing interval</legend>
        <div className="flex flex-wrap gap-2">
          {INTERVAL_PRESETS.map((p) => (
            <button
              key={p.seconds}
              type="button"
              onClick={() => { setUseCustom(false); setIntervalSecs(p.seconds); }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition duration-300 ease-spring ${
                !useCustom && intervalSecs === p.seconds
                  ? "bg-accent text-accent-ink"
                  : "bg-accent-soft text-accent hover:bg-accent/20"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition duration-300 ease-spring ${
              useCustom ? "bg-accent text-accent-ink" : "bg-accent-soft text-accent hover:bg-accent/20"
            }`}
          >
            Custom
          </button>
        </div>
        {useCustom && (
          <div className="flex items-center gap-2">
            <input
              name="customInterval"
              value={customInterval}
              onChange={(e) => setCustomInterval(e.target.value)}
              inputMode="numeric"
              placeholder="seconds"
              className="field w-36"
            />
            <span className="text-sm text-muted">
              {effectiveInterval >= MIN_INTERVAL_SECONDS
                ? `= ${formatInterval(effectiveInterval)}`
                : "min 60 s"}
            </span>
          </div>
        )}
        {submitted && !intervalValid && (
          <p className="text-sm text-danger">Interval must be at least 60 seconds.</p>
        )}
      </fieldset>

      {/* Max charges */}
      <label className="block space-y-1.5">
        <span className="flex items-center justify-between text-sm">
          <span className="font-medium">Max charges</span>
          <span className="text-muted">{maxChargesNum === 0 ? "Unlimited" : `${maxChargesNum} charges`}</span>
        </span>
        <input
          name="maxCharges"
          value={maxCharges}
          onChange={(e) => setMaxCharges(e.target.value)}
          inputMode="numeric"
          placeholder="0 = unlimited"
          className="field"
        />
        <span className="text-xs text-muted">Set to 0 for an ongoing subscription with no charge limit.</span>
      </label>

      {/* Memo */}
      <label className="block space-y-1.5">
        <span className="flex justify-between text-sm">
          <span className="font-medium">What&apos;s it for?</span>
          <span className={`amount ${memoValid ? "text-muted" : "text-danger"}`}>
            {memoLen}/{MAX_MEMO_BYTES}
          </span>
        </span>
        <input
          name="memo"
          autoComplete="off"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Weekly bakery box…"
          aria-invalid={!memoValid}
          className="field"
        />
        <span className="text-xs text-muted">Visible on-chain. No names or contact details.</span>
      </label>

      <button
        disabled={busy || !isConnected || !SETTLA_V2_ADDRESS}
        className="btn-primary w-full py-3"
      >
        {busy ? "Creating plan…" : isConnected ? "Create subscription plan" : "Connect a wallet to start"}
      </button>
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
