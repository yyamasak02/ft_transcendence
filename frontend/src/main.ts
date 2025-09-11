import { renderNavbar } from "@/components/navbar";
import {
  renderInitialPage,
  registerBrowserBackAndForth,
} from "@/router/router";
import "./style.css";

const navContainer = document.querySelector("#nav")!;
navContainer.classList.add(
  "flex",
  "gap-4",
  "fixed",
  "top-0",
  "left-0",
  "w-full",
  "bg-gray-800",
  "text-white",
  "p-2",
  "box-border",
  "mb-4",
);

// 中にリンクを追加
navContainer.appendChild(
  renderNavbar(["nav-link", "hover:text-yellow-300", "px-4"]),
);

registerBrowserBackAndForth();
renderInitialPage();
