CREATE TABLE IF NOT EXISTS match_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_puid TEXT NOT NULL,
  guest_puid TEXT,
  owner_score INTEGER NOT NULL,
  guest_score INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_puid) REFERENCES users(puid) ON DELETE CASCADE,
  FOREIGN KEY (guest_puid) REFERENCES users(puid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_match_results_owner_puid ON match_results(owner_puid);
CREATE INDEX IF NOT EXISTS idx_match_results_guest_puid ON match_results(guest_puid);
CREATE INDEX IF NOT EXISTS idx_match_results_created_at ON match_results(created_at);
