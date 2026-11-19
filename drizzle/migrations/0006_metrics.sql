CREATE TABLE metric_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX metric_events_kind_idx ON metric_events(kind, created_at);
