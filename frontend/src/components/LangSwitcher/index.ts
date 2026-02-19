import { langManager } from "@/i18n";
import type { Lang } from "@/i18n/lang";

const FLAG_SRC: Record<Lang, string> = {
  en: "/flags/us.png",
  ja: "/flags/ja.svg",
  ita: "/flags/it.svg",
  edo: "/flags/ja.svg",
};

export class LangSwitcher {
  private root: HTMLDivElement;
  private select: HTMLSelectElement;
  private flagImg: HTMLImageElement; 

  constructor() {
    this.root = document.createElement("div");
    // this.root.className = "lang-switcher";
    this.root.className = "inline-flex items-center gap-2";

    // フラグイメージ
    this.flagImg = document.createElement("img");
    this.flagImg.className = "h-4 w-6 rounded-sm object-cover";
    this.flagImg.alt = "";
    this.flagImg.decoding = "async";

    this.select = document.createElement("select");
    // this.select.className = "lang-select";
    this.select.className = [
			"cursor-pointer",
			"rounded-md",
			"border border-white/20",
			"bg-black/40",
			"px-2 py-1",
			"text-sm text-white",
			"outline-none",
			"focus-visible:ring-2 focus-visible:ring-white/50",
		].join(" ");

    const langs: { lang: Lang; label: string }[] = [
      { lang: "en", label: "English" },
      { lang: "ja", label: "日本語" },
			{ lang: "ita", label: "Italiano" },
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
    this.syncFlag();

    // UI → State
    this.select.addEventListener("change", () => {
      langManager.setLang(this.select.value as Lang);
    });

    // State → UI（外部から言語が変わった場合）
    langManager.addEventListener("change", () => {
      this.select.value = langManager.lang;
      this.syncFlag();
    });

    this.root.appendChild(this.flagImg);
    this.root.appendChild(this.select);
  }

  private syncFlag() {
    const lang = langManager.lang;
    this.flagImg.src = FLAG_SRC[lang];
  }

  mount(container: ParentNode) {
		this.unmount();
    container.appendChild(this.root);
  }

  unmount() {
    this.root.remove();
  }
}

export const langSwitcher = new LangSwitcher();
