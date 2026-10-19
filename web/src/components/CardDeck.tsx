"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { StatusBadge } from "@/components/InvoiceCard";
import { GlobeBackdrop } from "@/components/GlobeBackdrop";
import { Status } from "@/lib/settla";

/**
 * Two cards held like a hand of playing cards.
 * - At rest: the subscription card (indigo) peeks behind the invoice card (terracotta),
 *   slightly rotated left.
 * - On hover / focus-within: they fan apart — invoice rotates right, plan rotates left.
 * - Each card is a link to its creation page.
 */
export function CardDeck() {
  const deckRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={deckRef}
      aria-hidden
      className="rise relative mx-auto w-full max-w-sm select-none py-10 [animation-delay:350ms]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <GlobeBackdrop className="pointer-events-none absolute left-[68%] top-[30%] -z-10 size-[min(34rem,120vw)] -translate-x-1/2 -translate-y-1/2 text-accent opacity-60" />

      {/* ── SUBSCRIPTION CARD (back / left) ── */}
      <Link
        href="/plans/new"
        tabIndex={-1}
        className="card-back card block overflow-hidden"
        style={{
          transform: hovered
            ? "rotate(-14deg) translateX(-12%) translateY(-4%)"
            : "rotate(-6deg) translateX(-4%) translateY(2%)",
          opacity: hovered ? 1 : 0.82,
          zIndex: hovered ? 0 : 0,
        }}
      >
        {/* Indigo header band */}
        <div
          className="space-y-4 p-7"
          style={{ background: "var(--sub-soft)" }}
        >
          <div className="flex items-center justify-between">
            <span className="amount text-sm" style={{ color: "var(--sub)" }}>
              Plan #007
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold"
              style={{ background: "var(--sub-border)", color: "#fff", opacity: 0.9 }}
            >
              {/* repeat icon */}
              <svg className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2.5 8A5.5 5.5 0 0 1 13 5.5M13 5.5V3m0 2.5H10.5" />
                <path d="M13.5 8A5.5 5.5 0 0 1 3 10.5M3 10.5V13m0-2.5H5.5" />
              </svg>
              Recurring
            </span>
          </div>
          <div className="space-y-1">
            <p className="font-medium" style={{ color: "var(--sub)" }}>Pro membership</p>
            <p className="amount text-5xl font-semibold leading-none" style={{ color: "var(--sub)" }}>
              9.99
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--sub)", opacity: 0.65 }}>
              USDC / month on Arc
            </p>
          </div>
        </div>
        <div className="relative h-0 border-t-2 border-dashed border-line">
          <span className="absolute -left-3 -top-3 size-6 rounded-full bg-paper" />
          <span className="absolute -right-3 -top-3 size-6 rounded-full bg-paper" />
        </div>
        <div className="space-y-2 p-7 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Interval</span>
            <span className="font-medium">Monthly</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Max charges</span>
            <span className="font-medium">Unlimited</span>
          </div>
          <div className="mt-3 rounded-xl px-4 py-2.5 text-xs font-medium"
            style={{ background: "var(--sub-soft)", color: "var(--sub)" }}>
            Charged automatically every interval
          </div>
        </div>
      </Link>

      {/* ── INVOICE CARD (front / right) ── */}
      <Link
        href="/new"
        tabIndex={-1}
        className="card-front card block overflow-hidden"
        style={{
          transform: hovered
            ? "rotate(8deg) translateX(8%) translateY(-4%)"
            : "rotate(2deg)",
          zIndex: 1,
        }}
      >
        <div className="space-y-5 p-7">
          <div className="flex items-center justify-between">
            <span className="amount text-sm text-muted">Invoice #1042</span>
            <span className="grid justify-items-end">
              <span className="receipt-leave col-start-1 row-start-1">
                <StatusBadge status={Status.Open} />
              </span>
              <span className="receipt-enter col-start-1 row-start-1">
                <StatusBadge status={Status.Paid} />
              </span>
            </span>
          </div>
          <div className="space-y-1.5">
            <p className="font-medium">Sourdough loaf &amp; 2 flat whites</p>
            <p className="amount text-5xl font-semibold leading-none">18.50</p>
            <p className="text-sm font-semibold text-muted">USDC on Arc</p>
          </div>
        </div>
        <div className="relative h-0 border-t-2 border-dashed border-line">
          <span className="absolute -left-3 -top-3 size-6 rounded-full bg-paper" />
          <span className="absolute -right-3 -top-3 size-6 rounded-full bg-paper" />
        </div>
        <div className="space-y-3 p-7 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Pay to</span>
            <span className="font-mono">0x7a3F…c91E</span>
          </div>
          <div className="grid">
            <div className="receipt-pending col-start-1 row-start-1 space-y-2 rounded-xl bg-accent-soft px-4 py-2.5">
              <p className="font-medium text-accent-hover">Customer is paying…</p>
              <div className="h-1 overflow-hidden rounded-full bg-accent/15">
                <div className="receipt-bar h-full rounded-full bg-accent" />
              </div>
            </div>
            <p className="receipt-enter col-start-1 row-start-1 self-center rounded-xl bg-paid-soft px-4 py-2.5 font-medium text-paid">
              Paid 0.8 seconds after scanning.
            </p>
          </div>
        </div>
      </Link>

      {/* Hover hint label */}
      <p
        className="mt-4 text-center text-xs transition-opacity duration-300"
        style={{ color: "var(--muted)", opacity: hovered ? 0 : 0.6 }}
      >
        Hover to see both
      </p>
    </div>
  );
}
