"use client";
import { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import { useArcTx } from "@/lib/useArcTx";
import {
  errorMessage,
  formatInterval,
  formatUsdc,
  settlaV2Abi,
  SETTLA_V2_ADDRESS,
  type PlanData,
} from "@/lib/settlaV2";

/** ↻ repeat icon — inline so no extra dep */
function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.5 8A5.5 5.5 0 0 1 13 5.5M13 5.5V3m0 2.5H10.5" />
      <path d="M13.5 8A5.5 5.5 0 0 1 3 10.5M3 10.5V13m0-2.5H5.5" />
    </svg>
  );
}

export function PlanCard({ planId }: { planId: bigint }) {
  const { address } = useAccount();
  const { send } = useArcTx();
  const [confirming, setConfirming] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: plan, refetch } = useReadContract({
    address: SETTLA_V2_ADDRESS,
    abi: settlaV2Abi,
    functionName: "getPlan",
    args: [planId],
    chainId: arc.id,
  }) as { data: PlanData | undefined; refetch: () => void };

  async function onDeactivate() {
    if (!SETTLA_V2_ADDRESS) return;
    setDeactivating(true);
    setError(null);
    try {
      await send({ address: SETTLA_V2_ADDRESS, abi: settlaV2Abi, functionName: "deactivatePlan", args: [planId] });
      await refetch();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeactivating(false);
      setConfirming(false);
    }
  }

  if (!plan) {
    return <li className="card h-[5.5rem] animate-pulse opacity-60" />;
  }

  const isMerchant = address?.toLowerCase() === plan.merchant.toLowerCase();
  const intervalSecs = Number(plan.interval);

  return (
    <li className="card overflow-hidden">
      {/* indigo left-border accent — visually separates plans from invoice cards */}
      <div className="flex">
        <span
          className="w-1 shrink-0 rounded-l-[1.75rem]"
          style={{ background: plan.active ? "var(--sub)" : "var(--line)" }}
          aria-hidden
        />
        <div className="min-w-0 flex-1 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="amount text-sm text-muted">Plan #{planId.toString()}</span>

                {/* Recurring badge — indigo, distinct from the green "Paid" badge */}
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{
                    background: plan.active ? "var(--sub-soft)" : "var(--line)",
                    color: plan.active ? "var(--sub)" : "var(--muted)",
                  }}
                >
                  <RepeatIcon className="size-3" />
                  {plan.active ? "Recurring" : "Inactive"}
                </span>
              </div>

              <p className="truncate font-medium">{plan.memo || <span className="text-muted">No note</span>}</p>

              <p className="text-xs text-muted">
                Every {formatInterval(intervalSecs)}
                {plan.maxCharges > 0 ? ` · ${plan.maxCharges} charges max` : " · unlimited"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="amount text-xl font-semibold">
                {formatUsdc(plan.amount)}{" "}
                <span className="font-sans text-xs font-semibold text-muted">USDC</span>
              </p>
              <div className="-mr-2.5 mt-1 flex items-center justify-end gap-0.5 text-sm">
                {confirming ? (
                  <>
                    <span className="px-1 text-muted">Deactivate?</span>
                    <button
                      onClick={onDeactivate}
                      disabled={deactivating}
                      className="min-h-10 rounded-full px-2.5 font-semibold text-danger disabled:opacity-50"
                    >
                      {deactivating ? "Deactivating…" : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={deactivating}
                      autoFocus
                      className="min-h-10 rounded-full px-2.5 text-muted hover:text-ink"
                    >
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/plans/${planId}`}
                      className="inline-flex min-h-10 items-center rounded-full px-2.5 font-medium underline-offset-4 hover:underline"
                      style={{ color: "var(--sub)" }}
                    >
                      View
                    </Link>
                    {plan.active && isMerchant && (
                      <button
                        onClick={() => setConfirming(true)}
                        className="min-h-10 rounded-full px-2.5 text-muted transition hover:text-danger"
                      >
                        Deactivate
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
