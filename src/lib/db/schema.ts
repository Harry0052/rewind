import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  kind: text("kind").notNull(),
  timezone: text("timezone").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const securityEvents = sqliteTable(
  "security_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    kind: text("kind").notNull(),
    metadataJson: text("metadata_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("security_events_user_idx").on(table.userId, table.createdAt)],
);

export const rateBuckets = sqliteTable("rate_buckets", {
  bucketKey: text("bucket_key").primaryKey(),
  windowStart: text("window_start").notNull(),
  count: integer("count").notNull(),
});

export const policies = sqliteTable(
  "policies",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    merchantName: text("merchant_name").notNull(),
    merchantKey: text("merchant_key").notNull(),
    policyType: text("policy_type").notNull(),
    version: integer("version").notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceTitle: text("source_title").notNull(),
    recordedAt: text("recorded_at").notNull(),
    timezone: text("timezone").notNull(),
    windowDays: integer("window_days").notNull(),
    inclusive: integer("inclusive").notNull(),
    currency: text("currency").notNull(),
    minAmountMinor: integer("min_amount_minor"),
    conditionsNote: text("conditions_note").notNull(),
    isDemo: integer("is_demo").notNull(),
    supersededAt: text("superseded_at"),
  },
  (table) => [index("policies_merchant_idx").on(table.merchantKey, table.policyType, table.supersededAt)],
);

export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    merchantName: text("merchant_name").notNull(),
    merchantKey: text("merchant_key").notNull(),
    boughtOn: text("bought_on").notNull(),
    currency: text("currency").notNull(),
    totalAmountMinor: integer("total_amount_minor").notNull(),
    note: text("note"),
    isDemo: integer("is_demo").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("purchases_user_idx").on(table.userId, table.boughtOn)],
);

export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    purchaseId: text("purchase_id")
      .notNull()
      .references(() => purchases.id),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    lineTotalMinor: integer("line_total_minor").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("items_purchase_idx").on(table.purchaseId, table.position)],
);

export const receipts = sqliteTable(
  "receipts",
  {
    id: text("id").primaryKey(),
    purchaseId: text("purchase_id")
      .notNull()
      .references(() => purchases.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(),
    extractionStatus: text("extraction_status").notNull(),
    note: text("note"),
    originalName: text("original_name"),
    mimeType: text("mime_type"),
    byteSize: integer("byte_size"),
    storageKey: text("storage_key"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("receipts_purchase_idx").on(table.purchaseId), index("receipts_user_idx").on(table.userId)],
);

export const opportunities = sqliteTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    purchaseId: text("purchase_id")
      .notNull()
      .references(() => purchases.id),
    policyId: text("policy_id")
      .notNull()
      .references(() => policies.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(),
    status: text("status").notNull(),
    deadline: text("deadline").notNull(),
    estimatedAmountMinor: integer("estimated_amount_minor"),
    currency: text("currency").notNull(),
    explanation: text("explanation").notNull(),
    evaluatedAt: text("evaluated_at").notNull(),
  },
  (table) => [
    index("opportunities_user_idx").on(table.userId, table.status),
    index("opportunities_purchase_idx").on(table.purchaseId),
  ],
);

export const cases = sqliteTable(
  "cases",
  {
    id: text("id").primaryKey(),
    opportunityId: text("opportunity_id")
      .notNull()
      .unique()
      .references(() => opportunities.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    evidenceJson: text("evidence_json").notNull(),
    resultAmountMinor: integer("result_amount_minor"),
    resultCurrency: text("result_currency"),
    recordedSentAt: text("recorded_sent_at"),
    resolvedAt: text("resolved_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("cases_user_idx").on(table.userId, table.status)],
);

export const metricEvents = sqliteTable(
  "metric_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    kind: text("kind").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("metric_events_kind_idx").on(table.kind, table.createdAt)],
);
