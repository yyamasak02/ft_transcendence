// src/i18n/LangManager.ts
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import { edo } from "../locale/edo";
import { ita } from "../locale/it";
import type { Lang, I18nKey, I18nDict } from "../lang";

const LANG_KEY = "app_lang";
const I18N_ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

export class LangManager extends EventTarget {
  private _lang: Lang;
  private readonly _dict: Record<Lang, I18nDict>;
  private _bindingsBootstrapped = false;
  private _observer: MutationObserver | null = null;
  // XSS対策: 許可するタグとクラスのホワイトリストを作成
  private static readonly _ALLOWED_TAGS = new Set(["SPAN"]);
  private static readonly _ALLOWED_CLASSES = new Set(["highlight", "key"]);

  constructor(defaultLang: Lang = "en") {
    super();
    this._dict = { en, ja, ita, edo };
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    this._lang = stored && stored in this._dict ? stored : defaultLang;
  }

  get lang(): Lang {
    return this._lang;
  }

  word(key: I18nKey): string | undefined {
    return this._dict[this._lang][key];
  }

  setLang(lang: Lang): void {
    if (lang === this._lang) return;
    if (!(lang in this._dict)) return;

    this._lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    this.dispatchEvent(new CustomEvent<Lang>("change", { detail: lang }));

    this._safeUpdateBindings();
  }

  initDomBindings(): void {
    this._startObserver();
    this._safeUpdateBindings();
  }

  dispose(): void {
    this._stopObserver();
  }

