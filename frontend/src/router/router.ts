import { routes } from "./routes";
import { NotFoundPage } from "@/pages/404";

const app = document.querySelector<HTMLElement>("#app")!;

let currentRoute: string | null = null;

const renderPage = (route: string) => {
  // 前のページの onUnmount を呼ぶ
  if (currentRoute && routes[currentRoute]?.onUnmount) {
    routes[currentRoute].onUnmount();
  }

  const r = routes[route];
  if (!r) {
    app.innerHTML = new NotFoundPage().render();
    return;
  }

  app.innerHTML = r.content;
  currentRoute = route;

  r.onMount?.();
  if (r.head?.title) document.title = r.head.title;
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
