import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "./providers";
import { ConnectButton } from "@/components/ConnectButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Settla",
  description: "Non-custodial USDC invoicing for small businesses, on Arc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <header className="border-b border-neutral-200 dark:border-neutral-800">
            <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Settla
              </Link>
              <Link href="/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
                Dashboard
              </Link>
              <div className="ml-auto">
                <ConnectButton />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
