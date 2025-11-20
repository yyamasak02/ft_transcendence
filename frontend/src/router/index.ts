import {
  registerBrowserBackAndForth,
  // registerNavLinks,
  renderInitialPage,
  // renderNavLinks,
} from "./router";

// export const initializeRoutes = (className = "nav-link") => {
//   // renderNavLinks(className);
//   // registerNavLinks();
//   registerBrowserBackAndForth();
//   renderInitialPage();
// };

export const initializeRoutes = () => {
  registerBrowserBackAndForth();
  renderInitialPage();
};
