-- One row per project slug; `count` is the number of loves.
CREATE TABLE IF NOT EXISTS loves (
  slug  TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
