"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", background: "#F6F7F7", color: "#16212A", padding: "2rem" }}>
        <h1>Rewind hit an unexpected error.</h1>
        <p>Nothing was marked saved.</p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
