import { renderNavbar } from "@/components/navbar";
import {
  renderInitialPage,
  registerBrowserBackAndForth,
} from "@/router/router";
import "./style.css";

const navContainer = document.querySelector("#nav")!;
navContainer.classList.add(
  "flex",
  "items-center",
  "gap-4",
  "w-full",
  "bg-gray-900",
  "text-white",
  "p-4",
  "shadow-lg",
);

// 中にリンクを追加
navContainer.appendChild(
  renderNavbar([
    "nav-link",
    "hover:text-yellow-300",
    "px-4",
    "py-2",
    "transition-colors",
  ]),
);

registerBrowserBackAndForth();
renderInitialPage();
