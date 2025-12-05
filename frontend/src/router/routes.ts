// src/router/routes.ts
import type { Route } from "@/types/routes";
import { HomeRoute } from "@/pages/home";
import { PingPongRoute } from "@/pages/pingpong";
import { PingPong3DSettingRoute, PingPong3DGameRoute } from "@/pages/pingpong_3D";
import { LoginRoute } from "@/pages/login";
import { WebSocketRoute } from "@/pages/websocket";

export const routes: Record<string, Route> = {
  "/": HomeRoute["/"],
  "/pingpong": PingPongRoute["/pingpong"],
  "/pingpong_3D_config": PingPong3DSettingRoute["/pingpong_3D_config"],
	"/pingpong_3D": PingPong3DGameRoute["/pingpong_3D"],
  "/login": LoginRoute["/login"],
  "/websocket": WebSocketRoute["/websocket"],
};
