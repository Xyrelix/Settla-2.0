import Link from "next/link";

/** Floating nav island: logo left, optional `nav` centred, `action` right. */
export function SiteHeader({ nav, action }: { nav?: React.ReactNode; action: React.ReactNode }) {
  return (
    <header className="sticky top-3 z-20 px-3 sm:top-5 sm:px-5">
      <nav className="island mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-x-3 rounded-[1.75rem] py-2 pl-3 pr-2 sm:gap-x-5 sm:pl-4">
        <Link
          href="/"
          translate="no"
          className="flex w-fit items-center gap-2 font-display text-xl font-semibold tracking-tight"
        >
          <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-accent text-sm text-accent-ink">
            S
          </span>
          <span className="hidden min-[360px]:inline">Settla</span>
        </Link>
        <div>{nav}</div>
        <div className="justify-self-end">{action}</div>
      </nav>
    </header>
  );
}
