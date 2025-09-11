import { routes } from "@/router/routes";
import { navigate } from "@/router/router";
import "./navbar.css";

export function renderNavbar(classNames: string[] = ["nav-link"]): HTMLElement {
  const nav = document.createElement("nav");
  nav.classList.add(
    "flex",
    "justify-around",
    "bg-gray-800",
    "text-white",
    "p-4",
  );

  Object.keys(routes).forEach((route) => {
    const { linkLabel } = routes[route];
    const linkElement = document.createElement("a");

    linkElement.href = route;
    linkElement.textContent = linkLabel;
    linkElement.classList.add(...classNames);
    linkElement.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(route);
    });

    nav.appendChild(linkElement);
  });

  return nav;
}
