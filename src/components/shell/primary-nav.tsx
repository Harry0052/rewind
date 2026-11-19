"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, LayoutDashboard, Receipt, Settings, type LucideIcon } from "lucide-react";
import type { NavItem } from "./nav";

const icons: Record<NavItem["icon"], LucideIcon> = {
  overview: LayoutDashboard,
  purchases: Receipt,
  cases: FolderOpen,
  settings: Settings,
};

export function PrimaryNav({ items, variant }: { items: NavItem[]; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const activeFor = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  if (variant === "desktop") {
    return (
      <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
        {items.map((item) => {
          const active = activeFor(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-12 items-center rounded-full px-4 text-base font-semibold ${
                active ? "bg-ink text-paper" : "text-ink hover:bg-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur lg:hidden">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = icons[item.icon];
          const active = activeFor(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-xs font-semibold leading-tight ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                <Icon aria-hidden className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
