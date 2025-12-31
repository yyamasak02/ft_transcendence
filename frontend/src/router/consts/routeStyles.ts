import home from "@/pages/home/style.css?url";
import pingpong from "@/pages/pingpong/style.css?url";
import pingpong3D from "@/pages/pingpong_3D/style.css?url";
import pingpong3DConfig from "@/pages/pingpong_3D_config/style.css?url";
import login from "@/pages/login/style.css?url";
import register from "@/pages/register/style.css?url";
import websocket from "@/pages/websocket/style.css?url";
import testRtc from "@/pages/test_webrtc/style.css?url";
import notFound from "@/pages/404/style.css?url";

export const routeStyles = {
  home,
  pingpong,
  pingpong3D,
  pingpong3DConfig,
  login,
  register,
  websocket,
  testRtc,
  notFound,
} as const;
