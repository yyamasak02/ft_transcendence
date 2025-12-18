// /src/main.ts

import { renderNavbar } from "@/components/navbar";
import {
  renderInitialPage,
  registerBrowserBackAndForth,
} from "@/router/router";
import "./style.css";

const navContainer = document.querySelector("#nav")!;

// 中にリンクを追加
navContainer.appendChild(renderNavbar());

registerBrowserBackAndForth();
renderInitialPage();
