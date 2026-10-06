"use client";
import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import { useArcTx } from "@/lib/useArcTx";
import { errorMessage, formatUsdc, settlaAbi, SETTLA_ADDRESS, Status, STATUS_LABEL } from "@/lib/settla";

const STATUS_STYLE: Record<number, string> = {
  [Status.Open]: "bg-accent-soft text-accent-hover",
  [Status.Paid]: "bg-paid-soft text-paid",
  [Status.Cancelled]: "bg-line/60 text-muted",
};

export function StatusBadge({ status }: { status: number }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? ""}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status] ?? "Unknown"}
    </span>
  );
}

const date = (secs: bigint) =>
  new Date(Number(secs) * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function InvoiceCard({ id }: { id: bigint }) {
  const { send } = useArcTx();
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: inv, refetch } = useReadContract({
    address: SETTLA_ADDRESS,
    abi: settlaAbi,
    functionName: "getInvoice",
    args: [id],
    chainId: arc.id,
  });

  async function onCancel() {
    if (!SETTLA_ADDRESS) return;
    setCancelling(true);
    setError(null);
    try {
      await send({ address: SETTLA_ADDRESS, abi: settlaAbi, functionName: "cancel", args: [id] });
      await refetch();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCancelling(false);
      setConfirming(false);
    }
  }

  if (!inv) {
    return <li className="card h-[5.5rem] animate-pulse opacity-60" />;
  }

  return (
    <li className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="amount text-sm text-muted">#{id.toString()}</span>
            <StatusBadge status={inv.status} />
          </div>
          <p className="truncate font-medium">{inv.memo || <span className="text-muted">No note</span>}</p>
          <p className="text-xs text-muted">
            {date(inv.createdAt)}
            {inv.status === Status.Paid && ` · paid ${date(inv.paidAt)}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="amount text-xl font-semibold">
            {formatUsdc(inv.amount)} <span className="font-sans text-xs font-semibold text-muted">USDC</span>
          </p>
          <div className="-mr-2.5 mt-1 flex items-center justify-end gap-0.5 text-sm">
            {confirming ? (
              <>
                <span className="px-1 text-muted">Cancel it?</span>
                <button onClick={onCancel} disabled={cancelling} className="min-h-10 rounded-full px-2.5 font-semibold text-danger disabled:opacity-50">
                  {cancelling ? "Cancelling…" : "Yes, cancel"}
                </button>
                {/* The Cancel button that had focus is gone; land keyboard users on the safe choice. */}
                <button
                  onClick={() => setConfirming(false)}
                  disabled={cancelling}
                  autoFocus
                  className="min-h-10 rounded-full px-2.5 text-muted hover:text-ink"
                >
                  Keep
                </button>
              </>
            ) : (
              <>
                <Link href={`/pay/${id}`} className="inline-flex min-h-10 items-center rounded-full px-2.5 font-medium text-accent underline-offset-4 hover:underline">
                  View
                </Link>
                {inv.status === Status.Open && (
                  <button onClick={() => setConfirming(true)} className="min-h-10 rounded-full px-2.5 text-muted transition hover:text-danger">
                    Cancel
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
    </li>
  );
}
