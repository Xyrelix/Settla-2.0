import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ConnectButton } from "@/components/ConnectButton";

export default function NotFound() {
  return (
    <>
      <SiteHeader action={<ConnectButton />} />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 pt-12 sm:pt-20">
        <div className="max-w-md space-y-4">
          <p className="eyebrow">404</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">This page isn&apos;t here.</h1>
          <p className="text-muted">The link may be mistyped, or the page was moved.</p>
          <Link href="/" className="btn-primary">
            Back to Settla
          </Link>
        </div>
      </main>
    </>
  );
}
