// src/router/routes.ts
import type { Route } from "@/types/routes";
import { HomeRoute } from "@/pages/home";
import { PingPongRoute } from "@/pages/pingpong";
import { PingPong3DGameRoute } from "@/pages/pingpong_3D";
import { PingPong3DGameRemoteRoute } from "@/pages/pingpong_3D_remote";
import { PingPong3DSettingRoute } from "@/pages/pingpong_3D_config";
import { LoginRoute } from "@/pages/login";
import { RegisterRoute } from "@/pages/register";
import { WebSocketRoute } from "@/pages/websocket";
import { TestWebRTCRoute } from "@/pages/test_webrtc";

export const routes: Record<string, Route> = {
  "/": HomeRoute["/"],
  "/pingpong": PingPongRoute["/pingpong"],
  "/pingpong_3D_config": PingPong3DSettingRoute["/pingpong_3D_config"],
  "/pingpong_3D": PingPong3DGameRoute["/pingpong_3D"],
  "/pingpong_3D_remote": PingPong3DGameRemoteRoute["/pingpong_3D_remote"],
  "/login": LoginRoute["/login"],
  "/register": RegisterRoute["/register"],
  "/websocket": WebSocketRoute["/websocket"],
  "/test_rtc": TestWebRTCRoute["/test_rtc"],
};
