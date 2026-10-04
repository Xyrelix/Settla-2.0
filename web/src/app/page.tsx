import { CreateInvoiceForm } from "@/components/CreateInvoiceForm";
import { SETTLA_ADDRESS } from "@/lib/settla";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Get paid in USDC. Settled in a second.</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Create an invoice, share the link, and your customer pays straight to your wallet on Arc.
          Settla never holds your money, and gas is paid in USDC, so it is the only asset you need.
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-lg font-semibold">New invoice</h2>
        {SETTLA_ADDRESS ? (
          <CreateInvoiceForm />
        ) : (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Set <code>NEXT_PUBLIC_SETTLA_ADDRESS</code> in <code>web/.env.local</code> to the deployed contract
            address, then restart the dev server.
          </p>
        )}
      </section>

      <ol className="grid gap-4 text-sm sm:grid-cols-3">
        {[
          ["1. Create", "Enter an amount and a memo. One transaction opens the invoice."],
          ["2. Share", "Send the pay link to your customer by email, chat, or QR code."],
          ["3. Settle", "They approve and pay. USDC lands in your wallet instantly."],
        ].map(([title, body]) => (
          <li key={title} className="space-y-1">
            <p className="font-medium">{title}</p>
            <p className="text-neutral-600 dark:text-neutral-400">{body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
