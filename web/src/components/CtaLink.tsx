import Link from "next/link";

/** Primary pill link with its arrow nested in its own circle; the arrow nudges on hover. */
export function CtaLink({ href, children, large }: { href: string; children: React.ReactNode; large?: boolean }) {
  return (
    <Link href={href} className={`btn-primary group gap-3 py-1.5 pr-1.5 ${large ? "pl-6 text-lg" : "pl-5"}`}>
      {children}
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-full bg-accent-ink/15 transition-transform duration-500 ease-spring group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 ${
          large ? "size-10" : "size-8"
        }`}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
          <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
