import { LangManager } from "./LangManager";
import type { I18nKey } from "./lang";

export const langManager = new LangManager("en");
export function word(key: I18nKey): string {
  return langManager.word(key);
}
