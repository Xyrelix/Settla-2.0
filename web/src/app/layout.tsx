import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: { default: "Settla: get paid in USDC", template: "%s · Settla" },
  description: "Invoices for small businesses, paid in USDC straight to your wallet on Arc. Settla never holds your money.",
  openGraph: {
    title: "Settla: get paid in USDC",
    description: "Invoices for small businesses, paid in USDC straight to your wallet on Arc.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1511" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only rounded-lg bg-accent px-3 py-2 text-accent-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10"
        >
          Skip to content
        </a>
        <Providers>
          {children}
          <footer className="border-t border-line/70">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 py-6 text-center text-sm text-muted md:flex-row md:justify-between md:gap-6">
              <span>Non-custodial. Payments go straight to the merchant.</span>
              <span>Unaudited proof of concept on Arc.</span>
              <a href="https://github.com/Xyrelix/Settla" className="underline-offset-4 hover:text-ink hover:underline">
                Source on GitHub
              </a>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
