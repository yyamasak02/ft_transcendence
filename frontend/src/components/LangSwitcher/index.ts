import { langManager } from "@/i18n";
import type { Lang } from "@/i18n/lang";

export class LangSwitcher {
  private root: HTMLDivElement;
  private select: HTMLSelectElement;
  private flagImg: HTMLImageElement; 

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "inline-flex items-center gap-2";

    // フラグイメージ初期化
    this.flagImg = document.createElement("img");
    this.flagImg.className = "h-4 w-6 rounded-sm object-cover";
    this.flagImg.alt = "";
    this.flagImg.decoding = "async";

    this.select = document.createElement("select");
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

    // langsにflagを加える
    const langs: { lang: Lang; label: string; flag: string }[] = [
      { lang: "en", label: "English", flag: "/flags/us.png" },
      { lang: "ja", label: "日本語", flag: "/flags/ja.svg"},
			{ lang: "ita", label: "Italiano", flag: "/flags/it.svg" },
      { lang: "edo", label: "江戸言葉", flag: "/flags/ja.svg" },
    ];

    for (const { lang, label, flag } of langs) {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = label;
      option.dataset.flag = flag;
      this.select.appendChild(option);
    }

    // 初期状態を反映
    this.select.value = langManager.lang;
    if (this.select.selectedOptions.length === 0) {
      this.select.selectedIndex = 0;
    }
    this.syncFlag();

    // UI → State
    this.select.addEventListener("change", () => {
      langManager.setLang(this.select.value as Lang);
    });

    // State → UI（外部から言語が変わった場合）
    langManager.addEventListener("change", () => {
      this.select.value = langManager.lang;
      if (this.select.selectedOptions.length === 0) {
        this.select.selectedIndex = 0;
      }
      this.syncFlag();
    });

    this.root.appendChild(this.flagImg);
    this.root.appendChild(this.select);
  }

  // フラグイメージを同期させる
  private syncFlag() {
    const opt = this.select.selectedOptions[0]; // 選択中の option ノード
    if (opt && opt.dataset.flag) {
      this.flagImg.src = opt.dataset.flag;
      return;
    }
  
    // fallback: 先頭 option の flag を使う（完全に壊れない）
    const first = this.select.options[0];
    this.flagImg.src = first?.dataset.flag ?? "";
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
