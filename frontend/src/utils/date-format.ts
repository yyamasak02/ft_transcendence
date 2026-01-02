export type LangKey = "en" | "ja" | "edo";

const TIME_ZONE = "Asia/Tokyo";

export const parseMatchDate = (value: string) => {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const normalized = value.replace(" ", "T");
  const withZone = normalized.endsWith("Z") ? normalized : `${normalized}Z`;
  const fallback = new Date(withZone);
  if (!Number.isNaN(fallback.getTime())) return fallback;
  return null;
};

export const formatDateByLang = (date: Date, lang: LangKey) => {
  if (lang === "ja") {
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: TIME_ZONE,
    }).format(date);
  }
  if (lang === "edo") {
    const edoDate = new Date(date.getTime());
    edoDate.setFullYear(edoDate.getFullYear() - 300);
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: TIME_ZONE,
    }).format(edoDate);
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatMatchDate = (value: string, lang: LangKey) => {
  const date = parseMatchDate(value);
  if (!date) return value;
  return formatDateByLang(date, lang);
};
