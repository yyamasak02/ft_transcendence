// src/pages/terms/index.ts
import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { t } from "@/i18n";
import {
  Footer,
  type FooterLinkProps,
  type SplitterProps,
} from "@/components/Footer";

export class TermsComponent implements Component {
  private footer: Footer;
  private footerContainer!: HTMLElement;

  constructor() {
    const footerLinks: FooterLinkProps[] = [
      {
        link: "/privacy",
        labelKey: "privacy",
        classNameStr:
          "cursor-pointer !text-slate-100 underline decoration-slate-400 underline-offset-4 hover:!text-white visited:!text-slate-100",
      },
      {
        link: "/",
        labelKey: "home",
        classNameStr:
          "cursor-pointer !text-slate-100 underline decoration-slate-400 underline-offset-4 hover:!text-white visited:!text-slate-100",
      },
    ];
    const rootClassNameStr: string = `flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm sm:text-base`;
    const splitter: SplitterProps = {
      splitter: " • ",
      classNameStr: "text-slate-500",
    };
    this.footer = new Footer(footerLinks, rootClassNameStr, splitter);
  }

  render(): string {
    return `
      <div class="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
        <div
          class="
						w-full max-w-2xl
						bg-slate-900
            border border-slate-700
            rounded-2xl
						!p-8 sm:p-10
            text-slate-100
						shadow-xl
          "
        >
          <header class="mb-8 text-center">
            <h1 class="text-4xl sm:text-5xl font-semibold tracking-tight">
						${t("terms")}
            </h1>
            <p class="mt-3 text-base sm:text-lg text-slate-300">
              ${t("update")} 2026-02-05
            </p>
          </header>

          <section class="space-y-6 text-lg leading-relaxed">
            <p>${t("terms1")}</p>

            <p>${t("terms2")}</p>

            <ul class="list-disc list-inside space-y-3 ml-4">
              <li>${t("terms_l1")}</li>
              <li>${t("terms_l2")}</li>
              <li>${t("terms_l3")}</li>
              <li>${t("terms_l4")}</li>
            </ul>

            <p class="pt-1">${t("terms3")}</p>
          </section>

          <div id="footer-container"></div>
					</div>
      </div>
    `;
  }
  mount(): void {
    this.footerContainer = document.getElementById(
      "footer-container",
    ) as HTMLElement;
    this.footer.mount(this.footerContainer);
  }

  unmount(): void {
    this.footer.unmount();
  }
}

const termsComponent = new TermsComponent();
export const TermsRoute: Route = {
  linkLabel: () => "Terms",
  content: () => termsComponent.render(),
  onMount: () => termsComponent.mount(),
  onUnmount: () => termsComponent.unmount(),
};
