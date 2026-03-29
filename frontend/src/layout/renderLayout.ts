// src/layout/renderLayout.ts
import { domRoots } from "./root";
import { navBar } from "@/components/Navbar";
import type { RouteConfig } from "@/types/routes";
import { langSwitcher } from "@/components/LangSwitcher";
import { footer } from "@/components/Footer";

// Router が遷移やライフサイクルを司るため、ここでは遷移やマウントは行わない
// レイアウト（アプリ枠）を構築：ナビなどの共通UIのみ
export function buildLayout(nextRoute: RouteConfig) {
  // 既存コンテンツをクリア
  domRoots.app.innerHTML = "";
  // 各ページのコンテンツエリアを生成
  const pageContentArea = document.createElement("div");
  pageContentArea.id = "app-content";
  if (nextRoute.show_navbar) {
    navBar.mount(domRoots.app);
    langSwitcher.mount(navBar.getRightSlot());
  }
  const content =
    typeof nextRoute.component.content === "function"
      ? nextRoute.component.content()
      : nextRoute.component.content;
  switch (nextRoute.layout) {
    case "auth":
      pageContentArea.innerHTML = `<div class="auth-screen">${content}</div>`;
      break;

    case "center":
      pageContentArea.innerHTML = `<div class="center-screen">${content}</div>`;
      break;

    default:
      pageContentArea.innerHTML = content;
  }
  domRoots.app.appendChild(pageContentArea);
  nextRoute.component.onMount?.();
  footer.mount(domRoots.footer);
}
