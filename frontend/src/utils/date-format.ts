export type LangKey = "en" | "ja" | "ita" | "edo";

const TIME_ZONE = "Asia/Tokyo";

const parseMatchDate = (value: string) => {
  const normalized = value.replace(" ", "T");
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized);
  const withZone = hasTimezone ? normalized : `${normalized}Z`;
  const parsed = new Date(withZone);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  return null;
};

const formatDateByLang = (date: Date, lang: LangKey) => {
  const localeMap: Record<LangKey, string> = {
    ja: "ja-JP",
    en: "en-US",
    ita: "it-IT",
    edo: "ja-JP",
  };
  return new Intl.DateTimeFormat(localeMap[lang], {
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
