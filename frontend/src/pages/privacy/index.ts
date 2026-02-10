// src/pages/privacy/index.ts
import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { t } from "@/i18n";
import { Footer } from "@/components/Footer";
import type { FooterLinkProps, SplitterProps } from "@/components/Footer";

export class PrivacyComponent implements Component {
  private footer: Footer;
  private footerContainer!: HTMLElement;

  constructor() {
    const footerLinks: FooterLinkProps[] = [
      {
        link: "/terms",
        labelKey: "terms",
        classNameStr: "underline decoration-slate-400 hover:text-white",
      },
      {
        link: "/",
        labelKey: "home",
        classNameStr:
          "!text-slate-100 underline decoration-slate-400 underline-offset-4 hover:!text-white visited:!text-slate-100",
      },
    ];
    const rootClassNameStr: string = `mt-10 border-t border-slate-700 pt-6 text-center`;
    const splitter: SplitterProps = {
      splitter: " • ",
      classNameStr: "text-slate-500",
    };
    this.footer = new Footer(footerLinks, rootClassNameStr, splitter);
  }

  render(): string {
    return `
      <div class="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div
          class="
            w-full max-w-4xl
            bg-slate-900
            border border-slate-700
            rounded-2xl
            p-10
            text-slate-100
          "
        >
          <header class="mb-8 text-center">
            <h1 class="text-4xl sm:text-5xl font-semibold tracking-tight">
              ${t("privacy")}
            </h1>
            <p class="mt-3 text-base sm:text-lg text-slate-300">
              ${t("update")} 2026-02-09
            </p>
          </header>

          <section class="space-y-6 text-lg leading-relaxed">

            <p> ${t("privacy_s")} </p>

            <h2 class="text-2xl font-semibold pt-4">${t("privacy_1_t")}</h2>
            <p class="indent-8"> ${t("privacy_1_s")} </p>
            <ul class="list-disc list-inside space-y-2 ml-4">
              <li>${t("privacy_1_l1")}</li>
              <li>${t("privacy_1_l2")}</li>
              <li>${t("privacy_1_l3")}</li>
              <li>${t("privacy_1_l4")}</li>
              <li>${t("privacy_1_l5")}</li>
            </ul>

            <h2 class="text-2xl font-semibold pt-4">${t("privacy_2")}</h2>
            <ul class="list-disc list-inside space-y-2 ml-4">
              <li>${t("privacy_2_l1")}</li>
              <li>${t("privacy_2_l2")}</li>
              <li>${t("privacy_2_l3")}</li>
              <li>${t("privacy_2_l4")}</li>
            </ul>

            <h2 class="text-2xl font-semibold pt-4">${t("privacy_3")}</h2>
            <p class="indent-8">${t("privacy_3_s1")}</p>
            <p class="indent-8">${t("privacy_3_s2")}</p>

            <h2 class="text-2xl font-semibold pt-4">${t("privacy_4")}</h2>
            <p class="indent-8">${t("privacy_4_s1")}</p>
            <p class="indent-8">${t("privacy_4_s2")}</p>
            <ul class="list-disc list-inside space-y-2 ml-4">
              <li>${t("privacy_4_l1")}</li>
              <li>${t("privacy_4_l2")}</li>
              <li>${t("privacy_4_l3")}</li>
            </ul>

            <h2 class="text-2xl font-semibold pt-4">${t("privacy_5")}</h2>
            <p class="indent-8">${t("privacy_5_s1")}</p>
            <p class="indent-8">${t("privacy_5_s2")}</p>
            <p class="indent-8">${t("privacy_5_s3")}</p>
            <p class="indent-8">${t("privacy_5_s4")}</p>

            <h2 class="text-2xl font-semibold pt-4">${t("privacy_6")}</h2>
            <p class="indent-8">${t("privacy_6_s")}</p>
            <ul class="list-disc list-inside space-y-2 ml-4">
              <li>${t("privacy_6_l1")}</li>
              <li>${t("privacy_6_l2")}</li>
              <li>${t("privacy_6_l3")}</li>
            </ul>

            <h2 class="text-2xl font-semibold pt-4">${t("privacy_7")}</h2>
            <p class="indent-8">${t("privacy_7_s")}</p>

            <h2 class="text-2xl font-semibold pt-4">${t("privacy_8")}</h2>
            <p class="indent-8">${t("privacy_8_s")}</p>

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

const privacyComponent = new PrivacyComponent();

export const PrivacyRoute: Route = {
  linkLabel: () => "Privacy",
  content: () => privacyComponent.render(),
  onMount: () => privacyComponent.mount(),
  onUnmount: () => privacyComponent.unmount(),
};
