"use client";
import { useAccount, useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import { settlaAbi, SETTLA_ADDRESS } from "@/lib/settla";
import { InvoiceCard } from "@/components/InvoiceCard";
import { CtaLink } from "@/components/CtaLink";

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: boolean }) {
  return (
    <div className="card rise flex flex-col items-start gap-3 p-8 sm:p-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-md text-muted">{body}</p>
      {cta && (
        <div className="mt-2">
          <CtaLink href="/new">Create your first invoice</CtaLink>
        </div>
      )}
    </div>
  );
}

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
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Your invoices</h1>
          {ids && ids.length > 0 && (
            <p className="text-muted">
              {ids.length} {ids.length === 1 ? "invoice" : "invoices"}, newest first
            </p>
          )}
        </div>
        {isConnected && (
          <CtaLink href="/new">New invoice</CtaLink>
        )}
      </div>

      {!isConnected && (
        <EmptyState
          title="Connect to see your invoices"
          body="Your invoices live on Arc, tied to your wallet address. Connect the wallet you invoice from."
        />
      )}
      {isConnected && isLoading && (
        <ul className="space-y-3" aria-busy="true" aria-label="Loading invoices…">
          {[0, 1, 2].map((i) => (
            <li key={i} className="card h-[5.5rem] animate-pulse opacity-60" />
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-danger">
          Couldn&apos;t load your invoices: {error.message.split("\n")[0]} Refresh the page to try again.
        </p>
      )}
      {ids && ids.length === 0 && (
        <EmptyState
          title="No invoices yet"
          body="Create one, share the link or QR code, and it shows up here with its status."
          cta
        />
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
