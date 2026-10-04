"use client";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import { settlaAbi, SETTLA_ADDRESS } from "@/lib/settla";
import { InvoiceCard } from "@/components/InvoiceCard";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: ids, isLoading, error } = useReadContract({
    address: SETTLA_ADDRESS,
    abi: settlaAbi,
    functionName: "invoicesOf",
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: !!address && !!SETTLA_ADDRESS },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your invoices</h1>
        <Link
          href="/"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          New invoice
        </Link>
      </div>

      {!isConnected && <p className="text-neutral-600 dark:text-neutral-400">Connect your wallet to see your invoices.</p>}
      {isConnected && isLoading && <p className="text-neutral-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">Could not load invoices: {error.message.split("\n")[0]}</p>}
      {ids && ids.length === 0 && (
        <p className="text-neutral-600 dark:text-neutral-400">No invoices yet. Create your first one.</p>
      )}
      {ids && ids.length > 0 && (
        <ul className="space-y-3">
          {[...ids].reverse().map((id) => (
            <InvoiceCard key={id.toString()} id={id} />
          ))}
        </ul>
      )}
    </div>
  );
}
