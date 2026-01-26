export type LangKey = "en" | "ja" | "edo";

const TIME_ZONE = "Asia/Tokyo";

export const parseMatchDate = (value: string) => {
  const normalized = value.replace(" ", "T");
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized);
  const withZone = hasTimezone ? normalized : `${normalized}Z`;
  const parsed = new Date(withZone);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  return null;
};

export const formatDateByLang = (date: Date, lang: LangKey) => {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }).format(date);
};

export const formatMatchDate = (value: string, lang: LangKey) => {
  const date = parseMatchDate(value);
  if (!date) return value;
  return formatDateByLang(date, lang);
};
