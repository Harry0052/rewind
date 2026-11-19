import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/http";

export type ApiBody = {
  ok: boolean;
  redirectTo?: string;
  notice?: string;
  error?: { code: string; message: string };
};

export async function readPayload(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  const out: Record<string, string> = {};
  if (type.includes("application/json")) {
    const json = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (json && typeof json === "object") {
      for (const [key, value] of Object.entries(json)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = String(value);
      }
    }
    return out;
  }
  const form = await request.formData();
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function readFormLists(request: Request) {
  const form = await request.formData();
  const fields: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    if (!lists[key]) lists[key] = [];
    lists[key].push(value);
    if (!(key in fields)) fields[key] = value;
  }
  return { fields, lists };
}

export function wantsJson(request: Request) {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

export function safeReturn(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

export function finish(request: Request, status: number, body: ApiBody, fallback: string) {
  if (!wantsJson(request)) {
    const target = new URL(body.redirectTo ?? fallback, request.url);
    if (!body.ok && body.error) target.searchParams.set("error", body.error.code);
    if (body.ok && body.notice) target.searchParams.set("notice", body.notice);
    return NextResponse.redirect(target, 303);
  }
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export function rejectOrigin(request: Request, fallback: string) {
  if (sameOrigin(request)) return null;
  return finish(
    request,
    403,
    { ok: false, error: { code: "origin", message: "Open Rewind in this browser and try again." } },
    fallback,
  );
}
