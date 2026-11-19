"use client";

import { useEffect, useState } from "react";
import { formatMinor, multiplyMinor, parseMajorToMinor, sumMinor } from "@/lib/money";

export function LiveTotal({ currency }: { currency: string }) {
  const [text, setText] = useState("The saved total is the sum of the lines.");

  useEffect(() => {
    const form = document.getElementById("purchase-form");
    if (!(form instanceof HTMLFormElement)) return;
    const update = () => {
      const data = new FormData(form);
      const descriptions = data.getAll("item_description").map(String);
      const quantities = data.getAll("item_quantity").map(String);
      const prices = data.getAll("item_price").map(String);
      const chosen = String(data.get("currency") ?? currency);
      const lines: number[] = [];
      let invalid = false;
      for (let index = 0; index < descriptions.length; index += 1) {
        const description = descriptions[index]?.trim() ?? "";
        const price = prices[index]?.trim() ?? "";
        if (!description && !price) continue;
        try {
          const unit = parseMajorToMinor(price);
          const quantity = Number(quantities[index] || "1");
          if (!Number.isInteger(quantity) || quantity < 1) throw new Error("quantity");
          lines.push(multiplyMinor(unit, quantity));
        } catch {
          invalid = true;
        }
      }
      if (invalid) {
        setText("Check the prices. Rewind will not save a total it cannot add in cents.");
        return;
      }
      if (lines.length === 0) {
        setText("Add a price to preview the total. Nothing is saved until you press the button.");
        return;
      }
      setText(`Preview ${formatMinor(sumMinor(lines), chosen)}. Rewind saves this sum in cents, not a number you type.`);
    };
    form.addEventListener("input", update);
    update();
    return () => form.removeEventListener("input", update);
  }, [currency]);

  return (
    <p aria-live="polite" className="amount rounded-2xl bg-sand px-4 py-3 text-base font-semibold">
      {text}
    </p>
  );
}
