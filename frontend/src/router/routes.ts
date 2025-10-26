import type { Route } from "@/types/routes";
import { HomeRoute } from "@/pages/home";
import { PingPongRoute } from "@/pages/pingpong";
import { LoginRoute } from "@/pages/login";
import { WebSocketRoute } from "@/pages/websocket";

export const routes: Record<string, Route> = {
  "/": HomeRoute["/"],
  "/pingpong": PingPongRoute["/pingpong"],
  "/login": LoginRoute["/login"],
  "/websocket": WebSocketRoute["/websocket"],
};
