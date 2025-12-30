// src/layout/renderLayout.ts layout専用の描画関数
import { renderNavbar } from "@/components/navbar";
import { routes } from "@/router/routes";
import { NotFoundPage } from "@/pages/404";

const navRoot = document.querySelector<HTMLElement>("#nav")!;
const appRoot = document.querySelector<HTMLElement>("#app")!;

const AUTH_ROUTES = ["/login", "/register", "/google-signup", "/two-factor"];
// center配置にするルート
const CENTER_ROUTES = ["/", "/pingpong", "/pingpong_3D_config", "/websocket"];

export function renderLayout(route: string) {	
	const r = routes[route];
	if (!r) {
		navRoot.innerHTML = "";
		appRoot.innerHTML = new NotFoundPage().render();
		return;
	}
	
	const isAuthPage = AUTH_ROUTES.includes(route);
	const isCenterPage = CENTER_ROUTES.includes(route);
	
	// navbar
	navRoot.innerHTML = "";
	if (!isAuthPage) navRoot.appendChild(renderNavbar());
	
	// content
	const content = typeof r.content === "function" ? r.content() : r.content;

	if (isAuthPage) {
		appRoot.innerHTML = `<div class="auth-screen">${content}</div>`;
	} else if (isCenterPage) {
		appRoot.innerHTML = `<div class="center-screen">${content}</div>`;
	} else {
		appRoot.innerHTML = content;
	}

	r.onMount?.();
}
