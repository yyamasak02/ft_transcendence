export const parseSqliteTimestamp = (value: string) => {
  const normalized = value.replace(" ", "T");
  return new Date(`${normalized}Z`);
};

export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export const isRecentlyActive = (
  value: string | null,
  thresholdMs: number,
) => {
  if (!value) return false;
  const parsed = parseSqliteTimestamp(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return Date.now() - parsed.getTime() <= thresholdMs;
};
