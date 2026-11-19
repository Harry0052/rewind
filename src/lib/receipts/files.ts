import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { recordEvent } from "@/lib/audit";
import type { RewindDb } from "@/lib/db/client";
import { purchases, receipts } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";

const MAX_BYTES = 5_000_000;

const TYPES = [
  { mime: "application/pdf", ext: "pdf" },
  { mime: "image/png", ext: "png" },
  { mime: "image/jpeg", ext: "jpg" },
  { mime: "image/webp", ext: "webp" },
] as const;

export function uploadsRoot() {
  return path.resolve(process.cwd(), "data", "uploads");
}

export function detectFile(bytes: Buffer) {
  if (bytes.length < 12 || bytes.length > MAX_BYTES) return null;
  if (bytes.subarray(0, 4).toString("utf8") === "%PDF") return TYPES[0];
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return TYPES[1];
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return TYPES[2];
  if (bytes.subarray(0, 4).toString("utf8") === "RIFF" && bytes.subarray(8, 12).toString("utf8") === "WEBP") return TYPES[3];
  return null;
}

export function resolveStoredFile(storageKey: string) {
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}$/i.test(storageKey)) return null;
  const root = uploadsRoot();
  const full = path.resolve(root, storageKey);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

export function listPurchaseFiles(db: RewindDb, purchaseId: string, userId: string | null) {
  const purchase = db.select().from(purchases).where(eq(purchases.id, purchaseId)).get();
  if (!purchase) return [];
  if (purchase.isDemo !== 1 && purchase.userId !== userId) return [];
  return db
    .select()
    .from(receipts)
    .where(and(eq(receipts.purchaseId, purchaseId), eq(receipts.kind, "file")))
    .all()
    .filter((row) => purchase.isDemo === 1 || row.userId === userId);
}

export function saveReceiptFile(db: RewindDb, userId: string, purchaseId: string, originalName: string, bytes: Buffer) {
  const purchase = db.select().from(purchases).where(and(eq(purchases.id, purchaseId), eq(purchases.userId, userId))).get();
  if (!purchase || purchase.isDemo === 1) {
    return { ok: false as const, code: "not_found" as const, message: "That purchase is not in this browser." };
  }
  const detected = detectFile(bytes);
  if (!detected) {
    return {
      ok: false as const,
      code: "file" as const,
      message: "Attach a PDF, PNG, JPEG, or WEBP under 5 MB. Rewind did not store that file.",
    };
  }
  const id = randomUUID();
  const storageKey = `${userId}/${id}`;
  const full = resolveStoredFile(storageKey);
  if (!full) return { ok: false as const, code: "file" as const, message: "Rewind could not store that file." };
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, bytes);
  const safeName = originalName.replace(/[^\w. -]/g, "").slice(0, 80) || `receipt.${detected.ext}`;
  db.insert(receipts)
    .values({
      id,
      purchaseId,
      userId,
      kind: "file",
      extractionStatus: "not_scanned",
      note: null,
      originalName: safeName,
      mimeType: detected.mime,
      byteSize: bytes.length,
      storageKey,
      createdAt: nowIso(),
    })
    .run();
  recordEvent(db, userId, "receipt_uploaded", { receiptId: id, byteSize: bytes.length, mime: detected.mime });
  return { ok: true as const, id };
}

export function readOwnedReceipt(db: RewindDb, receiptId: string, userId: string | null) {
  const row = db.select().from(receipts).where(eq(receipts.id, receiptId)).get();
  if (!row || row.kind !== "file" || row.userId !== userId || !row.storageKey || !row.mimeType) return null;
  const full = resolveStoredFile(row.storageKey);
  if (!full || !fs.existsSync(full)) return null;
  return { row, bytes: fs.readFileSync(full) };
}

export function deleteReceiptFile(db: RewindDb, userId: string, receiptId: string) {
  const row = db.select().from(receipts).where(and(eq(receipts.id, receiptId), eq(receipts.userId, userId))).get();
  if (!row || row.kind !== "file") return { ok: false as const, code: "not_found" as const, message: "That file is not in this browser." };
  if (row.storageKey) {
    const full = resolveStoredFile(row.storageKey);
    if (full && fs.existsSync(full)) fs.rmSync(full);
  }
  db.delete(receipts).where(eq(receipts.id, receiptId)).run();
  recordEvent(db, userId, "receipt_deleted", { receiptId });
  return { ok: true as const, purchaseId: row.purchaseId };
}

export function removeStoredFiles(keys: string[]) {
  for (const key of keys) {
    const full = key ? resolveStoredFile(key) : null;
    if (full && fs.existsSync(full)) fs.rmSync(full);
  }
}
