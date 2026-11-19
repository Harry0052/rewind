import { wantsJson } from "@/lib/api";

export function invalidPurchase(
  request: Request,
  path: string,
  code: string,
  fields: Record<string, string>,
  lists: Record<string, string[]>,
) {
  if (wantsJson(request)) {
    return Response.json(
      { ok: false, error: { code, message: code } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  const params = new URLSearchParams();
  params.set("error", code);
  params.set("merchant", (fields.merchant_name ?? "").slice(0, 80));
  params.set("bought_on", (fields.bought_on ?? "").slice(0, 10));
  params.set("currency", (fields.currency ?? "").slice(0, 8));
  params.set("note", (fields.note ?? "").slice(0, 500));
  const descriptions = lists.item_description ?? [];
  const quantities = lists.item_quantity ?? [];
  const prices = lists.item_price ?? [];
  for (let index = 0; index < Math.min(8, Math.max(descriptions.length, prices.length)); index += 1) {
    params.set(`item_${index}_description`, (descriptions[index] ?? "").slice(0, 140));
    params.set(`item_${index}_quantity`, (quantities[index] ?? "").slice(0, 2));
    params.set(`item_${index}_price`, (prices[index] ?? "").slice(0, 12));
  }
  return Response.redirect(new URL(`${path}?${params.toString()}`, request.url), 303);
}
