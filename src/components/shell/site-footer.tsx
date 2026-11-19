import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm leading-6 text-muted md:px-6">
        <p>
          Rewind calculates windows from policies stored in this app. It does not contact stores, and it does not refund you.
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/policies" className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4">
            Sample policies
          </Link>
          <Link href="/limits" className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-4">
            What Rewind cannot do
          </Link>
        </p>
      </div>
    </footer>
  );
}
