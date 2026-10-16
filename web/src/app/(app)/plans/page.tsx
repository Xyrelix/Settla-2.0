"use client";
import { useAccount, useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import { settlaV2Abi, SETTLA_V2_ADDRESS } from "@/lib/settlaV2";
import { PlanCard } from "@/components/PlanCard";
import { CtaLink } from "@/components/CtaLink";

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: boolean }) {
  return (
    <div className="card rise flex flex-col items-start gap-3 p-8 sm:p-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-md text-muted">{body}</p>
      {cta && (
        <div className="mt-2">
          <CtaLink href="/plans/new">Create your first plan</CtaLink>
        </div>
      )}
    </div>
  );
}

export default function PlansPage() {
  const { address, isConnected } = useAccount();

  const { data: planIds, isLoading, error } = useReadContract({
    address: SETTLA_V2_ADDRESS,
    abi: settlaV2Abi,
    functionName: "plansOf",
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: !!address && !!SETTLA_V2_ADDRESS },
  }) as { data: bigint[] | undefined; isLoading: boolean; error: Error | null };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Subscription plans</h1>
          {planIds && planIds.length > 0 && (
            <p className="text-muted">
              {planIds.length} {planIds.length === 1 ? "plan" : "plans"}, newest first
            </p>
          )}
        </div>
        {isConnected && <CtaLink href="/plans/new">New plan</CtaLink>}
      </div>

      {!isConnected && (
        <EmptyState
          title="Connect to see your plans"
          body="Your subscription plans live on Arc, tied to your wallet address."
        />
      )}
      {isConnected && isLoading && (
        <ul className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="card h-[5.5rem] animate-pulse opacity-60" />
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          Couldn&apos;t load your plans: {error.message.split("\n")[0]}
        </p>
      )}
      {planIds && planIds.length === 0 && (
        <EmptyState
          title="No plans yet"
          body="Create a subscription plan and share the link. Subscribers are billed automatically every interval."
          cta
        />
      )}
      {planIds && planIds.length > 0 && (
        <ul className="space-y-3">
          {[...planIds].reverse().map((id) => (
            <PlanCard key={id.toString()} planId={id} />
          ))}
        </ul>
      )}
    </div>
  );
}
