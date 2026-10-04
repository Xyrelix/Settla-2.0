"use client";
import { useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import { formatUsdc, settlaAbi, SETTLA_ADDRESS, Status } from "@/lib/settla";
import { PayButton } from "@/components/PayButton";
import { StatusBadge } from "@/components/InvoiceCard";

const noop = () => () => {};

export default function PayPage() {
  const { id: raw } = useParams<{ id: string }>();
  const validId = /^\d+$/.test(raw) && BigInt(raw) > 0n;
  const id = validId ? BigInt(raw) : 0n;

  const { address } = useAccount();
  const link = useSyncExternalStore(noop, () => window.location.href, () => "");
  const [copied, setCopied] = useState(false);

  const { data: inv, isLoading, error, refetch } = useReadContract({
    address: SETTLA_ADDRESS,
    abi: settlaAbi,
    functionName: "getInvoice",
    args: [id],
    chainId: arc.id,
    query: { enabled: validId && !!SETTLA_ADDRESS },
  });

  if (!validId || inv?.status === Status.None) {
    return <p className="text-neutral-600 dark:text-neutral-400">Invoice not found.</p>;
  }
  if (error) return <p className="text-sm text-red-600">Could not load invoice: {error.message.split("\n")[0]}</p>;
  if (isLoading || !inv) return <div className="h-64 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />;

  const isMerchant = address?.toLowerCase() === inv.merchant.toLowerCase();

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">Invoice #{id.toString()}</span>
          <StatusBadge status={inv.status} />
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight">{formatUsdc(inv.amount)}</p>
          <p className="text-sm text-neutral-500">USDC on Arc</p>
        </div>
        {inv.memo && <p className="text-lg">{inv.memo}</p>}
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Pay to</dt>
            <dd className="truncate font-mono">{inv.merchant}</dd>
          </div>
          {inv.status === Status.Paid && (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Paid by</dt>
              <dd className="truncate font-mono">{inv.payer}</dd>
            </div>
          )}
        </dl>

        {inv.status === Status.Open && !isMerchant && <PayButton id={id} amount={inv.amount} onPaid={() => refetch()} />}
        {inv.status === Status.Paid && (
          <p className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
            Paid on {new Date(Number(inv.paidAt) * 1000).toLocaleString()}.
          </p>
        )}
        {inv.status === Status.Cancelled && (
          <p className="rounded-md bg-neutral-100 p-3 text-sm dark:bg-neutral-800">The merchant cancelled this invoice.</p>
        )}
      </div>

      {isMerchant && inv.status === Status.Open && (
        <div className="space-y-2 rounded-xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
          <p className="text-sm font-medium">Share this link with your customer</p>
          <div className="flex gap-2">
            <input readOnly value={link} className="min-w-0 flex-1 rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs dark:bg-neutral-800" />
            <button onClick={copy} className="rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-neutral-500">
        Payments go directly to the merchant&apos;s wallet. Settla never holds funds.{" "}
        <a
          href={`${arc.blockExplorers.default.url}/address/${SETTLA_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          View contract
        </a>
      </p>
    </div>
  );
}
