// src/router/routes.ts
import type { Routes } from "@/types/routes";
import { HomeRoute } from "@/pages/home";
import { PingPongRoute } from "@/pages/pingpong";
import { PingPong3DGameRoute } from "@/pages/pingpong_3D";
import { PingPong3DGameRemoteRoute } from "@/pages/pingpong_3D_remote";
import { PingPong3DSettingRoute } from "@/pages/pingpong_3D_config";
import { LoginRoute } from "@/pages/login";
import { RegisterRoute } from "@/pages/register";
import { WebSocketRoute } from "@/pages/websocket";
import { TestWebRTCRoute } from "@/pages/test_webrtc";
import { NotFoundRoute } from "@/pages/404";

import { routeStyles } from "./consts/routeStyles";

export const routes: Routes = {
  "/": {
    component: HomeRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.home,
  },
  "/pingpong": {
    component: PingPongRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.pingpong,
  },
  "/pingpong_3D_config": {
    component: PingPong3DSettingRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.pingpong3DConfig,
  },
  "/pingpong_3D": {
    component: PingPong3DGameRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.pingpong3D,
  },
  "/pingpong_3D_remote": {
    component: PingPong3DGameRemoteRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.pingpong3DRemote,
  },
  "/login": {
    component: LoginRoute,
    show_navbar: false,
    layout: "auth",
    css_path: routeStyles.login,
  },
  "/register": {
    component: RegisterRoute,
    show_navbar: false,
    layout: "auth",
    css_path: routeStyles.register,
  },
  "/websocket": {
    component: WebSocketRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.websocket,
  },
  "/test_rtc": {
    component: TestWebRTCRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.testRtc,
  },
  "/not_found": {
    component: NotFoundRoute,
    show_navbar: false,
    layout: "hidden",
    css_path: routeStyles.notFound,
  },
};
