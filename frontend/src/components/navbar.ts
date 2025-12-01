// src/components/navvar.ts
import { routes } from "@/router/routes";
import { navigate } from "@/router/router";
import "./navbar.css";

// リンク要素の DocumentFragment を返す
export function renderNavbar(
  classNames: string[] = ["nav-link"],
): DocumentFragment {
  const fragment = document.createDocumentFragment();

  Object.keys(routes).forEach((route) => {
    const { linkLabel } = routes[route];
    const linkElement = document.createElement("a");

    linkElement.href = route;
    // linkElement.textContent = linkLabel;
    linkElement.textContent = linkLabel ?? "";
    linkElement.classList.add(...classNames);

    linkElement.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(route);
    });

    fragment.appendChild(linkElement);
  });

  return fragment;
}
