"use client";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createPublicClient, http } from "viem";
import { arc } from "@/lib/arc";
import { settlaAbi, SETTLA_ADDRESS, formatUsdc } from "@/lib/settla";
import { settlaV2Abi, SETTLA_V2_ADDRESS } from "@/lib/settlaV2";
import { CtaLink } from "@/components/CtaLink";

const arcClient = createPublicClient({ chain: arc, transport: http() });

type RecordType = "invoice" | "subscription";

interface PaymentRecord {
  type: RecordType;
  refId: bigint;       // invoiceId or subId
  merchant: `0x${string}`;
  amount: bigint;
  blockNumber: bigint;
  txHash: `0x${string}`;
  memo?: string;
  settledAt?: bigint;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const date = (secs: bigint) =>
  new Date(Number(secs) * 1000).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card rise flex flex-col items-start gap-3 p-8 sm:p-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-md text-muted">{body}</p>
      <div className="mt-2 flex gap-3">
        <CtaLink href="/new">Create an invoice</CtaLink>
        <CtaLink href="/plans/new">Start a subscription</CtaLink>
      </div>
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
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const head = await arcClient.getBlockNumber();
        const LOOKBACK = 4000n;
        const fromBlock = head > LOOKBACK ? head - LOOKBACK : 0n;

        // Fetch v1 Settled + v2 Charged in parallel
        const [settledLogs, chargedLogs] = await Promise.all([
          SETTLA_ADDRESS ? arcClient.getLogs({
            address: SETTLA_ADDRESS,
            event: {
              type: "event", name: "Settled",
              inputs: [
                { indexed: true, name: "id", type: "uint256" },
                { indexed: true, name: "merchant", type: "address" },
                { indexed: true, name: "payer", type: "address" },
                { indexed: false, name: "amount", type: "uint256" },
              ],
            },
            args: { payer: address },
            fromBlock, toBlock: "latest",
          }) : Promise.resolve([]),
          SETTLA_V2_ADDRESS ? arcClient.getLogs({
            address: SETTLA_V2_ADDRESS,
            event: {
              type: "event", name: "Charged",
              inputs: [
                { indexed: true, name: "subId", type: "uint256" },
                { indexed: true, name: "planId", type: "uint256" },
                { indexed: true, name: "subscriber", type: "address" },
                { indexed: false, name: "amount", type: "uint256" },
              ],
            },
            args: { subscriber: address },
            fromBlock, toBlock: "latest",
          }) : Promise.resolve([]),
        ]);

        if (cancelled) return;

        const invoiceRecords: PaymentRecord[] = settledLogs.map((l) => ({
          type: "invoice" as RecordType,
          refId: l.args.id as bigint,
          merchant: l.args.merchant as `0x${string}`,
          amount: l.args.amount as bigint,
          blockNumber: l.blockNumber ?? 0n,
          txHash: l.transactionHash as `0x${string}`,
        }));

        // For subscription Charged events we need to look up the plan to get merchant
        const subRecords: PaymentRecord[] = chargedLogs.map((l) => ({
          type: "subscription" as RecordType,
          refId: l.args.subId as bigint,
          merchant: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          amount: l.args.amount as bigint,
          blockNumber: l.blockNumber ?? 0n,
          txHash: l.transactionHash as `0x${string}`,
          memo: `Subscription #${(l.args.subId as bigint).toString()}`,
        }));

        // Merge + sort newest first
        const merged = [...invoiceRecords, ...subRecords].sort(
          (a, b) => Number(b.blockNumber - a.blockNumber)
        );

        setRecords(merged);
        setLoading(false);

        // Enrich invoice records with memo + paidAt
        invoiceRecords.forEach(async (r, _i) => {
          try {
            if (!SETTLA_ADDRESS) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inv = await arcClient.readContract({
              address: SETTLA_ADDRESS,
              abi: settlaAbi,
              functionName: "getInvoice",
              args: [r.refId],
            }) as any;
            if (cancelled) return;
            setRecords((prev) =>
              prev.map((p) =>
                p.txHash === r.txHash
                  ? { ...p, memo: inv.memo, settledAt: inv.paidAt }
                  : p
              )
            );
          } catch { /* silent */ }
        });

