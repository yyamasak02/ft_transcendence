import { routes } from "@/router/routers";
import { langManager } from "@/i18n";
import { decodeJwtPayload } from "@/utils/jwt";
import { getStoredAccessToken } from "@/utils/token-storage";

export class NavBar {
  private root: HTMLElement;
	private rightSlot: HTMLDivElement; // langswitch用box

  constructor() {
    this.root = document.createElement("nav");
		this.root.className = 
			"sticky top-0 z-[9999] w-full h-16 flex flex-nowrap items-center justify-between px-4 bg-black/40 backdrop-blur border-b border-white/10";
		
		this.rightSlot = document.createElement("div");
		this.rightSlot.className =
			"shrink-0 flex items-center";

    // 言語変更でラベルを再評価
    langManager.addEventListener("change", () => {
      this.render();
    });

    this.render();
  }

	getRightSlot(): HTMLElement {
		return this.rightSlot;
	}

  private render() {
		// const slot = this.rightSlot;

    this.root.innerHTML = "";

		const center = document.createElement("div");
		center.className =
			"flex-1 min-w-0 flex items-center justify-center gap-4"; // 中央リンクの枠

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
			"py-2",
			"leading-none",
			"rounded-md",
			"transition-all",
			"text-fuchsia-400",
			"text-base",
			"no-underline tracking-wide",
			"hover:text-yellow-300 hover:scale-110",
			"active:text-orange-400",
			"focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
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
			a.textContent = label;
			a.className = linkClass; // 上で作ったlinkClass

      center.appendChild(a);
    }

    if (payload?.name) {
      const userLink = document.createElement("a");
      userLink.href = "/me";
			userLink.dataset.nav = "/me"; // 委譲ハンドラ用
			userLink.innerHTML = payload.name;
			userLink.className = linkClass;

      center.appendChild(userLink);
    }
		this.root.appendChild(center);
		this.root.appendChild(this.rightSlot);
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
