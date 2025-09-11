import { renderNavbar } from "@/components/navbar";
import {
  renderInitialPage,
  registerBrowserBackAndForth,
} from "@/router/router";

const navbar = renderNavbar([
  "nav-link",
  "text-white",
  "hover:text-yellow-300",
  "px-4",
]);

const navContainer = document.querySelector("#nav")!;
navContainer.appendChild(navbar);

registerBrowserBackAndForth();
renderInitialPage();
