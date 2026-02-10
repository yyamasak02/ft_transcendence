// import { navigate } from "@/router";
import { routes } from "@/router/routers";
import { langManager } from "@/i18n";
import { decodeJwtPayload } from "@/utils/jwt";
import { getStoredAccessToken } from "@/utils/token-storage";

// import "./navbar.css";

export class NavBar {
  private root: HTMLElement;

  constructor() {
    this.root = document.createElement("nav");
    // this.root.classList.add("navbar", "flex");
		// Tailwind適用
		this.root.className = [
			"sticky top-0 z-[9999]",
			"w-full h-16",
			"flex items-center justify-center gap-4",
			"px-4",
			"bg-black/40 backdrop-blur",
			"border-b border-white/10",
			"text-white",
			"shadow-sm shadow-black/20",
		].join(" ");

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

		// ling見た目(Tailwind)
		const linkClass = [
			"inline-flex items-center",
			"pt-5 pb-1",
			"leading-none",
			"rounded-md",
			"transition-all",
			"text-fuchsia-400",
			"text-base",
			"no-underline tracking-wide",
			"hover:text-yellow-300 hover:scale-110",
			"active:text-orange-400",
			"focus:outline-none focus:visible:ring-2 focus:visible:ring-white/60",
		].join(" ");

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
			a.dataset.nav = path; // 委譲ハンドラ用
      // a.textContent = label;
			a.innerHTML = label;
      // a.classList.add("nav-link");
			a.className = linkClass; // 上で作ったlinkClass

      // a.addEventListener("click", (e) => {
      //   e.preventDefault();
      //   navigate(path);
      // });
      this.root.appendChild(a);
    }

    if (payload?.name) {
      const userLink = document.createElement("a");
      userLink.href = "/me";
			userLink.dataset.nav = "/me"; // 委譲ハンドラ用
      // userLink.textContent = payload.name;
			userLink.innerHTML = payload.name;
      // userLink.classList.add("nav-link");
			userLink.className = linkClass;

      // userLink.addEventListener("click", (e) => {
      //   e.preventDefault();
      //   navigate("/me");
      // });
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
