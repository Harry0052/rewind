import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { shellNav } from "@/components/shell/nav";
import { PrimaryNav } from "@/components/shell/primary-nav";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import "./globals.css";

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Rewind",
    template: "%s · Rewind",
  },
  description:
    "Rewind shows return, warranty, and price-adjustment windows from policies it has on file. It does not contact stores or refund you.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await readSessionUser(getDb());
  const items = shellNav();
  const displayName = user?.displayName ? user.displayName : "This browser";

  return (
    <html lang="en" className={`${source.variable} ${fraunces.variable} h-full`}>
      <body className="flex min-h-full flex-col pb-24 font-sans text-ink antialiased lg:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <SiteHeader items={items} displayName={displayName} />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <PrimaryNav items={items} variant="mobile" />
      </body>
    </html>
  );
}
