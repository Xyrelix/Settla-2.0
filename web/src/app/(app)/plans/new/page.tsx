import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@/components/Icons";
import { CreatePlanForm } from "@/components/CreatePlanForm";
import { SETTLA_V2_ADDRESS } from "@/lib/settlaV2";

export const metadata: Metadata = { title: "New subscription plan" };

const NEXT = [
  "You confirm one transaction to create the plan on Arc.",
  "Share the plan link — customers subscribe with one click.",
  "USDC is pulled automatically every interval, straight to your wallet.",
];

export default function NewPlan() {
  return (
    <div className="space-y-6">
      <Link
        href="/plans"
        className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted transition duration-300 ease-spring hover:text-ink"
      >
        <ArrowLeft className="size-4" stroke={1.75} /> Back to plans
      </Link>
      <div className="grid items-start gap-10 lg:grid-cols-[28rem_1fr] lg:gap-16">
        <section aria-labelledby="new-plan" className="card rise p-6 sm:p-8">
          <h1 id="new-plan" className="mb-6 font-display text-3xl font-semibold tracking-tight">
            Plan details
          </h1>
          {SETTLA_V2_ADDRESS ? (
            <CreatePlanForm />
          ) : (
            <p className="text-sm text-danger">
              Set <code>NEXT_PUBLIC_SETTLA_V2_ADDRESS</code> in <code>web/.env.local</code> to the deployed
              contract address, then restart the dev server.
            </p>
          )}
        </section>

        <aside className="rise space-y-5 [animation-delay:150ms] lg:pt-8">
          <h2 className="font-display text-xl font-semibold tracking-tight">How subscriptions work</h2>
          <ol className="max-w-sm space-y-4">
            {NEXT.map((step, i) => (
              <li key={step} className="flex gap-3.5">
                <span className="amount grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {i + 1}
                </span>
                <p className="pt-1 text-muted">{step}</p>
              </li>
            ))}
          </ol>
          <p className="max-w-sm rounded-xl bg-line/40 px-4 py-3 text-xs text-muted">
            Anyone can trigger a charge after the interval elapses. The subscriber&apos;s USDC allowance must
            cover each charge — if it runs out, the charge reverts and the subscription stays active.
          </p>
        </aside>
      </div>
    </div>
  );
}
