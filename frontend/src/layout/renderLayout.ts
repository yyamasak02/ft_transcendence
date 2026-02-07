// src/layout/renderLayout.ts
import { routes } from "@/router/routers";
import { domRoots } from "./root";
import { navigate } from "@/router";
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

	// 	const legalLinks = `
	// 	<div class="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400">
	// 		<a href="/terms" data-nav="/terms" class="underline hover:text-slate-200">Terms</a>
	// 		<span class="mx-2 text-slate-600">·</span>
	// 		<a href="/privacy" data-nav="/privacy" class="underline hover:text-slate-200">Privacy</a>
	// 	</div>
	// `;

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

	mountLegalLinks();

	  // // SPA遷移対応
		// domRoots.app.querySelectorAll<HTMLAnchorElement>("a[data-nav]").forEach((a) => {
		// 	a.addEventListener("click", (e) => {
		// 		e.preventDefault();
		// 		const p = a.getAttribute("data-nav");
		// 		if (p) navigate(p);
		// 	});
		// });
}

const LEGAL_LINKS_ID = "glebal-legal-links";

function mountLegalLinks() {
	// 二重生成防止
	const existing = document.getElementById(LEGAL_LINKS_ID);
	if (existing)
		existing.remove();

	const div = document.createElement("div");
	div.id = LEGAL_LINKS_ID;
	// div.className = 
	// 	"fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400 z-50";
	
	div.style.position = "fixed";
	div.style.left = "50%";
	div.style.bottom = "16px";
	div.style.transform = "translateX(-50%)";
	div.style.zIndex = "2147483647";
	div.style.background = "rgba(0,0,0,0.8)";
	div.style.color = "white";
	div.style.padding = "6px 10px";
	div.style.borderRadius = "8px";
	div.style.fontSize = "12px";
	div.style.pointerEvents = "auto";



	div.innerHTML = `
		<a href="/terms" data-nav="/terms" class="underline hover:text-slate-200">Terms</a>
		<sapn class="mx-2 text-slate-600"> . </span>
		<a href="/privacy" data-nav="/privacy" class="underline hover:text-slate-200">Privacy</a>
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
