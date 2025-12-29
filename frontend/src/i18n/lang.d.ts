export type Lang = "en" | "ja" | "edo";
export type I18nKey = keyof typeof import("./en").en;
export type I18nDict = Record<I18nKey, string>;
