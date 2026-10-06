import Link from "next/link";
import { StatusBadge } from "@/components/InvoiceCard";
import { CtaLink } from "@/components/CtaLink";
import { GlobeBackdrop } from "@/components/GlobeBackdrop";
import { Status } from "@/lib/settla";

const STEPS = [
  ["Write the invoice", "Type the amount and what it's for. One tap in your wallet puts it on Arc."],
  ["Share the link", "Send it on WhatsApp or email, or let your customer scan the code at the counter."],
  ["Get paid", "They pay in USDC and the money lands in your wallet about a second later."],
];

const GOOD_TO_KNOW = [
  ["Notes are public.", "Invoices live on a public blockchain, so keep names and phone numbers out of the note."],
  ["Two taps the first time.", "A new customer approves USDC once, then pays. After that it's one tap."],
  ["You hold the keys.", "Settla can't freeze, reverse, or take a payment. It also means we can't recover a lost wallet for you."],
  ["It's unaudited.", "Settla is a proof of concept and hasn't had a security audit. Start with small amounts."],
];

function ReceiptPreview() {
  return (
    <div aria-hidden className="rise relative mx-auto w-full max-w-sm select-none py-6 [animation-delay:350ms]">
      <GlobeBackdrop className="pointer-events-none absolute left-[68%] top-[30%] -z-10 size-[min(34rem,120vw)] -translate-x-1/2 -translate-y-1/2 text-accent opacity-60" />
      {/* A second receipt peeking out behind, for depth. */}
      <div className="card absolute inset-x-6 top-0 h-full translate-y-3 opacity-70 md:translate-y-0 md:-rotate-3" />
      <div className="card relative overflow-hidden md:rotate-1">
        <div className="space-y-5 p-7">
          <div className="flex items-center justify-between">
            <span className="amount text-sm text-muted">Invoice #1042</span>
            {/* Plays once after load: Open, paying, Paid. Ends (and stays) on Paid. */}
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
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="space-y-24 sm:space-y-32">
      <section className="relative isolate grid items-center gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
        {/* Warm glow behind the hero: settles in on load, then drifts only with scroll. */}
        <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 -z-20 h-[50rem] w-screen -translate-x-1/2">
          <span className="glow glow-a" />
          <span className="glow glow-b" />
        </div>
        <div className="space-y-7">
          <p className="eyebrow rise">For small shops &amp; freelancers</p>
          <h1 className="rise max-w-2xl font-display [animation-delay:80ms] text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
            Get paid in dollars, the moment your customer pays.
          </h1>
          <p className="rise max-w-[34rem] text-lg leading-relaxed text-muted [animation-delay:160ms]">
            Settla turns an amount and a note into a link your customer can pay in USDC. The money goes straight
            to your wallet, with no card fees and nobody holding it in between.
          </p>
          <div className="rise flex flex-wrap items-center gap-x-6 gap-y-4 [animation-delay:240ms]">
            <CtaLink href="/new" large>
              Create an invoice
            </CtaLink>
            <Link href="/pay/1" className="font-medium text-ink underline decoration-line decoration-2 underline-offset-[6px] transition hover:decoration-accent">
              See a paid invoice
            </Link>
          </div>
        </div>
        <ReceiptPreview />
      </section>

      <section aria-labelledby="how" className="grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-16">
        <div className="reveal space-y-3">
          <p className="eyebrow">How it works</p>
          <h2 id="how" className="font-display text-4xl font-semibold tracking-tight">
            From invoice to payment in three steps
          </h2>
          <p className="text-muted">If you can send a text message, you can send an invoice.</p>
        </div>
        <ol className="space-y-8">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="reveal flex gap-5">
              <span className="amount grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-xl font-semibold text-accent">
                {i + 1}
              </span>
              <div className="space-y-1 pt-1.5">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="max-w-lg text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="why" className="space-y-10">
        <div className="reveal space-y-3">
          <p className="eyebrow">Why Settla</p>
          <h2 id="why" className="max-w-xl font-display text-4xl font-semibold tracking-tight">
            What you get
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="card reveal flex flex-col gap-6 p-7 sm:col-span-2">
            <div aria-hidden className="flex items-center gap-3 rounded-2xl bg-paper p-4 text-sm">
              <span className="rounded-full bg-card px-3 py-1.5 font-mono shadow-[0_0_0_1px_var(--hairline)]">Customer</span>
              <span className="relative h-0.5 flex-1 rounded-full bg-line [container-type:inline-size]">
                <span className="coin absolute -top-3 left-0 grid size-6 place-items-center rounded-full bg-accent text-[0.625rem] font-bold text-accent-ink">
                  $
                </span>
              </span>
              <span className="rounded-full bg-accent-soft px-3 py-1.5 font-mono text-accent-hover">You</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-2xl font-semibold tracking-tight">It goes straight to you</h3>
              <p className="max-w-lg leading-relaxed text-muted">
                Payments move from your customer&apos;s wallet to yours in one transaction. Settla never touches the
                money, so there&apos;s nothing to withdraw and no one to wait on.
              </p>
            </div>
          </article>

          <article className="card reveal flex flex-col justify-between gap-6 p-7 lg:row-span-2">
            <div aria-hidden className="space-y-1">
              <p className="amount text-7xl font-semibold leading-none text-accent">&lt;1s</p>
              <p className="text-sm font-medium text-muted">from payment to final on Arc</p>
            </div>
            <ol aria-hidden className="relative space-y-4 border-l-2 border-dashed border-line pl-5 text-sm">
              {["Customer signs the payment", "Arc commits the block", "Invoice shows Paid"].map((step, i) => (
                <li key={step} className="relative">
                  <span
                    className={`absolute -left-[1.6875rem] top-1 size-3 rounded-full ring-4 ring-card ${
                      i === 2 ? "bg-paid" : "bg-accent"
                    }`}
                  />
                  <span className={i === 2 ? "font-semibold text-paid" : "text-ink"}>{step}</span>
                </li>
              ))}
            </ol>
            <div className="space-y-1.5">
              <h3 className="font-display text-2xl font-semibold tracking-tight">Paid in about a second</h3>
              <p className="leading-relaxed text-muted">
                Arc confirms a payment the moment it happens, so nothing sits in “pending” for days and there is no
                transfer to chase.
              </p>
            </div>
          </article>

          <article className="card reveal flex flex-col gap-6 p-7">
            <dl aria-hidden className="amount space-y-2 rounded-2xl bg-paper p-4 text-sm">
              <div className="flex justify-between">
                <dt className="font-sans text-muted">Invoice</dt>
                <dd className="font-semibold">18.50 USDC</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-sans text-muted">Network fee</dt>
                <dd>0.002 USDC</dd>
              </div>
            </dl>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-semibold tracking-tight">One currency for everything</h3>
              <p className="leading-relaxed text-muted">
                Even the network fee is paid in USDC, a dollar stablecoin. You never buy a second coin to get paid.
              </p>
            </div>
          </article>

          <article className="card reveal flex flex-col gap-6 p-7">
            <div aria-hidden className="flex items-center justify-between gap-3 rounded-2xl bg-paper p-4">
              <span className="btn-primary pointer-events-none px-4 py-2 text-sm">Connect wallet</span>
              <span className="text-right text-sm leading-tight text-muted">
                <span className="amount block whitespace-nowrap font-semibold text-ink">~0.004 USDC</span>
                per invoice
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-semibold tracking-tight">No sign-up, no monthly fee</h3>
              <p className="leading-relaxed text-muted">
                Connect a wallet and send your first invoice. You only pay a fraction of a cent in network fees.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="know" className="card reveal grid gap-8 p-8 sm:p-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
        <h2 id="know" className="font-display text-3xl font-semibold tracking-tight">
          Good to know
        </h2>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {GOOD_TO_KNOW.map(([title, body]) => (
            <div key={title}>
              <dt className="font-semibold">{title}</dt>
              <dd className="mt-1 text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="reveal flex flex-col items-start gap-6 rounded-[2rem] bg-accent-soft px-8 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-12">
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Send your first invoice today.</h2>
          <p className="text-muted">It takes about a minute. All you need is a wallet with a little USDC.</p>
        </div>
        <div className="shrink-0">
          <CtaLink href="/new" large>
            Create an invoice
          </CtaLink>
        </div>
      </section>
    </div>
  );
}
