import { routes } from "@/router/routers";
import { langManager } from "@/i18n";
import { decodeJwtPayload } from "@/utils/jwt";
import { getStoredAccessToken } from "@/utils/token-storage";
import { navigate } from "@/router";

type NavItem = { path: string; label: string };

// 画面上部に表示するグローバルナビゲーションバー
export class NavBar {
  private root: HTMLElement; // ナビ全体のルート要素
  private rightSlot: HTMLDivElement; // 右端に差し込む言語スイッチャースロット
  private menuOpen: boolean = false; // モバイルメニューの開閉状態
  // ナビゲーションのコンテナを生成
  constructor() {
    this.root = document.createElement("nav");
    this.root.className = [
      "sticky top-0 z-[9999] w-full",
      "h-16 flex flex-nowrap",
      "items-center justify-between",
      "px-4 bg-black/40 backdrop-blur",
      "border-b border-white/10",
      "pointer-events-auto",
    ].join(" ");

    // 言語スイッチャー用の右側スロット
    this.rightSlot = document.createElement("div");
    this.rightSlot.className = "shrink-0 flex items-center";

    // 言語変更でラベルを再評価
    langManager.addEventListener("change", () => {
      this.render();
    });
  }

  // 外部から右側スロットを取得するためのgetter
  getRightSlot(): HTMLElement {
    return this.rightSlot;
  }

  // ログイン状態を考慮して表示するリンク一覧を生成
  private getNavItems(): { items: NavItem[]; userName?: string } {
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

    // ルート順にナビリンクを構築
    const items: NavItem[] = [];
    for (const path of routeOrder) {
      const route = routes[path];
      if (!route) continue;
      // Hide auth links when logged in
      if (isLoggedIn && (path === "/login" || path === "/register")) continue;

      const ll = route.component.linkLabel;
      const label = typeof ll === "function" ? ll() : (ll ?? "");
      if (!label) continue;

      items.push({ path, label });
    }

    const userName = payload?.name ? String(payload.name) : undefined;
    if (userName) items.push({ path: "/me", label: userName });

    return { items, userName };
  }

  // PC表示用の横並びナビリンクを構築
  private buildPCNav(items: NavItem[]): HTMLDivElement {
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
      "focus:outline-none focus-visible:ring-2",
      "focus-visible:ring-white/60",
    ].join(" ");

    const center = document.createElement("div");
    center.className = [
      "hidden md:flex flex-1 min-w-0", // 中央リンクの枠
      "items-center justify-center gap-4",
    ].join(" ");

    for (const it of items) {
      const a = document.createElement("a");
      a.href = it.path;
      a.dataset.nav = it.path;
      a.textContent = it.label;
      a.className = linkClass;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(it.path);
      });
      center.appendChild(a);
    }
    return center;
  }

  // モバイル用ハンバーガーボタンを構築
  private buildMobileToggle(): HTMLDivElement {
    const left = document.createElement("div");
    left.className = "flex items-center md:hidden";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = [
      "inline-flex items-center justify-center",
      "rounded-md p-2 text-white/80",
      "hover:text-white hover:bg-white/10",
      "focus:outline-none focus-visible:ring-2",
      "focus-visible:ring-while/60",
    ].join(" ");
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", this.menuOpen ? "true" : "false");

    // SVGアイコン
    btn.innerHTML = `
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" ariahidden="true">
				<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>		
		`;

    // ボタンを押すことで動く開閉トグル
    btn.onclick = (ev) => {
      ev.stopPropagation();
      this.menuOpen = !this.menuOpen;
      this.render();
    };

    left.appendChild(btn);
    return left;
  }

  // モバイル用ドロップダウンメニューを構築
  private buildMobileMenue(items: NavItem[]): HTMLDivElement {
    const menue = document.createElement("div");
    menue.className = [
      "md:hidden fixed",
      "top-16 left-0",
      "w-full",
      "bg-black/80 backdrop-blur",
      "border-b border-white/10",
    ].join(" ");
    menue.style.display = this.menuOpen ? "block" : "none";

    const inner = document.createElement("div");
    inner.className = "px-4 py-3 flex flex-col gap-2";

    for (const it of items) {
      const a = document.createElement("a");
      a.href = it.path;
      a.dataset.nav = it.path;
      a.textContent = it.label;
      a.className = [
        "block rounded-md",
        "px-3 py-2",
        "text-base text-fuchsia-300",
        "hover:bg-white/10 hover:text-yellow-300",
        "focus:outline-none focus-visible:ring-2",
        "focus:-visible:ring-white/60",
      ].join(" ");
      // リンククリックで閉じる
      a.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.menuOpen = false;
        this.render();
        navigate(it.path);
      });
      inner.appendChild(a);
    }
    menue.appendChild(inner);
    return menue;
  }

  // 外側クリック・ESCでメニューを閉じる処理
  private bindGlobalCloseHandlers() {
    document.onclick = () => {
      if (!this.menuOpen) return;
      this.menuOpen = false;
      this.render();
    };
    document.onkeydown = (e) => {
      if (e.key != "Escape") return;
      if (!this.menuOpen) return;
      this.menuOpen = false;
      this.render();
    };
  }

  // ナビ全体を再描画
  private render() {
    const { items } = this.getNavItems();

    const mobileToggle = this.buildMobileToggle();
    const pcNav = this.buildPCNav(items);
    const mobileMenue = this.buildMobileMenue(items);

    this.root.replaceChildren(mobileToggle, pcNav, this.rightSlot, mobileMenue);

    this.bindGlobalCloseHandlers();
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
