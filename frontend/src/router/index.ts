// src/router/index.ts
import { Router } from "./class/Router";

export const router = new Router();

export function navigate(path: string) {
  return router.navigate(path);
}

export function rerender() {
  return router.rerender();
}

const RETURN_TO_KEY = "return_to";

export const setReturnTo = (value: string) => {
  if (!value.startsWith("/") || value.startsWith("//")) return;
  sessionStorage.setItem(RETURN_TO_KEY, value);
};

export const getReturnTo = () => sessionStorage.getItem(RETURN_TO_KEY) ?? "/";

export const clearReturnTo = () => {
  sessionStorage.removeItem(RETURN_TO_KEY);
};

export const getCurrentPath = () =>
  `${window.location.pathname}${window.location.search}`;
