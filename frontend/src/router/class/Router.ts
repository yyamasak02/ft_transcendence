// src/router/Router.ts
import { routes } from "../routers";
import { buildLayout } from "@/layout/renderLayout";
import { footer } from "@/components/Footer";
import { domRoots } from "@/layout/root";
import { StyleManager } from "@/router/class/StyleManager";
import type { RouteConfig } from "@/types/routes";

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
    const path = route.split("?")[0];
    const normalized: string = routes[path] ? path : "/not_found";
    const nextRoute: RouteConfig = routes[normalized];

    domRoots.app.style.opacity = "0";
    if (this.currentRoute) {
      const prev = routes[this.currentRoute];
      await prev?.component.onUnmount?.();
      this._styleManager.unmount();
    }
    if (nextRoute.css_path) {
      await this._styleManager.mount(nextRoute.css_path);
    }
    buildLayout(nextRoute);
    domRoots.app.style.opacity = "1";
  }
}
