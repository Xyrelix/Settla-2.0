import { SiteHeader } from "@/components/SiteHeader";
import { LandingWallet } from "@/components/LandingWallet";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader action={<LandingWallet />} />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 scroll-mt-28 px-5 pb-24 pt-12 sm:pt-20">
        {children}
      </main>
    </>
  );
}
