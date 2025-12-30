// src/i18n/LangManager.ts
import { en } from "./locale/en";
import { ja } from "./locale/ja";
import { edo } from "./locale/edo";
import type { Lang, I18nKey, I18nDict } from "./lang";

const LANG_KEY = "app_lang";

export class LangManager extends EventTarget {
  private _lang: Lang;
  private readonly _dict: Record<Lang, I18nDict>;
  private _bindingsBootstrapped = false;

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

    // ページコンポーネントを触らずに、表示文字列だけを差し替える
    try {
      this._ensureBindings();
      this._updateBoundNodes();
    } catch (_e) {
      // 失敗しても致命ではない（次回リレンダーで整合する）
    }
  }

  // 明示的に初回のバインディングを構築したい場合に使用
  initDomBindings() {
    try {
      this._ensureBindings();
    } catch (_) {
      // noop
    }
  }

  // 初回に既存DOMへ data-i18n バインディングを付与
  private _ensureBindings() {
    if (this._bindingsBootstrapped) return;
    const dict = this._dict[this._lang];
    const rev = new Map<string, I18nKey>();
    (Object.keys(dict) as I18nKey[]).forEach((k) => {
      const v = dict[k];
      if (!rev.has(v)) rev.set(v, k);
    });

    const roots: Element[] = [];
    const nav = document.querySelector<HTMLElement>("#nav");
    const app = document.querySelector<HTMLElement>("#app");
    if (nav) roots.push(nav);
    if (app) roots.push(app);
    if (roots.length === 0) roots.push(document.body);

    // テキストノードを data-i18n に置換
    for (const root of roots) {
      const toWrap: Text[] = [];
      const iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = iter.nextNode())) {
        const t = n as Text;
        const raw = t.nodeValue ?? "";
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const key = rev.get(trimmed as string);
        if (!key) continue;
        // すでに親が data-i18n の場合はスキップ
        if (t.parentElement?.hasAttribute("data-i18n")) continue;
        toWrap.push(t);
      }

      for (const t of toWrap) {
        const raw = t.nodeValue ?? "";
        const trimmed = raw.trim();
        const key = rev.get(trimmed as string);
        if (!key || !t.parentNode) continue;

        const leading = raw.slice(0, raw.indexOf(trimmed));
        const trailing = raw.slice(raw.indexOf(trimmed) + trimmed.length);

        const el = document.createElement("i18n-t");
        el.setAttribute("data-i18n", key);
        el.textContent = trimmed;

        const frag = document.createDocumentFragment();
        if (leading) frag.appendChild(document.createTextNode(leading));
        frag.appendChild(el);
        if (trailing) frag.appendChild(document.createTextNode(trailing));

        t.parentNode.replaceChild(frag, t);
      }
    }

    // 属性を data-i18n-attr に登録
    const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      let el: Element | null = root;
      while ((el = walker.nextNode() as Element | null)) {
        if (!el) break;
        for (const attr of ATTRS) {
          const v = el.getAttribute(attr);
          if (!v) continue;
          const key = rev.get(v);
          if (!key) continue;
          const current = el.getAttribute("data-i18n-attr") ?? "";
          const entries = current
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
          const exists = entries.some((e) => e.startsWith(attr + ":"));
          if (!exists) {
            entries.push(`${attr}:${key}`);
            el.setAttribute("data-i18n-attr", entries.join(";"));
          }
        }
      }
    }

    // document.title を data-i18n-title に登録
    const revTitleKey = rev.get(document.title);
    if (revTitleKey) {
      document.documentElement.setAttribute("data-i18n-title", revTitleKey);
    }

    this._bindingsBootstrapped = true;
  }

  // data-i18n / data-i18n-attr / data-i18n-title を新言語で更新
  private _updateBoundNodes() {
    const dict = this._dict[this._lang];

    // テキスト
    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n") as I18nKey | null;
      if (!key) return;
      const val = dict[key];
      if (typeof val === "string") {
        el.textContent = val;
      }
    });

    // 属性
    document.querySelectorAll<HTMLElement>("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      if (!spec) return;
      const pairs = spec
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((entry) => entry.split(":")) as [string, I18nKey][];
      for (const [attr, key] of pairs) {
        const val = dict[key];
        if (typeof val === "string") {
          el.setAttribute(attr, val);
        }
      }
    });

    // タイトル
    const titleKey = document.documentElement.getAttribute(
      "data-i18n-title",
    ) as I18nKey | null;
    if (titleKey) {
      const val = dict[titleKey];
      if (typeof val === "string") document.title = val;
    }
  }
}
