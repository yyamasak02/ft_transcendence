// src/router/index.ts
import {
  registerBrowserBackAndForth,
  renderInitialPage,
} from "./router";

export const initializeRoutes = () => {
  registerBrowserBackAndForth();
  renderInitialPage();
};
