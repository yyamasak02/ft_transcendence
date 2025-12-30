// src/router/Router.ts
import { routes } from "./routes";
import { renderLayout } from "@/layout/renderLayout";

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

    renderLayout(route);
    this.currentRoute = route;
  }
}
