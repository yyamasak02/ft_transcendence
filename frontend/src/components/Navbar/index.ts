import { navigate } from "@/router";
import { routes } from "@/router/routers";
import { langManager } from "@/i18n";
import { decodeJwtPayload } from "@/utils/jwt";
import { getStoredAccessToken } from "@/utils/token-storage";

import "./navbar.css";

export class NavBar {
  private root: HTMLElement;

  constructor() {
    this.root = document.createElement("nav");
    this.root.classList.add("navbar", "flex");

    // 言語変更でラベルを再評価
    langManager.addEventListener("change", () => {
      this.render();
    });

    this.render();
  }

  private render() {
    this.root.innerHTML = "";

    // Auth state for conditional nav items
    const token = getStoredAccessToken();
    const payload = token ? decodeJwtPayload(token) : null;
    const isLoggedIn = Boolean(payload?.name);

    // Display order aligned with legacy navbar
    const routeOrder = [
      "/",
      "/pingpong",
      "/pingpong_3D",
      "/pingpong_3D_config",
      "/login",
      "/register",
    ];

    for (const path of routeOrder) {
      const route = routes[path];
      if (!route) continue;
      // Hide auth links when logged in
      if (isLoggedIn && (path === "/login" || path === "/register")) continue;
      const ll = route.component.linkLabel;
      const label = typeof ll === "function" ? ll() : (ll ?? "");
      if (!label) continue;

      const a = document.createElement("a");
      a.href = path;
      a.textContent = label;
      a.classList.add("nav-link");
      a.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(path);
      });
      this.root.appendChild(a);
    }

    if (payload?.name) {
      const userLink = document.createElement("a");
      userLink.href = "/me";
      userLink.textContent = payload.name;
      userLink.classList.add("nav-link");
      userLink.addEventListener("click", (e) => {
        e.preventDefault();
        navigate("/me");
      });
      this.root.appendChild(userLink);
    }
  }

  mount(container: ParentNode) {
    this.unmount();
    this.render();
    container.appendChild(this.root);
  }

  unmount() {
    this.root.remove();
  }
}

export const navBar = new NavBar();
