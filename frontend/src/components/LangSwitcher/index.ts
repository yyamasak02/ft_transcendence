import { langManager } from "@/i18n";
import type { Lang } from "@/i18n/lang";

export class LangSwitcher {
  private root: HTMLDivElement;
  private select: HTMLSelectElement;
  private flagImg: HTMLImageElement;

  private static readonly LANG_SETTING_MAP: Record<
    Lang,
    { label: string; flag: string }
  > = {
    en: { label: "English", flag: "/flags/us.png" },
    ja: { label: "日本語", flag: "/flags/ja.svg" },
    ita: { label: "Italiano", flag: "/flags/it.svg" },
    edo: { label: "江戸言葉", flag: "/flags/ja.svg" },
  };

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

    for (const [lang, { label }] of Object.entries(
      LangSwitcher.LANG_SETTING_MAP,
    )) {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = label;
      this.select.appendChild(option);
    }

    // 初期状態を反映
    this.updateUI();

    // UI → State
    this.select.addEventListener("change", () => {
      langManager.setLang(this.select.value as Lang);
    });

    // State → UI（外部から言語が変わった場合）
    langManager.addEventListener("change", () => {
      this.updateUI();
    });

    this.root.appendChild(this.flagImg);
    this.root.appendChild(this.select);
  }

  private updateUI() {
    const lang = langManager.lang;
    this.select.value = lang;
    this.flagImg.src = LangSwitcher.LANG_SETTING_MAP[lang].flag;
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
