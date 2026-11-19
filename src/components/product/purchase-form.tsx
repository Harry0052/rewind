import { buttonClass } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { errorMessage } from "@/lib/messages";
import { LiveTotal } from "./live-total";

export type FormSlot = { description: string; quantity: string; price: string };

export function PurchaseForm({
  action,
  defaults,
  error,
  submitLabel,
}: {
  action: string;
  defaults: {
    merchant: string;
    boughtOn: string;
    currency: string;
    note: string;
    slots: FormSlot[];
    maxDate: string;
  };
  error?: string;
  submitLabel: string;
}) {
  const message = errorMessage(error);
  return (
    <form id="purchase-form" action={action} method="post" className="flex flex-col gap-5">
      {message ? (
        <div role="alert" className="rounded-2xl border-2 border-caution bg-caution-bg px-4 py-3 text-base font-semibold text-caution">
          {message}
        </div>
      ) : null}
      <Field id="merchant_name" label="Store" error={error === "merchant" ? message : null}>
        <input id="merchant_name" name="merchant_name" required maxLength={80} defaultValue={defaults.merchant} className={inputClass} autoComplete="organization" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="bought_on" label="Purchase date" error={error === "date" ? message : null}>
          <input id="bought_on" name="bought_on" type="date" required max={defaults.maxDate} defaultValue={defaults.boughtOn} className={inputClass} />
        </Field>
        <Field id="currency" label="Currency" error={error === "currency" ? message : null}>
          <select id="currency" name="currency" defaultValue={defaults.currency || "USD"} className={inputClass}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
          </select>
        </Field>
      </div>
      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold">Items</legend>
        <p className="text-sm leading-6 text-muted">Leave unused rows blank. The total is the sum of quantity times price, in cents.</p>
        {defaults.slots.map((slot, index) => (
          <div key={index} className="grid gap-3 rounded-2xl border border-line bg-paper p-3 sm:grid-cols-[minmax(0,1fr)_5rem_7rem]">
            <Field id={`item_${index}_description`} label={`Item ${index + 1}`}>
              <input id={`item_${index}_description`} name="item_description" maxLength={140} defaultValue={slot.description} className={inputClass} />
            </Field>
            <Field id={`item_${index}_quantity`} label="Qty">
              <input id={`item_${index}_quantity`} name="item_quantity" inputMode="numeric" defaultValue={slot.quantity || "1"} className={inputClass} />
            </Field>
            <Field id={`item_${index}_price`} label="Price" error={error === "items" && index === 0 ? message : null}>
              <input id={`item_${index}_price`} name="item_price" inputMode="decimal" placeholder="0.00" defaultValue={slot.price} className={`${inputClass} amount`} />
            </Field>
          </div>
        ))}
      </fieldset>
      <LiveTotal currency={defaults.currency || "USD"} />
      <Field id="note" label="Receipt note" hint="Optional. Rewind stores what you type. It does not read a photo or a PDF." error={error === "note" ? message : null}>
        <textarea id="note" name="note" maxLength={2000} rows={3} defaultValue={defaults.note} className={inputClass} />
      </Field>
      <button className={buttonClass("primary", "xl")} type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function emptySlots(): FormSlot[] {
  return Array.from({ length: 5 }, () => ({ description: "", quantity: "1", price: "" }));
}

export function slotsFromQuery(query: Record<string, string | string[] | undefined>, fallback: FormSlot[]) {
  const slots = fallback.map((slot) => ({ ...slot }));
  for (let index = 0; index < slots.length; index += 1) {
    const description = one(query[`item_${index}_description`]);
    const quantity = one(query[`item_${index}_quantity`]);
    const price = one(query[`item_${index}_price`]);
    if (description || quantity || price) {
      slots[index] = { description, quantity: quantity || "1", price };
    }
  }
  return slots;
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
