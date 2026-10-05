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
            className={`rounded-full px-3.5 py-1.5 font-medium transition duration-300 ease-spring ${
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
