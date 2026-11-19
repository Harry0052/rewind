"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-col px-4 py-16 md:px-6">
      <h1 className="font-display text-4xl font-semibold">Rewind could not open this page.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">Nothing was marked saved. You can try the page again.</p>
      <button type="button" onClick={() => reset()} className="mt-6 min-h-12 rounded-2xl bg-lime px-5 font-semibold text-ink">
        Try again
      </button>
    </main>
  );
}
