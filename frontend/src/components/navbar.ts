// src/components/navbar.ts
import { routes } from "@/router/routes";
import { navigate } from "@/router/router";
import { renderLangSwitcherDOM } from "./LangSwitcher";
import "./navbar.css";
import { decodeJwtPayload } from "@/utils/jwt";

const ACCESS_TOKEN_KEY = "accessToken";

const getStoredAccessToken = () =>
  sessionStorage.getItem(ACCESS_TOKEN_KEY) ??
  localStorage.getItem(ACCESS_TOKEN_KEY);

// リンク要素の DocumentFragment を返す
export function renderNavbar(
  classNames: string[] = ["nav-link"],
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const token = getStoredAccessToken();
  const payload = token ? decodeJwtPayload(token) : null;
  const isLoggedIn = Boolean(payload?.name);
  const routeOrder = [
    "/",
    "/pingpong",
    "/pingpong_3D",
    "/websocket",
    "/pingpong_3D_config",
    "/login",
    "/register",
  ];

  routeOrder.forEach((route) => {
    if (!routes[route]) return;
    if (isLoggedIn && (route === "/login" || route === "/register")) return;
    const { linkLabel } = routes[route];
    const linkElement = document.createElement("a");

    linkElement.href = route;
		const label =
			typeof linkLabel === "function" ? linkLabel() : linkLabel ?? "";

		if (!label) return;
    linkElement.textContent = label;
    linkElement.classList.add(...classNames);

    linkElement.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(route);
    });

    fragment.appendChild(linkElement);
  });

  if (payload?.name) {
    const userLink = document.createElement("a");
    userLink.href = "/me";
    userLink.textContent = payload.name;
    userLink.classList.add(...classNames);
    userLink.addEventListener("click", (e) => {
      e.preventDefault();
      navigate("/me");
    });
    fragment.appendChild(userLink);
  }
	const LangSwitcher = renderLangSwitcherDOM();
	fragment.appendChild(LangSwitcher);

  return fragment;
}
