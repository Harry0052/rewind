CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL,
  timezone TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions(user_id);

CREATE TABLE security_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  kind TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX security_events_user_idx ON security_events(user_id, created_at);

CREATE TABLE rate_buckets (
  bucket_key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL
);

CREATE TABLE policies (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  merchant_name TEXT NOT NULL,
  merchant_key TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  timezone TEXT NOT NULL,
  window_days INTEGER NOT NULL,
  inclusive INTEGER NOT NULL,
  currency TEXT NOT NULL,
  min_amount_minor INTEGER,
  conditions_note TEXT NOT NULL,
  is_demo INTEGER NOT NULL,
  superseded_at TEXT
);
CREATE INDEX policies_merchant_idx ON policies(merchant_key, policy_type, superseded_at);
