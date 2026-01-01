export type Lang = "en" | "ja" | "edo";
export type I18nKey = Extract<keyof typeof import("./locale/en").en, string>;
export type I18nDict = Record<I18nKey, string>;
