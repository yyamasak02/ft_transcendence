import { LangManager } from "./class/LangManager";
import type { I18nKey } from "./lang";

export const langManager = new LangManager("en");
export function word(key: I18nKey): string {
  return langManager.word(key);
}

// DOMに紐づくi18nテキストノードを生成（data-i18n付与）
export function t(key: I18nKey): string {
  const text = langManager.word(key);
  // Use a custom inline element with no semantics
  return `<i18n-t data-i18n="${key}">${text}</i18n-t>`;
}

// 属性を翻訳する（例: `${i18nAttr('placeholder','username')}`）
export function i18nAttr(
  attr: "placeholder" | "title" | "aria-label" | "alt",
  key: I18nKey,
): string {
  const val = langManager.word(key);
  return `${attr}="${val}" data-i18n-attr="${attr}:${key}"`;
}
