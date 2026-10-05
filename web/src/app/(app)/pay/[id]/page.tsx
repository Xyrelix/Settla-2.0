"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import { formatUsdc, settlaAbi, SETTLA_ADDRESS, Status } from "@/lib/settla";
import { PayButton } from "@/components/PayButton";
import { StatusBadge } from "@/components/InvoiceCard";
import { Check, Copy } from "@/components/Icons";

const noop = () => () => {};
const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-md space-y-3">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted">{body}</p>
      <Link href="/" className="btn-quiet">
        Back to Settla
      </Link>
    </div>
  );
}

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
    return <Message title="We couldn't find that invoice" body="Check the link with whoever sent it to you." />;
  }
  if (error) {
    return <Message title="Couldn't load this invoice" body={`${error.message.split("\n")[0]} Try refreshing.`} />;
  }
  if (isLoading || !inv) {
    return (
      <div className="card mx-auto h-96 max-w-md animate-pulse opacity-60" aria-busy="true">
        <span className="sr-only">Loading invoice…</span>
      </div>
    );
  }

  const isMerchant = address?.toLowerCase() === inv.merchant.toLowerCase();
  const sharing = isMerchant && inv.status === Status.Open;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (permissions or insecure context): select the link so it can be copied by hand.
      document.querySelector<HTMLInputElement>("#pay-link")?.select();
    }
  }

  return (
    <div className={`mx-auto grid items-start gap-8 ${sharing ? "max-w-4xl lg:grid-cols-[1fr_20rem]" : "max-w-md"}`}>
      <div className="space-y-4">
        <article className="card rise overflow-hidden">
          <div className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="amount text-sm text-muted">Invoice #{id.toString()}</span>
              <StatusBadge status={inv.status} />
            </div>
            <div className="space-y-2">
              {inv.memo && <p className="break-words text-lg font-medium">{inv.memo}</p>}
              <p className="amount text-6xl font-semibold leading-none">{formatUsdc(inv.amount)}</p>
              <p className="text-sm font-semibold text-muted">USDC on {arc.name}</p>
            </div>
          </div>

          {/* Perforated edge, like a torn receipt. */}
          <div aria-hidden className="relative h-0 border-t-2 border-dashed border-line">
            <span className="absolute -left-3 -top-3 size-6 rounded-full bg-paper" />
            <span className="absolute -right-3 -top-3 size-6 rounded-full bg-paper" />
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Pay to</dt>
                <dd className="font-mono" title={inv.merchant}>
                  {short(inv.merchant)}
                </dd>
              </div>
              {inv.status === Status.Paid && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Paid by</dt>
                  <dd className="font-mono" title={inv.payer}>
                    {short(inv.payer)}
                  </dd>
                </div>
              )}
            </dl>

            {inv.status === Status.Open && !isMerchant && (
              <PayButton id={id} amount={inv.amount} onPaid={() => refetch()} />
            )}
            {inv.status === Status.Open && isMerchant && (
              <p className="text-sm text-muted">Waiting for your customer to pay.</p>
            )}
            {inv.status === Status.Paid && (
              <p className="rounded-xl bg-paid-soft px-4 py-3 text-sm font-medium text-paid">
                Paid on{" "}
                {new Date(Number(inv.paidAt) * 1000).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                . The money is in the merchant&apos;s wallet.
              </p>
            )}
            {inv.status === Status.Cancelled && (
              <p className="rounded-xl bg-line/50 px-4 py-3 text-sm text-muted">
                The merchant cancelled this invoice. Nothing is owed.
              </p>
            )}
          </div>
        </article>

        <p className="px-2 text-center text-xs text-muted">
          Payments go straight to the merchant&apos;s wallet. Settla never holds funds.{" "}
          <a
            href={`${arc.blockExplorers.default.url}/address/${SETTLA_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            View the contract
          </a>
        </p>
      </div>

      {sharing && (
        <aside className="card rise space-y-4 p-6 [animation-delay:150ms]">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-semibold tracking-tight">Share with your customer</h2>
            <p className="text-sm text-muted">They can scan this at the counter, or open the link.</p>
          </div>
          {link && (
            // QR codes need dark-on-light to scan reliably, so the tile stays white in dark mode.
            <div className="mx-auto w-fit rounded-xl bg-white p-4">
              <QRCodeSVG value={link} size={200} marginSize={0} fgColor="#2a2118" title={`Pay invoice #${id}`} />
            </div>
          )}
          <div className="flex gap-2">
            <input
              id="pay-link"
              readOnly
              value={link}
              aria-label="Pay link"
              onFocus={(e) => e.currentTarget.select()}
              className="field min-w-0 flex-1 py-2 font-mono text-xs"
            />
            <button onClick={copy} aria-live="polite" className="btn-quiet min-h-10 px-3.5 text-sm">
              <span aria-hidden className="relative size-4">
                <Copy className={`swap-icon absolute inset-0 size-4 ${copied ? "swap-out" : ""}`} />
                <Check className={`swap-icon absolute inset-0 size-4 text-paid ${copied ? "" : "swap-out"}`} />
              </span>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
