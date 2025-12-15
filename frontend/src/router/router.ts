// src/router/router.ts

import { routes } from "./routes";
import { renderLayout } from "@/layout/renderLayout";

let currentRoute: string | null = null;

const renderPage = (route: string) => {
  // 前のページの onUnmount を呼ぶ
  if (currentRoute && routes[currentRoute]?.onUnmount) {
    routes[currentRoute].onUnmount?.();
  }

	renderLayout(route);
	currentRoute = route;
};

export const navigate = (path: string) => {
  history.pushState({}, "", path);
  renderPage(path);
};

export const registerBrowserBackAndForth = () => {
  window.onpopstate = () => {
    renderPage(location.pathname);
  };
};

export const renderInitialPage = () => {
  renderPage(location.pathname);
};

export function rerender() {
	renderPage(location.pathname);
}
