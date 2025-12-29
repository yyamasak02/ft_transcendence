// src/i18n/LangManager.ts
import { en } from "./locale/en";
import { ja } from "./locale/ja";
import { edo } from "./locale/edo";
import type { Lang, I18nKey, I18nDict } from "./lang";

const LANG_KEY = "app_lang";

export class LangManager extends EventTarget {
  private _lang: Lang;
  private readonly _dict: Record<Lang, I18nDict>;

  constructor(defaultLang: Lang = "en") {
    super();

    this._dict = { en, ja, edo };

    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    this._lang = stored && stored in this._dict ? stored : defaultLang;
  }

  get lang(): Lang {
    return this._lang;
  }

  word(key: I18nKey): string {
    return this._dict[this._lang][key];
  }

  setLang(lang: Lang): void {
    if (lang === this._lang) return;
    if (!(lang in this._dict)) return;

    this._lang = lang;
    localStorage.setItem(LANG_KEY, lang);

    this.dispatchEvent(new CustomEvent<Lang>("change", { detail: lang }));
  }
}
