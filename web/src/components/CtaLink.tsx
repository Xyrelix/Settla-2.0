import Link from "next/link";
import { ArrowUpRight } from "./Icons";

/** Primary pill link with its arrow nested in its own circle; the arrow nudges on hover. */
export function CtaLink({
  href,
  children,
  large,
  shimmer,
}: {
  href: string;
  children: React.ReactNode;
  large?: boolean;
  shimmer?: boolean;
}) {
  return (
    <Link href={href} className={`btn-primary group gap-3 py-1.5 pr-1.5 ${large ? "pl-6 text-lg" : "pl-5"} ${shimmer ? "shimmer" : ""}`}>
      {children}
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-full bg-accent-ink/15 transition-transform duration-500 ease-spring group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 ${
          large ? "size-10" : "size-8"
        }`}
      >
        <ArrowUpRight className="size-4" stroke={2} />
      </span>
    </Link>
  );
}
