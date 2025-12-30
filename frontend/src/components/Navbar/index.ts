import { navigate } from "@/router";
import type { NavItem } from "./nav";
import { routes } from "@/router/routers";

import "./navbar.css";

export class NavBar {
  private root: HTMLElement;
  private items: NavItem[];

  constructor(items: NavItem[]) {
    this.items = items;

    this.root = document.createElement("nav");
    this.root.className = "navbar";

    this.render();
  }

  private render() {
    this.root.innerHTML = "";

    for (const item of this.items) {
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

const navItems = Object.entries(routes)
  .filter(([_, route]) => route.show_navbar == true)
  .map(([path, route]) => {
    const label =
      typeof route.component.linkLabel === "function"
        ? route.component.linkLabel()
        : (route.component.linkLabel ?? path);

    return {
      path,
      label,
    };
  });
export const navBar = new NavBar(navItems);
