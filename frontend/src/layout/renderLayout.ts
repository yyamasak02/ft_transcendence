// src/layout/renderLayout.ts
import { routes } from "@/router/routes";
import { navBar } from "@/components/Navbar/index";
import { langSwitcher } from "@/components/LangSwitcher";
import { navigate } from "@/router";

const navRoot = document.querySelector<HTMLElement>("#nav")!;
const appRoot = document.querySelector<HTMLElement>("#app")!;

export function renderLayout(routePath: string) {
  const route = routes[routePath];

  navRoot.innerHTML = "";
  appRoot.innerHTML = "";

  if (!route) {
    navigate("/not_found");
    return;
  }

  // navbar
  if (route.show_navbar) {
    navBar.mount(navRoot);
    langSwitcher.mount(navRoot);
  } else {
    navBar.unmount();
  }

  // content
  const content =
    typeof route.component.content === "function"
      ? route.component.content()
      : route.component.content;

  switch (route.layout) {
    case "auth":
      appRoot.innerHTML = `<div class="auth-screen">${content}</div>`;
      break;

    case "center":
      appRoot.innerHTML = `<div class="center-screen">${content}</div>`;
      break;

    default:
      appRoot.innerHTML = content;
  }
}
