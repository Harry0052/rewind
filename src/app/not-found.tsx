import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-col px-4 py-16 md:px-6">
      <p className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">Missing</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">That page is not in Rewind.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">The link may be old, or the record may belong to another browser.</p>
      <Link href="/" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-lime px-5 font-semibold text-ink">
        Back to overview
      </Link>
    </main>
  );
}
