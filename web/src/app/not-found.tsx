import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">This page isn&apos;t here.</h1>
      <p className="text-muted">The link may be mistyped, or the page was moved.</p>
      <Link href="/" className="btn-primary">
        Back to Settla
      </Link>
    </div>
  );
}
