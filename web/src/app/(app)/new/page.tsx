import type { Metadata } from "next";
import Link from "next/link";
import { CreateInvoiceForm } from "@/components/CreateInvoiceForm";
import { SETTLA_ADDRESS } from "@/lib/settla";

export const metadata: Metadata = { title: "New invoice" };

const NEXT = [
  "You confirm one transaction in your wallet.",
  "You get a pay link and a QR code to share.",
  "Your customer pays, and the USDC lands in your wallet.",
];

export default function NewInvoice() {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition duration-300 ease-spring hover:text-ink"
      >
        <span aria-hidden>←</span> Back to dashboard
      </Link>
      <div className="grid items-start gap-10 lg:grid-cols-[28rem_1fr] lg:gap-16">
        <section aria-labelledby="new-invoice" className="card rise p-6 sm:p-8">
          <h1
            id="new-invoice"
            className="mb-6 font-display text-3xl font-semibold tracking-tight"
          >
            Invoice details
          </h1>
          {SETTLA_ADDRESS ? (
            <CreateInvoiceForm />
          ) : (
            <p className="text-sm text-danger">
              Set <code>NEXT_PUBLIC_SETTLA_ADDRESS</code> in{" "}
              <code>web/.env.local</code> to the deployed contract address, then
              restart the dev server.
            </p>
          )}
        </section>

        <aside className="rise space-y-5 [animation-delay:150ms] lg:pt-8">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            What happens next
          </h2>
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
        </aside>
      </div>
    </div>
  );
}
