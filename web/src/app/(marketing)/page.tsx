import Link from "next/link";
import { StatusBadge } from "@/components/InvoiceCard";
import { CtaLink } from "@/components/CtaLink";
import { Status } from "@/lib/settla";

const STEPS = [
  ["Write the invoice", "Type the amount and what it's for. One tap in your wallet puts it on Arc."],
  ["Share the link", "Send it on WhatsApp or email, or let your customer scan the code at the counter."],
  ["Get paid", "They pay in USDC and the money lands in your wallet about a second later."],
];

const REASONS = [
  ["It goes straight to you", "Payments move from your customer's wallet to yours. Settla never touches the money, so there's nothing to withdraw and no one to wait on."],
  ["Paid in about a second", "Arc confirms a payment the moment it happens. No “pending” for days, no chasing a transfer that hasn't arrived."],
  ["One currency for everything", "Even the network fee is paid in USDC, a dollar stablecoin. You never need to buy a second coin just to get paid."],
  ["No sign-up, no monthly fee", "Connect a wallet and send your first invoice. Each invoice costs a fraction of a cent in network fees."],
];

const GOOD_TO_KNOW = [
  ["Notes are public.", "Invoices live on a public blockchain, so keep names and phone numbers out of the note."],
  ["Two taps the first time.", "A new customer approves USDC once, then pays. After that it's one tap."],
  ["You hold the keys.", "Settla can't freeze, reverse, or take a payment. That also means a lost wallet can't be recovered by us."],
  ["Early days.", "Settla is a proof of concept and hasn't been audited. Start with small amounts."],
];

function ReceiptPreview() {
  return (
    <div aria-hidden className="rise relative mx-auto w-full max-w-sm select-none py-6 [animation-delay:350ms]">
      {/* A second receipt peeking out behind, for depth. */}
      <div className="card absolute inset-x-6 top-0 h-full translate-y-3 opacity-70 md:translate-y-0 md:-rotate-3" />
      <div className="card relative overflow-hidden md:rotate-1">
        <div className="space-y-5 p-7">
          <div className="flex items-center justify-between">
            <span className="amount text-sm text-muted">Invoice #1042</span>
            <StatusBadge status={Status.Paid} />
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
          <p className="rounded-xl bg-paid-soft px-4 py-2.5 font-medium text-paid">Paid 0.8 seconds after scanning.</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="space-y-24 sm:space-y-32">
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
        <div className="space-y-7">
          <p className="eyebrow rise">For small shops &amp; freelancers</p>
          <h1 className="rise max-w-2xl font-display [animation-delay:80ms] text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
            Get paid in dollars, the moment your customer pays.
          </h1>
          <p className="rise max-w-[34rem] text-lg leading-relaxed text-muted [animation-delay:160ms]">
            Settla turns an amount and a note into a link your customer can pay in USDC. The money goes straight
            to your wallet. No bank delays, no card fees, no middleman holding your cash.
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
            Three steps. No paperwork.
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
            Why shop owners like it
          </h2>
        </div>
        <div className="grid gap-x-16 gap-y-10 sm:grid-cols-2">
          {REASONS.map(([title, body]) => (
            <div key={title} className="reveal space-y-2 border-t-2 border-accent/30 pt-5">
              <h3 className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
              <p className="max-w-md leading-relaxed text-muted">{body}</p>
            </div>
          ))}
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
