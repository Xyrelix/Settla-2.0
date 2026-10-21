"use client";

import React, { useState } from "react";

const INVOICE_STEPS = [
  [
    "Enter an amount and a note",
    "Type what you're charging for and how much. No account needed — just connect your wallet.",
  ],
  [
    "Share the link or QR code",
    "Send it over WhatsApp, email, or show the QR at the counter. The link is all your customer needs.",
  ],
  [
    "Money lands in your wallet",
    "Your customer pays in USDC. The funds go straight from their wallet to yours — sub-second on Arc.",
  ],
];

const PLAN_STEPS = [
  [
    "Create a subscription plan",
    "Set the amount, billing interval (weekly, monthly, custom), and a description. One transaction to deploy.",
  ],
  [
    "Share the plan link or QR",
    "Send your customer the plan link. They open it and approve the subscription in one click.",
  ],
  [
    "Customer subscribes once",
    "The first charge happens immediately. The subscriber approves USDC spending once — that's it.",
  ],
  [
    "Charges happen automatically",
    "Anyone can trigger the charge after the interval elapses. The money goes straight to your wallet every cycle.",
  ],
];

export function HowItWorks() {
  const [tab, setTab] = useState<"invoice" | "plan">("invoice");
  const isInvoice = tab === "invoice";
  const steps = isInvoice ? INVOICE_STEPS : PLAN_STEPS;

  return (
    <section aria-labelledby="how" className="grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-16">
      {/* Left column */}
      <div className="reveal space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">How it works</p>
          <h2 id="how" className="font-display text-4xl font-semibold tracking-tight">
            {isInvoice ? "Invoice to payment in three steps." : "Subscriptions that run themselves."}
          </h2>
          <p className="text-muted">
            {isInvoice
              ? "If you can send a text message, you can send an invoice."
              : "Set it up once. The billing continues automatically, every interval, forever."}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex w-fit flex-col gap-2">
          <button
            onClick={() => setTab("invoice")}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200"
            style={{
              background: isInvoice ? "var(--accent-soft)" : "transparent",
              color: isInvoice ? "var(--accent-hover)" : "var(--muted)",
            }}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-xl text-base"
              style={{
                background: isInvoice ? "var(--accent)" : "var(--line)",
                color: isInvoice ? "var(--accent-ink)" : "var(--muted)",
              }}
            >
              ↗
            </span>
            <span className="font-semibold">One-off invoice</span>
          </button>

          <button
            onClick={() => setTab("plan")}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200"
            style={{
              background: !isInvoice ? "var(--sub-soft)" : "transparent",
              color: !isInvoice ? "var(--sub)" : "var(--muted)",
            }}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-xl text-base"
              style={{
                background: !isInvoice ? "var(--sub)" : "var(--line)",
                color: !isInvoice ? "#fff" : "var(--muted)",
              }}
            >
              ↻
            </span>
            <span className="font-semibold">
              Subscription plan{" "}
              <span
                className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider"
                style={{ background: "var(--sub)", color: "#fff" }}
              >
                2.0
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-8">
        {steps.map(([title, body], i) => {
          const accent = isInvoice ? "var(--accent)" : "var(--sub)";
          const accentSoft = isInvoice ? "var(--accent-soft)" : "var(--sub-soft)";
          const accentInk = isInvoice ? "var(--accent-hover)" : "var(--sub)";
          const isLast = i === steps.length - 1;

          return (
            <li key={title} className="reveal relative flex gap-5">
              {!isLast && (
                <span
                  aria-hidden
                  className="step-fill absolute -bottom-8 left-6 top-12 w-0.5 -translate-x-1/2 bg-line"
                  style={{ "--step-color": accent } as React.CSSProperties}
                />
              )}
              <span
                className="amount relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl text-xl font-semibold transition-colors duration-300"
                style={{ background: accentSoft, color: accentInk }}
              >
                {i + 1}
              </span>
              <div className="space-y-1 pt-1.5">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="max-w-lg text-muted">{body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
