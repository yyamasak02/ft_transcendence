// src/components/navbar.ts
import { routes } from "@/router/routes";
import { navigate } from "@/router/router";
import { renderLangSwitcherDOM } from "./LangSwitcher";
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
		const label = 
			typeof linkLabel === "function" ? linkLabel() : linkLabel ?? "";

    linkElement.textContent = label;
    linkElement.classList.add(...classNames);

    linkElement.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(route);
    });

    fragment.appendChild(linkElement);
  });
	const LangSwitcher = renderLangSwitcherDOM();
	fragment.appendChild(LangSwitcher);

  return fragment;
}
