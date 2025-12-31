import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { t, word } from "@/i18n";

export class NotFoundComponent implements Component {
  render() {
    return `
      <div class="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono text-center">
        <h1 class="text-6xl font-extrabold tracking-widest animate-pulse">404</h1>
        <p class="mt-4 text-2xl">404 | Not Found</p>
        <a href="/" 
           class="mt-6 px-6 py-2 border border-green-400 rounded hover:bg-green-400 hover:text-black transition-colors">${t("home_return")}</a>
      </div>
    `;
  }
}

export const NotFoundRoute: Route = {
  linkLabel: () => word("home"),
  content: () => new NotFoundComponent().render(),
};
