"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Invoices", v2: false },
  { href: "/plans", label: "Subscriptions", v2: true },
  { href: "/history", label: "History", v2: true },
];

const TITLES: Record<string, string> = {
  "/new": "Create an invoice",
  "/plans/new": "New subscription plan",
};

export function NavLinks() {
  const path = usePathname();
  const title = TITLES[path];

  if (title) {
    return (
      <p className="whitespace-nowrap font-display text-sm font-semibold tracking-tight min-[400px]:text-base sm:text-lg">
        {title}
      </p>
    );
  }

  return (
    <div className="flex gap-1 text-sm">
      {LINKS.map(({ href, label, v2 }) => {
        const active = path === href || path.startsWith(href + "/");
        const activeClass = v2
          ? "text-white"
          : "bg-accent-soft text-accent";
        const activeStyle = v2 && active
          ? { background: "var(--sub)", color: "#fff" }
          : undefined;

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-full px-3.5 font-medium transition duration-300 ease-spring ${
              active ? activeClass : "text-muted hover:text-ink"
            }`}
            style={activeStyle}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