        // Enrich subscription records with merchant + plan memo
        chargedLogs.forEach(async (l) => {
          try {
            if (!SETTLA_V2_ADDRESS) return;
            const subId = l.args.subId as bigint;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sub = await arcClient.readContract({
              address: SETTLA_V2_ADDRESS,
              abi: settlaV2Abi,
              functionName: "getSubscription",
              args: [subId],
            }) as any;
            if (cancelled) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const plan = await arcClient.readContract({
              address: SETTLA_V2_ADDRESS,
              abi: settlaV2Abi,
              functionName: "getPlan",
              args: [sub.planId],
            }) as any;
            if (cancelled) return;
            setRecords((prev) =>
              prev.map((p) =>
                p.txHash === (l.transactionHash as `0x${string}`)
                  ? { ...p, merchant: plan.merchant, memo: plan.memo }
                  : p
              )
            );
          } catch { /* silent */ }
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
            {records.length} {records.length === 1 ? "payment" : "payments"} —
            invoices &amp; subscription charges, newest first
          </p>
        )}
      </div>

      {!isConnected && (
        <div className="card rise flex flex-col items-start gap-3 p-8 sm:p-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Connect to see your history</h2>
          <p className="max-w-md text-muted">
            Your payment history is read from the Arc blockchain, filtered to your wallet.
          </p>
        </div>
      )}

      {isConnected && loading && (
        <ul className="space-y-0 pl-6" aria-busy="true">
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
          <button className="btn-quiet text-sm" onClick={() => setRetryCount(c => c + 1)}>
            Try again
          </button>
        </div>
      )}

      {isConnected && !loading && records.length === 0 && !error && (
        <EmptyState
          title="No payments yet"
          body="Invoices you pay and subscription charges will both appear here after they settle on Arc."
        />
      )}

      {records.length > 0 && (
        <ul className="space-y-0 pl-5">
          {records.map((r, i) => {
            const isSub = r.type === "subscription";
            return (
              <li key={r.txHash} className="relative pb-6">
                {i < records.length - 1 && (
                  <span
                    className="absolute left-0 top-5 bottom-0 w-px"
                    style={{ background: "var(--line)" }}
                    aria-hidden
                  />
                )}
                <span
                  className="absolute left-0 top-2 -translate-x-1/2 size-3 rounded-full border-2"
                  style={{
                    background: isSub ? "var(--sub-soft)" : "var(--paid-soft)",
                    borderColor: isSub ? "var(--sub)" : "var(--paid)",
                  }}
                  aria-hidden
                />

                <div className="card ml-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="amount text-sm text-muted">
                          {isSub ? `Subscription #${r.refId.toString()}` : `Invoice #${r.refId.toString()}`}
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold"
                          style={{
                            background: isSub ? "var(--sub-soft)" : "var(--paid-soft)",
                            color: isSub ? "var(--sub)" : "var(--paid)",
                          }}
                        >
                          <span aria-hidden className="size-1.5 rounded-full bg-current" />
                          {isSub ? "↻ Charged" : "Settled"}
                        </span>
                      </div>
                      <p className="truncate font-medium">
                        {r.memo ?? <span className="animate-pulse text-muted">Loading…</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                        {r.settledAt && <span>{date(r.settledAt)}</span>}
                        {r.merchant !== "0x0000000000000000000000000000000000000000" && (
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
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="amount text-xl font-semibold">
                        {formatUsdc(r.amount)}{" "}
                        <span className="font-sans text-xs font-semibold text-muted">USDC</span>
                      </p>
                      <div className="-mr-2.5 mt-1 flex items-center justify-end gap-0.5">
                        {isSub ? (
                          <Link
                            href={`/plans/${r.refId}`}
                            className="inline-flex min-h-10 items-center rounded-full px-2.5 text-sm font-medium underline-offset-4 hover:underline"
                            style={{ color: "var(--sub)" }}
                          >
                            View plan
                          </Link>
                        ) : (
                          <Link
                            href={`/pay/${r.refId}`}
                            className="inline-flex min-h-10 items-center rounded-full px-2.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
                          >
                            View
                          </Link>
                        )}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
