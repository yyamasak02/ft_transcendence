// src/router/Router.ts
import { routes } from "./routes";
import { buildLayout, renderRouteContent } from "@/layout/renderLayout";
import { navBar } from "@/components/Navbar";
import { langSwitcher } from "@/components/LangSwitcher";
import { domRoots } from "@/layout/root";

export class Router {
  private currentRoute: string | null = null;

  constructor() {
    window.addEventListener("popstate", () => {
      this.render(location.pathname);
    });
  }

  init() {
    this.render(location.pathname);
  }

  navigate(path: string) {
    history.pushState({}, "", path);
    this.render(path);
  }

  rerender() {
    this.render(location.pathname);
  }

  private render(route: string) {
    if (this.currentRoute && routes[this.currentRoute]?.component.onUnmount) {
      routes[this.currentRoute].component.onUnmount?.();
    }

    // ルートの存在をここで精査し、なければ not_found にフォールバック
    const normalized = routes[route] ? route : "/not_found";

    buildLayout(normalized);

    // 共通UI（ナビ等）のマウント/アンマウントはRouterが制御
    if (routes[normalized].show_navbar) {
      navBar.mount(domRoots.nav);
      langSwitcher.mount(domRoots.nav);
    } else {
      navBar.unmount();
    }

    renderRouteContent(normalized);

    // After layout/content is rendered, run the new route's mount hook
    const next = routes[normalized];
    next?.component.onMount?.();
    this.currentRoute = normalized;
  }
}
