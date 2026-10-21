"use client";
import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { arc } from "@/lib/arc";
import {
  errorMessage,
  formatInterval,
  formatUsdc,
  settlaV2Abi,
  SETTLA_V2_ADDRESS,
  type PlanData,
  type SubscriptionData,
} from "@/lib/settlaV2";
import { useArcTx } from "@/lib/useArcTx";
import { SubscribeButton } from "@/components/SubscribeButton";
import { Check, Copy } from "@/components/Icons";

const noop = () => () => {};
const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-md space-y-3">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted">{body}</p>
      <Link href="/plans" className="btn-quiet">Back to plans</Link>
    </div>
  );
}

export default function PlanPage() {
  const { id: raw } = useParams<{ id: string }>();
  const validId = /^\d+$/.test(raw) && BigInt(raw) > 0n;
  const planId = validId ? BigInt(raw) : 0n;

  const { address } = useAccount();
  const { send } = useArcTx();
  const link = useSyncExternalStore(noop, () => window.location.href, () => "");
  const [copied, setCopied] = useState(false);
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);

  const { data: plan, isLoading: planLoading, isError: planError } = useReadContract({
    address: SETTLA_V2_ADDRESS,
    abi: settlaV2Abi,
    functionName: "getPlan",
    args: [planId],
    chainId: arc.id,
    query: { enabled: validId, retry: 3, retryDelay: 1000 },
  }) as { data: PlanData | undefined; isLoading: boolean; isError: boolean };

  // My subscription for this plan (check subscriptionsOf and find matching planId)
  const { data: mySubIds, refetch: refetchSubs } = useReadContract({
    address: SETTLA_V2_ADDRESS,
    abi: settlaV2Abi,
    functionName: "subscriptionsOf",
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: !!address && !!SETTLA_V2_ADDRESS },
  }) as { data: bigint[] | undefined; refetch: () => void };

  // Read the most recent subscription this address has for this plan
  // We'll use the last subId in their list and check if it matches this planId
  const lastSubId = mySubIds && mySubIds.length > 0 ? mySubIds[mySubIds.length - 1] : undefined;

  const { data: mySub, refetch: refetchSub } = useReadContract({
    address: SETTLA_V2_ADDRESS,
    abi: settlaV2Abi,
    functionName: "getSubscription",
    args: lastSubId !== undefined ? [lastSubId] : undefined,
    chainId: arc.id,
    query: { enabled: lastSubId !== undefined && !!SETTLA_V2_ADDRESS },
  }) as { data: SubscriptionData | undefined; refetch: () => void };

  const myActiveSub = mySub && mySub.planId === planId && mySub.active ? mySub : undefined;

  async function onCharge() {
    if (!lastSubId || !SETTLA_V2_ADDRESS) return;
    setCharging(true);
    setChargeError(null);
    try {
      await send({ address: SETTLA_V2_ADDRESS, abi: settlaV2Abi, functionName: "charge", args: [lastSubId] });
      await refetchSub();
    } catch (err) {
      setChargeError(errorMessage(err));
    } finally {
      setCharging(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      document.querySelector<HTMLInputElement>("#plan-link")?.select();
    }
  }

  if (!validId) return <Message title="Plan not found" body="Check the link with whoever sent it to you." />;
  if (planError) return (
    <Message
      title="Couldn't load this plan"
      body="Make sure your wallet is connected to Arc Testnet (chain ID 5042002) and try refreshing. If the problem persists, check that your browser isn't blocking the Arc RPC."
    />
  );
  if (planLoading || !plan) {
    return <div className="card mx-auto h-96 max-w-md animate-pulse opacity-60" aria-busy="true" />;
  }

  const isMerchant = address?.toLowerCase() === plan.merchant.toLowerCase();
  const intervalSecs = Number(plan.interval);

  return (
    <div className={`mx-auto grid items-start gap-8 ${isMerchant ? "max-w-4xl lg:grid-cols-[1fr_20rem]" : "max-w-md"}`}>
      <div className="space-y-4">
        <article className="card rise overflow-hidden">
          <div className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="amount text-sm text-muted">Plan #{planId.toString()}</span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={plan.active
                    ? { background: "var(--sub-soft)", color: "var(--sub)" }
                    : { background: "var(--line)", color: "var(--muted)" }}
                >
                  {/* ↻ repeat */}
                  <svg className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M2.5 8A5.5 5.5 0 0 1 13 5.5M13 5.5V3m0 2.5H10.5" />
                    <path d="M13.5 8A5.5 5.5 0 0 1 3 10.5M3 10.5V13m0-2.5H5.5" />
                  </svg>
                  {plan.active ? "Recurring" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {plan.memo && <p className="break-words text-lg font-medium">{plan.memo}</p>}
              <p className="amount text-6xl font-semibold leading-none">{formatUsdc(plan.amount)}</p>
              <p className="text-sm font-semibold text-muted">
                USDC / {formatInterval(intervalSecs)} on {arc.name}
              </p>
            </div>
          </div>

          <div aria-hidden className="relative h-0 border-t-2 border-dashed border-line">
            <span className="absolute -left-3 -top-3 size-6 rounded-full bg-paper" />
            <span className="absolute -right-3 -top-3 size-6 rounded-full bg-paper" />
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Merchant</dt>
                <dd className="font-mono" title={plan.merchant}>{short(plan.merchant)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Interval</dt>
                <dd>{formatInterval(intervalSecs)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Max charges</dt>
                <dd>{plan.maxCharges === 0 ? "Unlimited" : plan.maxCharges}</dd>
              </div>
            </dl>

            {/* Subscriber: show subscribe or charge */}
            {!isMerchant && plan.active && !myActiveSub && (
              <SubscribeButton planId={planId} amount={plan.amount} onSubscribed={() => { refetchSubs(); refetchSub(); }} />
            )}
            {!isMerchant && myActiveSub && (
              <div className="space-y-3">
                <p className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "var(--sub-soft)", color: "var(--sub)" }}>
                  You&apos;re subscribed. Charge #{myActiveSub.chargeCount} of {plan.maxCharges === 0 ? "∞" : plan.maxCharges}.
                </p>
                <button
                  onClick={onCharge}
                  disabled={charging}
                  className="btn-quiet w-full py-2.5 text-sm"
                >
                  {charging ? "Charging…" : "Trigger next charge now"}
                </button>
                {chargeError && (
                  <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                    {chargeError}
                  </p>
                )}
              </div>
            )}
            {!plan.active && !isMerchant && (
              <p className="rounded-xl bg-line/50 px-4 py-3 text-sm text-muted">
                This plan has been deactivated. No new subscriptions are accepted.
              </p>
            )}
            {isMerchant && (
              <p className="text-sm text-muted">
                Share this link with your customers to let them subscribe.
              </p>
            )}
          </div>
        </article>

        <p className="px-2 text-center text-xs text-muted">
          Payments go straight to the merchant&apos;s wallet. Settla never holds funds.{" "}
          <a
            href={`${arc.blockExplorers.default.url}/address/${SETTLA_V2_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            View the contract
          </a>
        </p>
      </div>

      {/* Merchant QR share panel */}
      {isMerchant && (
        <aside className="card rise space-y-4 p-6 [animation-delay:150ms]">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-semibold tracking-tight">Share with subscribers</h2>
            <p className="text-sm text-muted">They scan or click to subscribe.</p>
          </div>
          {link && (
            <div className="mx-auto w-fit rounded-xl bg-white p-4">
              <QRCodeSVG value={link} size={200} marginSize={0} fgColor="#2a2118" title={`Subscribe to plan #${planId}`} />
            </div>
          )}
          <div className="flex gap-2">
            <input
              id="plan-link"
              readOnly
              value={link}
              aria-label="Plan link"
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
