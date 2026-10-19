import React from "react";
import Link from "next/link";
import { CtaLink } from "@/components/CtaLink";
import { CountUp } from "@/components/CountUp";
import { Magnetic } from "@/components/Magnetic";
import { HowItWorks } from "@/components/HowItWorks";
import { SpotlightGrid } from "@/components/Spotlight";
import { CardDeck } from "@/components/CardDeck";
import { FlipCard } from "@/components/FlipCard";


const GOOD_TO_KNOW = [
  ["Notes are public.", "Invoices live on a public blockchain, so keep names and phone numbers out of the note."],
  ["Two taps the first time.", "A new customer approves USDC once, then pays. After that it's one tap."],
  ["You hold the keys.", "Settla can't freeze, reverse, or take a payment. It also means we can't recover a lost wallet for you."],
  ["It's unaudited.", "Settla is a proof of concept and hasn't had a security audit. Start with small amounts."],
];

const V2_FEATURES: { title: string; body: string; icon: React.ReactNode }[] = [
  {
    title: "Recurring subscription plans",
    body: "Create a plan with an amount and interval. Customers subscribe once — charges happen automatically every interval, straight to your wallet.",
    icon: (
      <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 10a7 7 0 0 1 12.7-4M17 10a7 7 0 0 1-12.7 4" />
        <path d="M15 6h2.7V3.3M5 14H2.3V16.7" />
      </svg>
    ),
  },
  {
    title: "Payment history",
    body: "Every invoice you've paid shows up in a timeline, pulled live from the Arc blockchain. Amount, merchant, date, and a link to the transaction.",
    icon: (
      <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6v4l2.5 2.5" />
      </svg>
    ),
  },
];


