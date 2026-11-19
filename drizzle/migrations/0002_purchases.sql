CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  merchant_name TEXT NOT NULL,
  merchant_key TEXT NOT NULL,
  bought_on TEXT NOT NULL,
  currency TEXT NOT NULL,
  total_amount_minor INTEGER NOT NULL,
  note TEXT,
  is_demo INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX purchases_user_idx ON purchases(user_id, bought_on);

CREATE TABLE items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_minor INTEGER NOT NULL,
  line_total_minor INTEGER NOT NULL,
  position INTEGER NOT NULL
);
CREATE INDEX items_purchase_idx ON items(purchase_id, position);

CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  extraction_status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX receipts_purchase_idx ON receipts(purchase_id);
CREATE INDEX receipts_user_idx ON receipts(user_id);
