import { SiteHeader } from "@/components/SiteHeader";
import { NavLinks } from "@/components/NavLinks";
import { ConnectButton } from "@/components/ConnectButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader nav={<NavLinks />} action={<ConnectButton />} />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 scroll-mt-28 px-5 pb-24 pt-12 sm:pt-16">
        {children}
      </main>
    </>
  );
}
