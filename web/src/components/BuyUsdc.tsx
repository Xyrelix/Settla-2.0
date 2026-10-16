"use client";
/**
 * BuyUsdc — fiat onramp placeholder for the Circle Onramp Kit.
 *
 * The Onramp Kit (@circle-fin/onramp-kit) is currently in private beta.
 * Once you have a Kit Key from Circle, replace this component with the full
 * integration from the onramp-kit skill (createOnrampServerKit server route +
 * createOnrampKit().mountIframe on the client).
 *
 * To get access: reach out to your Circle contact and ask for Onramp Kit beta access.
 * You will need a Cloudsmith registry key + package version to install the package.
 */
import { useState } from "react";
import { formatUsdc } from "@/lib/settla";

interface Props {
  /** The invoice amount in USDC raw units (6 decimals). Passed as a hint to the onramp widget. */
  invoiceAmount: bigint;
}

export function BuyUsdc({ invoiceAmount }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-quiet w-full py-2.5 text-sm"
      >
        Don&apos;t have USDC? Buy with card or bank transfer
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-paper/60 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold">Buy USDC to pay this invoice</p>
          <p className="text-sm text-muted">
            You need{" "}
            <span className="amount font-semibold text-ink">{formatUsdc(invoiceAmount)} USDC</span>{" "}
            to pay this invoice. Buy it with a card, Apple Pay, or bank transfer.
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="shrink-0 text-xs text-muted hover:text-ink transition"
        >
          Close
        </button>
      </div>

      {/* Onramp Kit widget mounts here once integrated */}
      <div className="rounded-xl bg-accent-soft/40 border border-accent/20 px-4 py-4 space-y-2">
        <p className="text-sm font-semibold text-accent">Onramp coming soon</p>
        <p className="text-sm text-muted">
          The Circle Onramp Kit is in private beta. Once a Kit Key is configured, a
          card/bank widget will appear here so customers can buy USDC without leaving this page.
        </p>
        <p className="text-xs text-muted">
          In the meantime, you can get USDC from{" "}
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-accent"
          >
            Circle&apos;s testnet faucet
          </a>{" "}
          (testnet) or a DEX / CEX (mainnet).
        </p>
      </div>

      <p className="text-center text-xs text-muted">
        Powered by Circle Onramp Kit &mdash; debit, Apple Pay, Google Pay, bank transfer.
      </p>
    </div>
  );
}
