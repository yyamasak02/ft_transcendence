// src/layout/renderLayout.ts
import { routes } from "@/router/routers";
import { domRoots } from "./root";
import { navigate } from "@/router";
import { t } from "@/i18n";
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

	mountLegalLinks(routePath);
}

const LEGAL_LINKS_ID = "glebal-legal-links";

function mountLegalLinks(currentPath: string) {
	// 二重生成防止
	const existing = document.getElementById(LEGAL_LINKS_ID);
	if (existing) existing.remove();

	// 特定のページでは表示しない
	const hiddenPath = ["/login", "/game", "/register", "/terms", "/privacy"];
	if (hiddenPath.includes(currentPath)) return;

	const div = document.createElement("div");
	div.id = LEGAL_LINKS_ID;
	div.className = `
		fixed bottom-4 left-1/2 -translate-x-1/2
		z-[2147483647]
		bg-black/80 text-white
		px-3 py-1.5 rounded-lg
		text-xs items-center gap-2
	`; 

	div.innerHTML = `
		<a href="/terms" data-nav="/terms" class="text-slate-300 underline hover:text-white visited:text-slate-300 active:text-slate-300">${t("terms")}</a>
		<sapn class="mx-2 text-slate-600"> . </span>
		<a href="/privacy" data-nav="/privacy" class="text-slate-300 underline hover:text-white visited:text-slate-300 active:text-slate-300">${t("privacy")}</a>
	`;

	div
		.querySelectorAll<HTMLAnchorElement>("a[data-nav]")
		.forEach((a) => {
			a.addEventListener("click", (e) => {
				e.preventDefault();
				const p = a.getAttribute("data-nav");
				if (p) navigate(p);
			});
		});

	document.body.appendChild(div);
}