export default function Landing() {
  return (
    <div className="space-y-24 sm:space-y-32">

      {/* ── HERO ── */}
      <section className="relative isolate grid items-center gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
        <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 -z-20 h-[50rem] w-screen -translate-x-1/2">
          <span className="glow glow-a" />
          <span className="glow glow-b" />
        </div>
        <div className="space-y-7">
          <p className="eyebrow rise">Invoices &amp; recurring payments on Arc</p>
          <h1 className="rise max-w-2xl font-display text-5xl font-semibold leading-[1.04] tracking-tight [animation-delay:80ms] sm:text-7xl">
            Get paid in dollars, on time, every time.
          </h1>
          <p className="rise max-w-[34rem] text-lg leading-relaxed text-muted [animation-delay:160ms]">
            Settla turns an amount and a note into a payment link — or a subscription plan that charges
            automatically. The money goes straight to your wallet in USDC, with no card fees and nobody
            holding it in between.
          </p>
          <div className="rise flex flex-wrap items-center gap-4 [animation-delay:240ms]">
            <Magnetic>
              <CtaLink href="/new" large>
                Create an invoice
              </CtaLink>
            </Magnetic>
            <Magnetic>
              <CtaLink href="/plans/new" large>
                Create a plan
              </CtaLink>
            </Magnetic>
            <Link
              href="/pay/1"
              className="font-medium text-ink underline decoration-line decoration-2 underline-offset-[6px] transition hover:decoration-accent"
            >
              See a paid invoice
            </Link>
          </div>
        </div>
        <CardDeck />
      </section>

      {/* ── WHAT'S NEW IN 2.0 ── */}
      <section aria-labelledby="v2" className="relative overflow-hidden rounded-[2rem] p-8 sm:p-12"
        style={{ background: "var(--sub-soft)" }}>
        {/* Subtle indigo glow */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full opacity-30"
          style={{ background: "radial-gradient(closest-side, var(--sub), transparent)" }} />
        <div className="relative space-y-8">
          <div className="space-y-2">
            <p className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em]"
              style={{ background: "var(--sub)", color: "#fff" }}>
              New in 2.0
            </p>
            <h2 id="v2" className="font-display text-4xl font-semibold tracking-tight" style={{ color: "var(--sub)" }}>
              Beyond one-off invoices.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed" style={{ color: "var(--sub)" , opacity: 0.75 }}>
              Settla 2.0 adds recurring billing and payment history — both powered by a new audited
              smart contract on Arc Testnet.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {V2_FEATURES.map(({ title, body, icon }) => (
              <article key={title} className="card flex flex-col gap-5 p-7">
                <div className="grid size-10 place-items-center rounded-xl"
                  style={{ background: "var(--sub-soft)", color: "var(--sub)" }}>
                  {icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="leading-relaxed text-muted">{body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="/plans/new"
              className="btn-primary shimmer">
              Create a subscription plan
            </Link>
            <Link href="/history"
              className="btn-quiet">
              View payment history
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── WHY SETTLA ── */}
      <section aria-labelledby="why" className="space-y-10">
        <div className="reveal space-y-3">
          <p className="eyebrow">Why Settla</p>
          <h2 id="why" className="max-w-xl font-display text-4xl font-semibold tracking-tight">
            What you get
          </h2>
          <p className="text-sm text-muted">Hover any card to see what&apos;s new in 2.0.</p>
        </div>
        <SpotlightGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* Card 1 — Direct transfer (wide) */}
          <FlipCard
            className="reveal sm:col-span-2"
            front={
              <>
                <div aria-hidden className="flex items-center gap-3 rounded-2xl bg-paper p-4 text-sm">
                  <span className="rounded-full bg-card px-3 py-1.5 font-mono shadow-[0_0_0_1px_var(--hairline)]">Customer</span>
                  <span className="relative h-0.5 flex-1 rounded-full bg-line [container-type:inline-size]">
                    <span className="coin absolute -top-3 left-0 grid size-6 place-items-center rounded-full bg-accent text-[0.625rem] font-bold text-accent-ink">$</span>
                  </span>
                  <span className="rounded-full bg-accent-soft px-3 py-1.5 font-mono text-accent-hover">You</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">It goes straight to you</h3>
                  <p className="max-w-lg leading-relaxed text-muted">
                    Payments move from your customer&apos;s wallet to yours in one transaction. Settla never touches the money.
                  </p>
                </div>
              </>
            }
            back={
              <>
                <div aria-hidden className="flex items-center gap-3 rounded-2xl p-4 text-sm" style={{ background: "color-mix(in srgb, var(--sub) 12%, transparent)" }}>
                  <span className="rounded-full px-3 py-1.5 font-mono shadow-[0_0_0_1px_var(--hairline)]" style={{ background: "var(--sub-soft)", color: "var(--sub)" }}>Subscriber</span>
                  <span className="relative h-0.5 flex-1 rounded-full" style={{ background: "var(--sub)" }}>
                    <span className="absolute -top-3 left-0 grid size-6 place-items-center rounded-full text-[0.625rem] font-bold text-white" style={{ background: "var(--sub)" }}>↻</span>
                  </span>
                  <span className="rounded-full px-3 py-1.5 font-mono font-semibold" style={{ background: "var(--sub)", color: "#fff" }}>You</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--sub)" }}>Every interval, automatically</h3>
                  <p className="max-w-lg leading-relaxed text-muted">
                    Subscription charges move directly from subscriber to merchant on every cycle — no intermediary, no manual chasing.
                  </p>
                </div>
              </>
            }
          />

          {/* Card 2 — Finality (tall) */}
          <FlipCard
            className="reveal lg:row-span-2"
            front={
              <>
                <div aria-hidden className="space-y-1">
                  <p className="amount text-7xl font-semibold leading-none text-accent">&lt;1s</p>
                  <p className="text-sm font-medium text-muted">from payment to final on Arc</p>
                </div>
                <ol aria-hidden className="relative space-y-4 border-l-2 border-dashed border-line pl-5 text-sm">
                  {["Customer signs the payment", "Arc commits the block", "Invoice shows Paid"].map((step, i) => (
                    <li key={step} className="relative">
                      <span className="finality-dot absolute -left-[1.6875rem] top-1 size-3 rounded-full ring-4 ring-card"
                        style={{ "--dot": i === 2 ? "var(--paid)" : "var(--accent)", animationRange: `cover ${18 + 9 * i}% cover ${23 + 9 * i}%` } as React.CSSProperties}
                      />
                      <span className={i === 2 ? "font-semibold text-paid" : "text-ink"}>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">Paid in about a second</h3>
                  <p className="leading-relaxed text-muted">Arc confirms the moment it happens — no pending state, no transfers to chase.</p>
                </div>
              </>
            }
            back={
              <>
                <div aria-hidden className="space-y-1">
                  <p className="amount text-7xl font-semibold leading-none" style={{ color: "var(--sub)" }}>&lt;1s</p>
                  <p className="text-sm font-medium text-muted">per subscription charge on Arc</p>
                </div>
                <ol aria-hidden className="relative space-y-4 border-l-2 border-dashed pl-5 text-sm" style={{ borderColor: "var(--sub)" }}>
                  {["Charge triggered on interval", "Arc commits the block", "Subscriber billed, you receive"].map((step, i) => (
                    <li key={step} className="relative">
                      <span className="absolute -left-[1.6875rem] top-1 size-3 rounded-full ring-4 ring-card"
                        style={{ background: "var(--sub)" }}
                      />
                      <span className={i === 2 ? "font-semibold" : "text-ink"} style={i === 2 ? { color: "var(--sub)" } : {}}>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--sub)" }}>Recurring charges, same speed</h3>
                  <p className="leading-relaxed text-muted">Every subscription charge settles in under a second — same Arc finality, every billing cycle.</p>
                </div>
              </>
            }
          />

          {/* Card 3 — One currency */}
          <FlipCard
            className="reveal"
            front={
              <>
                <dl aria-hidden className="amount space-y-2 rounded-2xl bg-paper p-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-sans text-muted">Invoice</dt>
                    <dd className="font-semibold"><CountUp value={18.5} decimals={2} /> USDC</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-sans text-muted">Network fee</dt>
                    <dd><CountUp value={0.002} decimals={3} /> USDC</dd>
                  </div>
                </dl>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-semibold tracking-tight">One currency for everything</h3>
                  <p className="leading-relaxed text-muted">Even the network fee is paid in USDC. You never buy a second coin to get paid.</p>
                </div>
              </>
            }
            back={
              <>
                <dl aria-hidden className="amount space-y-2 rounded-2xl p-4 text-sm" style={{ background: "color-mix(in srgb, var(--sub) 10%, transparent)" }}>
                  <div className="flex justify-between">
                    <dt className="font-sans text-muted">Plan</dt>
                    <dd className="font-semibold" style={{ color: "var(--sub)" }}>9.99 USDC / mo</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-sans text-muted">Charge fee</dt>
                    <dd><CountUp value={0.002} decimals={3} /> USDC</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-sans text-muted">Charges so far</dt>
                    <dd className="font-semibold" style={{ color: "var(--sub)" }}>3 of ∞</dd>
                  </div>
                </dl>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-semibold tracking-tight" style={{ color: "var(--sub)" }}>Subscriptions in the same currency</h3>
                  <p className="leading-relaxed text-muted">Plans charge in USDC too. Same wallet, same token — invoices and subscriptions side by side.</p>
                </div>
              </>
            }
          />

          {/* Card 4 — No sign-up */}
          <FlipCard
            className="reveal"
            front={
              <>
                <div aria-hidden className="flex items-center justify-between gap-3 rounded-2xl bg-paper p-4">
                  <span className="btn-primary pointer-events-none px-4 py-2 text-sm">Connect wallet</span>
                  <span className="text-right text-sm leading-tight text-muted">
                    <span className="amount block whitespace-nowrap font-semibold text-ink">~0.004 USDC</span>
                    per invoice
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-semibold tracking-tight">No sign-up, no monthly fee</h3>
                  <p className="leading-relaxed text-muted">Connect a wallet and send your first invoice. You only pay a fraction of a cent in network fees.</p>
                </div>
              </>
            }
            back={
              <>
                <div aria-hidden className="flex items-center justify-between gap-3 rounded-2xl p-4" style={{ background: "color-mix(in srgb, var(--sub) 10%, transparent)" }}>
                  <span className="pointer-events-none rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--sub)" }}>Approve once</span>
                  <span className="text-right text-sm leading-tight text-muted">
                    <span className="amount block whitespace-nowrap font-semibold" style={{ color: "var(--sub)" }}>↻ forever</span>
                    auto-billed
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-semibold tracking-tight" style={{ color: "var(--sub)" }}>One approval, recurring forever</h3>
                  <p className="leading-relaxed text-muted">Subscribers approve USDC spending once. Every billing cycle after that is automatic — no repeat confirmations.</p>
                </div>
              </>
            }
          />

        </SpotlightGrid>
      </section>

      {/* ── GOOD TO KNOW ── */}
      <section aria-labelledby="know" className="card reveal grid gap-8 p-8 sm:p-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
        <h2 id="know" className="font-display text-3xl font-semibold tracking-tight">
          Good to know
        </h2>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {GOOD_TO_KNOW.map(([title, body], i) => (
            <div key={title} className="reveal" style={{ animationRange: `entry ${10 + 12 * i}% cover ${30 + 8 * i}%` }}>
              <dt className="font-semibold">{title}</dt>
              <dd className="mt-1 text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="reveal grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col items-start gap-6 rounded-[2rem] bg-accent-soft px-8 py-12 sm:px-10">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Send your first invoice.</h2>
            <p className="text-muted">Takes about a minute. All you need is a wallet with a little USDC.</p>
          </div>
          <Magnetic>
            <CtaLink href="/new" large shimmer>
              Create an invoice
            </CtaLink>
          </Magnetic>
        </div>
        <div className="flex flex-col items-start gap-6 rounded-[2rem] px-8 py-12 sm:px-10"
          style={{ background: "var(--sub-soft)" }}>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--sub)" }}>
              Set up recurring billing.
            </h2>
            <p className="text-muted">Create a plan, share the link. Customers subscribe once and are charged automatically.</p>
          </div>
          <Link href="/plans/new"
            className="btn inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-white transition duration-300"
            style={{ background: "var(--sub)" }}>
            Create a plan
          </Link>
        </div>
      </section>

    </div>
  );
}
