import { navigate } from "@/router";
import { routes } from "@/router/routers";
import { langManager } from "@/i18n";

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

    const items = Object.entries(routes)
      .filter(([_, route]) => route.show_navbar == true)
      .map(([path, route]) => {
        const ll = route.component.linkLabel;
        const label = typeof ll === "function" ? ll() : (ll ?? path);
        return { path, label };
      });

    for (const item of items) {
      const a = document.createElement("a");
      a.href = item.path;
      a.textContent = item.label;
      a.classList.add("nav-link");

      a.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(item.path);
      });

      this.root.appendChild(a);
    }
  }

  mount(container: ParentNode) {
    container.appendChild(this.root);
  }

  unmount() {
    this.root.remove();
  }
}

export const navBar = new NavBar();
