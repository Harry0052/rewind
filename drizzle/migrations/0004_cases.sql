CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL UNIQUE REFERENCES opportunities(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  result_amount_minor INTEGER,
  result_currency TEXT,
  recorded_sent_at TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX cases_user_idx ON cases(user_id, status);
