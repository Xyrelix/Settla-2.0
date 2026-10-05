"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
];

// Pages that show their own title in the nav instead of the links.
const TITLES: Record<string, string> = {
  "/new": "Create an invoice",
};

export function NavLinks() {
  const path = usePathname();
  const title = TITLES[path];

  if (title) {
    return <p className="whitespace-nowrap font-display text-sm font-semibold tracking-tight min-[400px]:text-base sm:text-lg">{title}</p>;
  }

  return (
    <div className="flex gap-1 text-sm">
      {LINKS.map(({ href, label }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-full px-3.5 font-medium transition duration-300 ease-spring ${
              active ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
