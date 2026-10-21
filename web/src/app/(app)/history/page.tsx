"use client";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createPublicClient, http } from "viem";
import { arc } from "@/lib/arc";
import { settlaAbi, SETTLA_ADDRESS, formatUsdc, Status } from "@/lib/settla";
import { CtaLink } from "@/components/CtaLink";

// Always-available client pointed directly at Arc Testnet RPC —
// independent of which chain the user's wallet is currently on.
const arcClient = createPublicClient({ chain: arc, transport: http() });

interface PaymentRecord {
  invoiceId: bigint;
  merchant: `0x${string}`;
  amount: bigint;
  blockNumber: bigint;
  txHash: `0x${string}`;
  memo?: string;
  paidAt?: bigint;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const date = (secs: bigint) =>
  new Date(Number(secs) * 1000).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: boolean }) {
  return (
    <div className="card rise flex flex-col items-start gap-3 p-8 sm:p-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-md text-muted">{body}</p>
      {cta && (
        <div className="mt-2">
          <CtaLink href="/">Browse open invoices</CtaLink>
        </div>
      )}
    </div>
  );
}

export default function PaymentHistory() {
  const { address, isConnected } = useAccount();

  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!address || !SETTLA_ADDRESS) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        // Use a bounded lookback (last 500k blocks) to avoid RPC range errors
        const head = await arcClient.getBlockNumber();
        const fromBlock = head > 500000n ? head - 500000n : 0n;

        const logs = await arcClient.getLogs({
          address: SETTLA_ADDRESS,
          event: {
            type: "event",
            name: "Settled",
            inputs: [
              { indexed: true, name: "id", type: "uint256" },
              { indexed: true, name: "merchant", type: "address" },
              { indexed: true, name: "payer", type: "address" },
              { indexed: false, name: "amount", type: "uint256" },
            ],
          },
          args: { payer: address },
          fromBlock,
          toBlock: "latest",
        });
        if (cancelled) return;

        const base: PaymentRecord[] = [...logs].reverse().map((l) => ({
          invoiceId: l.args.id as bigint,
          merchant: l.args.merchant as `0x${string}`,
          amount: l.args.amount as bigint,
          blockNumber: l.blockNumber ?? 0n,
          txHash: l.transactionHash as `0x${string}`,
        }));

        setRecords(base);
        setLoading(false);

        base.forEach(async (r, i) => {
          try {
            const inv = await arcClient.readContract({
              address: SETTLA_ADDRESS!,
              abi: settlaAbi,
              functionName: "getInvoice",
              args: [r.invoiceId],
            });
            if (cancelled) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const invData = inv as any;
            setRecords((prev) =>
              prev.map((p, j) =>
                j === i ? { ...p, memo: invData.memo, paidAt: invData.paidAt } : p
              )
            );
          } catch { /* enrichment silent fail */ }
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message.split("\n")[0] : "Failed to load history");
          setLoading(false);
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [address, retryCount]);

  const explorerBase = arc.blockExplorers.default.url;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Page header */}
      <div className="space-y-2">
        <span
          className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em]"
          style={{ background: "var(--sub-soft)", color: "var(--sub)" }}
        >
          Settla 2.0
        </span>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Payment history</h1>
        {records.length > 0 && (
          <p className="text-muted">
            {records.length} {records.length === 1 ? "payment" : "payments"} you made, newest first
          </p>
        )}
      </div>

      {!isConnected && (
        <EmptyState
          title="Connect to see your history"
          body="Your payment history is read from the Arc blockchain, filtered to your wallet."
        />
      )}

      {isConnected && loading && (
        <ul className="space-y-0 pl-6" aria-busy="true" aria-label="Loading history…">
          {[0, 1, 2].map((i) => (
            <li key={i} className="relative pb-6">
              <span className="absolute left-0 top-2 -translate-x-1/2 size-3 rounded-full bg-line" aria-hidden />
              {i < 2 && <span className="absolute left-0 top-5 bottom-0 w-px bg-line" aria-hidden />}
              <div className="card ml-4 h-16 animate-pulse opacity-60" />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div role="alert" className="card flex flex-col items-start gap-3 p-6">
          <p className="text-sm font-medium" style={{ color: "var(--danger, #c0392b)" }}>
            RPC request failed — {error}
          </p>
          <p className="text-sm text-muted">Check your connection and try again.</p>
          <button
            className="btn-quiet text-sm"
            onClick={() => setRetryCount(c => c + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {isConnected && !loading && records.length === 0 && !error && (
        <EmptyState
          title="No payments yet"
          body="Invoices you pay with this wallet will appear here after they settle on Arc."
          cta
        />
      )}

      {/* Timeline list */}
      {records.length > 0 && (
        <ul className="space-y-0 pl-5">
          {records.map((r, i) => (
            <li key={r.txHash} className="relative pb-6">
              {/* vertical connector line — hidden on last item */}
              {i < records.length - 1 && (
                <span
                  className="absolute left-0 top-5 bottom-0 w-px"
                  style={{ background: "var(--line)" }}
                  aria-hidden
                />
              )}
              {/* timeline dot */}
              <span
                className="absolute left-0 top-2 -translate-x-1/2 size-3 rounded-full border-2"
                style={{
                  background: "var(--paid-soft)",
                  borderColor: "var(--paid)",
                }}
                aria-hidden
              />

              {/* card */}
              <div className="card ml-5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="amount text-sm text-muted">Invoice #{r.invoiceId.toString()}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-paid-soft px-2 py-0.5 text-xs font-semibold text-paid">
                        <span aria-hidden className="size-1.5 rounded-full bg-current" />
                        Settled
                      </span>
                    </div>
                    <p className="truncate font-medium">
                      {r.memo ?? <span className="animate-pulse text-muted">Loading…</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                      {r.paidAt && <span>{date(r.paidAt)}</span>}
                      <span>
                        To{" "}
                        <a
                          href={`${explorerBase}/address/${r.merchant}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono underline underline-offset-2 hover:text-ink"
                        >
                          {short(r.merchant)}
                        </a>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="amount text-xl font-semibold">
                      {formatUsdc(r.amount)}{" "}
                      <span className="font-sans text-xs font-semibold text-muted">USDC</span>
                    </p>
                    <div className="-mr-2.5 mt-1 flex items-center justify-end gap-0.5">
                      <Link
                        href={`/pay/${r.invoiceId}`}
                        className="inline-flex min-h-10 items-center rounded-full px-2.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                      <a
                        href={`${explorerBase}/tx/${r.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center rounded-full px-2.5 text-sm text-muted hover:text-ink"
                      >
                        Tx ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
