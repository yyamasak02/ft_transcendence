CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_puid TEXT NOT NULL,
  addressee_puid TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (requester_puid) REFERENCES users(puid) ON DELETE CASCADE,
  FOREIGN KEY (addressee_puid) REFERENCES users(puid) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friends_pair ON friends(requester_puid, addressee_puid);
CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_puid);
CREATE INDEX IF NOT EXISTS idx_friends_addressee ON friends(addressee_puid);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
