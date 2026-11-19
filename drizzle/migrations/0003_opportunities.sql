CREATE TABLE opportunities (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id),
  policy_id TEXT NOT NULL REFERENCES policies(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  deadline TEXT NOT NULL,
  estimated_amount_minor INTEGER,
  currency TEXT NOT NULL,
  explanation TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  UNIQUE (purchase_id, policy_id)
);
CREATE INDEX opportunities_user_idx ON opportunities(user_id, status);
CREATE INDEX opportunities_purchase_idx ON opportunities(purchase_id);
