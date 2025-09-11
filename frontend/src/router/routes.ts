import type { Routes } from "@/models/routes";

import { HomeRoute } from "./home";
import { PingPongRoute } from "./pingpong";

export const routes: Routes = {
  ...HomeRoute,
  ...PingPongRoute,
} as const;