  private _startObserver(): void {
    if (this._observer) return;

    this._observer = new MutationObserver((mutations) =>
      this._handleMutations(mutations),
    );

    this._observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private _stopObserver(): void {
    if (!this._observer) return;
    this._observer.disconnect();
    this._observer = null;
  }

  private _handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          this._updateElementTree(node as Element);
        }
      });
    }
  }

  private _updateElementTree(root: Element): void {
    this._updateElementText(root);
    this._updateElementAttributes(root);

    root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
      this._updateElementText(el);
    });

    root.querySelectorAll<HTMLElement>("[data-i18n-attr]").forEach((el) => {
      this._updateElementAttributes(el);
    });
  }

  private _updateElementText(el: Element): void {
    const key = el.getAttribute("data-i18n") as I18nKey | null;
    if (!key) return;

    const val = this._dict[this._lang][key];
    if (typeof val === "string") {
      // Render sanitized translation. Supports limited inline markup:
      // - <span class="highlight"> ... </span>
      // - <span class="key"> ... </span>
      // Any other tags/attributes are stripped. If no markup, set as text.
      this._renderSanitizedHtmlInto(el, val);
    }
  }

  private _updateElementAttributes(el: Element): void {
    const spec = el.getAttribute("data-i18n-attr");
    if (!spec) return;

    const pairs = spec
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => entry.split(":")) as [string, I18nKey][];

    for (const [attr, key] of pairs) {
      const val = this._dict[this._lang][key];
      if (typeof val === "string") {
        el.setAttribute(attr, val);
      }
    }
  }

  private _safeUpdateBindings(): void {
    try {
      this._ensureBindings();
      this._updateAllBoundNodes();
    } catch (e) {
      console.log(`[WARNING] failed to translate: ${e}`);
    }
  }

  private _updateAllBoundNodes(): void {
    this._updateAllTextNodes();
    this._updateAllAttributes();
    this._updateDocumentTitle();
  }

  private _updateAllTextNodes(): void {
    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
      this._updateElementText(el);
    });
  }

  private _updateAllAttributes(): void {
    document.querySelectorAll<HTMLElement>("[data-i18n-attr]").forEach((el) => {
      this._updateElementAttributes(el);
    });
  }

  private _updateDocumentTitle(): void {
    const titleKey = document.documentElement.getAttribute(
      "data-i18n-title",
    ) as I18nKey | null;
    if (!titleKey) return;

    const val = this._dict[this._lang][titleKey];
    if (typeof val === "string") {
      document.title = val;
    }
  }
  private _ensureBindings(): void {
    if (this._bindingsBootstrapped) return;

    const reverseDict = this._buildReverseDict();
    const roots = this._getRootElements();

    this._wrapTextNodes(roots, reverseDict);
    this._registerAttributes(roots, reverseDict);
    this._registerDocumentTitle(reverseDict);

    this._bindingsBootstrapped = true;
  }

  private _buildReverseDict(): Map<string, I18nKey> {
    const dict = this._dict[this._lang];
    const rev = new Map<string, I18nKey>();

    (Object.keys(dict) as I18nKey[]).forEach((key) => {
      const val = dict[key];
      if (!rev.has(val)) {
        rev.set(val, key);
      }
    });

    return rev;
  }

  private _getRootElements(): Element[] {
    const roots: Element[] = [];
    const nav = document.querySelector<HTMLElement>("#nav");
    const app = document.querySelector<HTMLElement>("#app");

    if (nav) roots.push(nav);
    if (app) roots.push(app);
    if (roots.length === 0) roots.push(document.body);

    return roots;
  }

  private _wrapTextNodes(
    roots: Element[],
    reverseDict: Map<string, I18nKey>,
  ): void {
    for (const root of roots) {
      const toWrap = this._collectTextNodesToWrap(root, reverseDict);
      this._wrapCollectedTextNodes(toWrap, reverseDict);
    }
  }

  private _collectTextNodesToWrap(
    root: Element,
    reverseDict: Map<string, I18nKey>,
  ): Text[] {
    const toWrap: Text[] = [];
    const iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;

    while ((node = iter.nextNode())) {
      const textNode = node as Text;
      const raw = textNode.nodeValue ?? "";
      const trimmed = raw.trim();

      if (!trimmed) continue;
      if (!reverseDict.has(trimmed)) continue;
      if (textNode.parentElement?.hasAttribute("data-i18n")) continue;

      toWrap.push(textNode);
    }

    return toWrap;
  }

  private _wrapCollectedTextNodes(
    textNodes: Text[],
    reverseDict: Map<string, I18nKey>,
  ): void {
    for (const textNode of textNodes) {
      const raw = textNode.nodeValue ?? "";
      const trimmed = raw.trim();
      const key = reverseDict.get(trimmed);

      if (!key || !textNode.parentNode) continue;

      const leading = raw.slice(0, raw.indexOf(trimmed));
      const trailing = raw.slice(raw.indexOf(trimmed) + trimmed.length);

      const el = document.createElement("i18n-t");
      el.setAttribute("data-i18n", key);
      el.textContent = trimmed;

      const frag = document.createDocumentFragment();
      if (leading) frag.appendChild(document.createTextNode(leading));
      frag.appendChild(el);
      if (trailing) frag.appendChild(document.createTextNode(trailing));

      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  private _registerAttributes(
    roots: Element[],
    reverseDict: Map<string, I18nKey>,
  ): void {
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      let el: Element | null;

      while ((el = walker.nextNode() as Element | null)) {
        if (!el) break;
        this._registerElementAttributes(el, reverseDict);
      }
    }
  }

  private _registerElementAttributes(
    el: Element,
    reverseDict: Map<string, I18nKey>,
  ): void {
    for (const attr of I18N_ATTRS) {
      const value = el.getAttribute(attr);
      if (!value) continue;

      const key = reverseDict.get(value);
      if (!key) continue;

      const current = el.getAttribute("data-i18n-attr") ?? "";
      const entries = current
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

      const alreadyRegistered = entries.some((e) => e.startsWith(`${attr}:`));
      if (alreadyRegistered) continue;

      entries.push(`${attr}:${key}`);
      el.setAttribute("data-i18n-attr", entries.join(";"));
    }
  }

  private _registerDocumentTitle(reverseDict: Map<string, I18nKey>): void {
    const key = reverseDict.get(document.title);
    if (key) {
      document.documentElement.setAttribute("data-i18n-title", key);
    }
  }

  // XSS対策: サニタイズしたHTMLをターゲット要素にレンダリングする
  private _renderSanitizedHtmlInto(target: Element, html: string): void {
    if (!/[<>&]/.test(html)) {
      target.textContent = html;
      return;
    }

    const tpl = document.createElement("template");
    tpl.innerHTML = html;

    const outFrag = document.createDocumentFragment();

    const walk = (node: Node, outParent: Node) => {
      switch (node.nodeType) {
        case Node.TEXT_NODE: {
          outParent.appendChild(
            document.createTextNode((node as Text).nodeValue ?? ""),
          );
          break;
        }
        case Node.ELEMENT_NODE: {
          const el = node as HTMLElement;
          const tag = el.tagName;
          if (LangManager._ALLOWED_TAGS.has(tag)) {
            const newEl = document.createElement(tag.toLowerCase());
            if (el.classList.length > 0) {
              const allowed = Array.from(el.classList).filter((c) =>
                LangManager._ALLOWED_CLASSES.has(c),
              );
              if (allowed.length) newEl.className = allowed.join(" ");
            }
            Array.from(el.childNodes).forEach((child) => walk(child, newEl));
            outParent.appendChild(newEl);
          } else {
            Array.from(el.childNodes).forEach((child) =>
              walk(child, outParent),
            );
          }
          break;
        }
        default:
          break;
      }
    };

    Array.from(tpl.content.childNodes).forEach((child) => walk(child, outFrag));
    target.replaceChildren(outFrag);
  }
}
