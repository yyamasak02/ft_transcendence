// src/router/routes.ts
import type { Routes } from "@/types/routes";
import { HomeRoute } from "@/pages/home";
import { PingPong3DGameRoute } from "@/pages/pingpong_3D";
import { PingPong3DSettingRoute } from "@/pages/pingpong_3D_config";
import { PingPong3DRemoteWaitingRoute } from "@/pages/pingpong_3D_remote";
import { LoginRoute } from "@/pages/login";
import { RegisterRoute } from "@/pages/register";
import { MeRoute } from "@/pages/me";
import { GoogleSignupRoute } from "@/pages/google_signup";
import { TwoFactorRoute } from "@/pages/two_factor";
import { UsernameChangeRoute } from "@/pages/username_change";
import { NotFoundRoute } from "@/pages/404";
import { UserProfileRoute } from "@/pages/user_profile";

import { routeStyles } from "./consts/routeStyles";

export const routes: Routes = {
  "/": {
    component: HomeRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.home,
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
    component: PingPong3DRemoteWaitingRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.pingpong3DConfig,
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
  "/me": {
    component: MeRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.me,
  },
  "/google-signup": {
    component: GoogleSignupRoute,
    show_navbar: false,
    layout: "auth",
    css_path: routeStyles.googleSignup,
  },
  "/two-factor": {
    component: TwoFactorRoute,
    show_navbar: false,
    layout: "auth",
    css_path: routeStyles.twoFactor,
  },
  "/username-change": {
    component: UsernameChangeRoute,
    show_navbar: false,
    layout: "auth",
    css_path: routeStyles.usernameChange,
  },
  "/user": {
    component: UserProfileRoute,
    show_navbar: true,
    layout: "center",
    css_path: routeStyles.userProfile,
  },
  "/not_found": {
    component: NotFoundRoute,
    show_navbar: false,
    layout: "hidden",
    css_path: routeStyles.notFound,
  },
};
