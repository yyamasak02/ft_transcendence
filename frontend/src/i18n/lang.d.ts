export type Lang = "en" | "ja" | "ita" | "edo";
export type I18nKey = Extract<keyof typeof import("./locale/en").en, string>;
export type I18nDict = Record<I18nKey, string>;
