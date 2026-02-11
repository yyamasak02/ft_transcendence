import { word } from "@/i18n";
import type { I18nKey } from "@/i18n/lang";
import { navigate } from "@/router";

export type FooterLinkProps = {
  link: string;
  labelKey: I18nKey;
  classNameStr?: string;
};

export type SplitterProps = {
  splitter: string;
  classNameStr?: string;
};

export class Footer {
  private root: HTMLElement;
  private links: FooterLinkProps[];
  private splitter: SplitterProps;

  constructor(
    links: FooterLinkProps[] = [
      { link: "/terms", labelKey: "terms" },
      { link: "/privacy", labelKey: "privacy" },
    ],
    rootClassNameStr = "",
    splitter: SplitterProps = { splitter: " ・ " },
  ) {
    this.root = document.createElement("footer");
    this.root.className = rootClassNameStr;
    this.links = links;
    this.splitter = splitter;
  }

  private render() {
    this.root.innerHTML = "";
    this.links.forEach(({ link, labelKey, classNameStr }, index) => {
      const a = document.createElement("a");
      a.dataset.i18n = labelKey;
      a.textContent = word(labelKey);
      a.className = classNameStr || "";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(link);
      });
      this.root.appendChild(a);
      if (this.splitter && index < this.links.length - 1) {
        const span = document.createElement("span");
        if (this.splitter.classNameStr) {
          span.className = this.splitter.classNameStr;
        }
        span.textContent = this.splitter.splitter;
        this.root.appendChild(span);
      }
    });
  }

  mount(container: ParentNode) {
    this.unmount();
    this.render();
    container.appendChild(this.root);
  }

  unmount() {
    this.root.remove();
  }
}

const footerLinks: FooterLinkProps[] = [
  { link: "/terms", labelKey: "terms", classNameStr: "cursor-pointer" },
  { link: "/privacy", labelKey: "privacy", classNameStr: "cursor-pointer" },
];
const rootClassNameStr: string = `
    fixed bottom-4 left-1/2 -translate-x-1/2
    z-[2147483647]
    bg-black/80 text-white
    px-3 py-1.5 rounded-lg
    text-xs flex items-center gap-2
    `;
const splitter: SplitterProps = { splitter: " ・ " };
export const footer = new Footer(footerLinks, rootClassNameStr, splitter);
