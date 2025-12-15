// src/i18n/index.ts
import { en } from "./en";
import { ja } from "./ja";
import { edo } from "./edo";

export const dict = { en, ja, edo} as const;
export type Lang = "en" | "ja" | "edo";

type I18nKey = keyof typeof en;
let currentLang: Lang = "en";

export function word(key: I18nKey): string {
	return dict[currentLang][key];
}

export function setLang(lang: Lang) {
	currentLang = lang;
}

export function getLang(): Lang {
	return currentLang;
}