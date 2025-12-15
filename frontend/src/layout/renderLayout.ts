// src/layout/renderLayout.ts layout専用の描画関数
import { renderNavbar } from "@/components/navbar";
import { routes } from "@/router/routes";
import { NotFoundPage } from "@/pages/404";

const navRoot = document.querySelector<HTMLElement>("#nav")!;
const appRoot = document.querySelector<HTMLElement>("#app")!;

export function renderLayout(route: string) {
	// navbarを毎回作り直す
	navRoot.innerHTML = "";
	navRoot.appendChild(renderNavbar());

	const r = routes[route];
	if (!r) {
		appRoot.innerHTML = new NotFoundPage().render();
		return;
	}

	appRoot.innerHTML = typeof r.content === "function" ? r.content() : r.content;
	r.onMount?.();
}
