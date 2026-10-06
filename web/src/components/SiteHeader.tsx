import Image from "next/image";
import Link from "next/link";

/** Floating nav island: logo left, optional `nav` centred, `action` right. */
export function SiteHeader({ nav, action }: { nav?: React.ReactNode; action: React.ReactNode }) {
  return (
    <header className="sticky top-3 z-20 px-3 sm:top-5 sm:px-5">
      <nav className="island mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-x-3 rounded-[1.75rem] py-2 pl-3 pr-2 sm:gap-x-5 sm:pl-4">
        <Link href="/" translate="no" aria-label="Settla home" className="flex w-fit items-center gap-2 font-display text-xl font-semibold tracking-tight">
          {/* Mark artwork matches the theme; the name is set in the site's own Fraunces. */}
          <Image src="/mark-light.png" alt="" width={185} height={185} priority className="size-8 dark:hidden" />
          <Image src="/mark-dark.png" alt="" width={186} height={186} priority className="hidden size-8 dark:block" />
          <span className="hidden min-[360px]:inline">Settla</span>
        </Link>
        <div>{nav}</div>
        <div className="justify-self-end">{action}</div>
      </nav>
    </header>
  );
}
