// src/router/index.ts
import { Router } from "./Router";

export const router = new Router();

export function navigate(path: string) {
  return router.navigate(path);
}

export function rerender() {
  return router.rerender();
}
