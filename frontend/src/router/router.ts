import { routes } from "./routes";

const app = document.querySelector<HTMLElement>("#app")!;
const nav = document.querySelector<HTMLElement>("#nav")!;

const renderPage = (route: string) => {
  const r = routes[route];
  if (!r) {
    app.innerHTML = "<h1>404</h1>";
    return;
  }

  app.innerHTML = r.content;

  if (r.onMount) r.onMount();

  if (r.head?.title) {
    document.title = r.head.title;
  }
};

export const navigate = (target: HTMLAnchorElement) => {
  const route = target.pathname;
  history.pushState({}, "", route);
  renderPage(route);
};

export const renderNavLinks = (className = "nav-link"): void => {
  const navFragment: DocumentFragment = document.createDocumentFragment();

  Object.keys(routes).forEach((route) => {
    const { linkLabel } = routes[route];
    const linkElement = document.createElement("a");

    linkElement.href = route;
    linkElement.textContent = linkLabel;
    linkElement.classList.add(className);

    navFragment.appendChild(linkElement);
  });

  nav.append(navFragment);
};

export const registerNavLinks = (): void => {
  nav.addEventListener("click", (e) => {
    const target = e.target as HTMLAnchorElement;
    if (target.tagName.toLowerCase() === "a") {
      e.preventDefault();
      navigate(target);
    }
  });
};

export const registerBrowserBackAndForth = () => {
  window.onpopstate = () => {
    renderPage(location.pathname);
  };
};

export const renderInitialPage = () => {
  renderPage(location.pathname);
};
