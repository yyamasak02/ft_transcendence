import type { Route } from "@/types/routes";
import { HomeRoute } from "@/pages/home";
import { PingPongRoute } from "@/pages/pingpong";
import { PingPong3DRoute } from "@/pages/pingpong_3D";
import { LoginRoute } from "@/pages/login";
import { WebSocketRoute } from "@/pages/websocket";

export const routes: Record<string, Route> = {
  "/": HomeRoute["/"],
  "/pingpong": PingPongRoute["/pingpong"],
  "/pingpong_3D": PingPong3DRoute["/pingpong_3D"],
  "/login": LoginRoute["/login"],
  "/websocket": WebSocketRoute["/websocket"],
};
