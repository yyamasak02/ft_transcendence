CREATE TABLE IF NOT EXISTS match_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_puid TEXT NOT NULL,
  guest_puid TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_puid) REFERENCES users(puid) ON DELETE CASCADE,
  FOREIGN KEY (guest_puid) REFERENCES users(puid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_match_sessions_owner_puid ON match_sessions(owner_puid);
CREATE INDEX IF NOT EXISTS idx_match_sessions_guest_puid ON match_sessions(guest_puid);
CREATE INDEX IF NOT EXISTS idx_match_sessions_created_at ON match_sessions(created_at);

ALTER TABLE match_results ADD COLUMN match_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);
