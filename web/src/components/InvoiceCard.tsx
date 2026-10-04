"use client";
import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import { useArcTx } from "@/lib/useArcTx";
import { errorMessage, formatUsdc, settlaAbi, SETTLA_ADDRESS, Status, STATUS_LABEL } from "@/lib/settla";

const STATUS_STYLE: Record<number, string> = {
  [Status.Open]: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  [Status.Paid]: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  [Status.Cancelled]: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

export function StatusBadge({ status }: { status: number }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? ""}`}>
      {STATUS_LABEL[status] ?? "Unknown"}
    </span>
  );
}

export function InvoiceCard({ id }: { id: bigint }) {
  const { send } = useArcTx();
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
    if (!SETTLA_ADDRESS || !confirm(`Cancel invoice #${id}? This cannot be undone.`)) return;
    setCancelling(true);
    setError(null);
    try {
      await send({ address: SETTLA_ADDRESS, abi: settlaAbi, functionName: "cancel", args: [id] });
      await refetch();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  if (!inv) {
    return <li className="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />;
  }

  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">#{id.toString()}</span>
            <StatusBadge status={inv.status} />
          </div>
          <p className="mt-1 truncate">{inv.memo || <span className="text-neutral-500">No memo</span>}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Created {new Date(Number(inv.createdAt) * 1000).toLocaleString()}
            {inv.status === Status.Paid && ` · Paid ${new Date(Number(inv.paidAt) * 1000).toLocaleString()}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold">{formatUsdc(inv.amount)} USDC</p>
          <div className="mt-2 flex justify-end gap-3 text-sm">
            <Link href={`/pay/${id}`} className="underline underline-offset-2">
              View
            </Link>
            {inv.status === Status.Open && (
              <button onClick={onCancel} disabled={cancelling} className="text-red-600 disabled:opacity-50">
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}
