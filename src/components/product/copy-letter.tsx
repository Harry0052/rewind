"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";

export function CopyLetter({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={buttonClass("secondary")}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState("copied");
          } catch {
            setState("failed");
          }
        }}
      >
        Copy letter
      </button>
      <p role="status" className="text-sm text-muted">
        {state === "copied" ? "Copied. Rewind did not send it." : null}
        {state === "failed" ? "Copy failed. Select the letter and copy it yourself." : null}
        {state === "idle" ? "Copy stays on this device. Nothing is emailed." : null}
      </p>
    </div>
  );
}
