// src/layout/renderLayout.ts
import { routes } from "@/router/routes";
import { domRoots } from "./root";
// Router が遷移やライフサイクルを司るため、ここでは遷移やマウントは行わない
// レイアウト（アプリ枠）を構築：ナビなどの共通UIのみ
export function buildLayout(_routePath: string) {
  // 事前クリアのみ。共通UIのマウントはRouter側の責務。
  domRoots.nav.innerHTML = "";
  domRoots.app.innerHTML = "";
}

// ルート固有のコンテンツを描画
export function renderRouteContent(routePath: string) {
  const route = routes[routePath];

  const content =
    typeof route.component.content === "function"
      ? route.component.content()
      : route.component.content;

  switch (route.layout) {
    case "auth":
      domRoots.app.innerHTML = `<div class="auth-screen">${content}</div>`;
      break;

    case "center":
      domRoots.app.innerHTML = `<div class="center-screen">${content}</div>`;
      break;

    default:
      domRoots.app.innerHTML = content;
  }
}
