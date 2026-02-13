// src/router/Router.ts
import { routes } from "../routers";
import { buildLayout, renderRouteContent } from "@/layout/renderLayout";
import { navBar } from "@/components/Navbar";
import { footer } from "@/components/Footer";
import { langSwitcher } from "@/components/LangSwitcher";
import { domRoots } from "@/layout/root";
import { StyleManager } from "@/router/class/StyleManager";

export class Router {
  private currentRoute: string | null = null;
  private _styleManager: StyleManager = new StyleManager();

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

  private async render(route: string) {
    domRoots.app.style.opacity = "0";
    if (this.currentRoute) {
      const prev = routes[this.currentRoute];
      await prev?.component.onUnmount?.();
      this._styleManager.unmount();
    }

    const path = route.split("?")[0];
    const normalized = routes[path] ? path : "/not_found";
    const nextRoute = routes[normalized];

    if (nextRoute.css_path) {
      await this._styleManager.mount(nextRoute.css_path);
    }
    buildLayout(normalized);
    if (nextRoute.show_navbar) {
      navBar.mount(domRoots.nav);
      langSwitcher.mount(navBar.getRightSlot());
    } else {
      navBar.unmount();
      langSwitcher.unmount();
    }
    renderRouteContent(normalized);
    footer.mount(domRoots.footer);
    nextRoute.component.onMount?.();
    domRoots.app.style.opacity = "";
    this.currentRoute = normalized;
  }
}
