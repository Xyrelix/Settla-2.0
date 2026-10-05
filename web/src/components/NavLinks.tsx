"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/new", label: "New invoice" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <div className="flex gap-1 text-sm">
      {LINKS.map(({ href, label }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 font-medium transition duration-200 ${
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
