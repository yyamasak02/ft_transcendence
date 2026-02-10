// src/pages/terms/index.ts
import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { t } from "@/i18n";

export class TermsComponent implements Component {
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

          <footer class="mt-10 border-t border-slate-700 pt-6">
            <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm sm:text-base">
              <a
                href="/privacy"
								data-nav="/privacy"
                class="!text-slate-100 underline decoration-slate-400 underline-offset-4 hover:!text-white visited:!text-slate-100"
              >
                ${t("privacy")}
              </a>
              <span class="text-slate-500">•</span>
              <a
                href="/"
								data-nav="/"
                class="!text-slate-100 underline decoration-slate-400 underline-offset-4 hover:!text-white visited:!text-slate-100"
              >
                ${t("home")}
              </a>
            </div>
          </footer>
					</div>
      </div>
    `;
  }
}

export const TermsRoute: Route = {
  linkLabel: () => "Terms",
  content: () => new TermsComponent().render(),
};
