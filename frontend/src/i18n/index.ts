import { LangManager } from "./class/LangManager";
import type { I18nKey } from "./lang";

export const langManager = new LangManager("en");
export function word(key: I18nKey): string {
  return langManager.word(key);
}

// DOMに紐づくi18nテキストノードを生成（data-i18n付与）
export function t(key: I18nKey): string {
	const raw = langManager.word(key);

	// 辞書にない or undefinedの時に落とさない
	const text = typeof raw === "string" ? raw : `[missing:${String(key)}]`;
  // const text = langManager.word(key);
  // HTMLエスケープ（XSS対策）
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return `<span data-i18n="${key}">${escaped}</span>`;
}

// 属性を翻訳する（例: `${i18nAttr('placeholder','username')}`）
export function i18nAttr(
  attr: "placeholder" | "title" | "aria-label" | "alt",
  key: I18nKey,
): string {
  const val = langManager.word(key);
  return `${attr}="${val}" data-i18n-attr="${attr}:${key}"`;
}
