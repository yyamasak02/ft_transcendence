import { langManager } from "@/i18n";
import type { Lang } from "@/i18n/lang";

export class LangSwitcher {
  private root: HTMLDivElement;
  private select: HTMLSelectElement;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "lang-switcher";

    this.select = document.createElement("select");
    this.select.className = "lang-select";

    const langs: { lang: Lang; label: string }[] = [
      { lang: "en", label: "English" },
      { lang: "ja", label: "日本語" },
      { lang: "edo", label: "江戸言葉" },
    ];

    for (const { lang, label } of langs) {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = label;
      this.select.appendChild(option);
    }

    // 初期状態を反映
    this.select.value = langManager.lang;

    // UI → State
    this.select.addEventListener("change", () => {
      langManager.setLang(this.select.value as Lang);
    });

    // State → UI（外部から言語が変わった場合）
    langManager.addEventListener("change", () => {
      this.select.value = langManager.lang;
    });

    this.root.appendChild(this.select);
  }

  mount(container: ParentNode) {
    container.appendChild(this.root);
  }

  unmount() {
    this.root.remove();
  }
}

export const langSwitcher = new LangSwitcher();
