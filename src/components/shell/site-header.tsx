import Link from "next/link";
import { Mark } from "./mark";
import { PrimaryNav } from "./primary-nav";
import type { NavItem } from "./nav";

export function SiteHeader({ items, displayName }: { items: NavItem[]; displayName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex min-h-12 items-center gap-2.5 rounded-xl">
          <Mark />
          <span className="font-display text-2xl leading-none font-semibold tracking-tight">Rewind</span>
        </Link>
        <PrimaryNav items={items} variant="desktop" />
        <p className="hidden max-w-40 truncate text-sm text-muted xl:block">{displayName}</p>
      </div>
    </header>
  );
}
