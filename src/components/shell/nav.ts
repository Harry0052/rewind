export type NavItem = {
  href: string;
  label: string;
  icon: "overview" | "purchases" | "cases" | "settings";
};

export function shellNav(): NavItem[] {
  return [
    { href: "/", label: "Overview", icon: "overview" },
    { href: "/purchases", label: "Purchases", icon: "purchases" },
    { href: "/cases", label: "Cases", icon: "cases" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];
}
