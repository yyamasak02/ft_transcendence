ALTER TABLE match_sessions ADD COLUMN owner_name TEXT;
ALTER TABLE match_sessions ADD COLUMN guest_name TEXT;

ALTER TABLE match_results ADD COLUMN owner_name TEXT;
ALTER TABLE match_results ADD COLUMN guest_name TEXT;
