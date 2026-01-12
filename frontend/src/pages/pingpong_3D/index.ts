// pingpong_3D/index.ts ルーティングと設定画面
import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import { GameComponent } from "./GameComponent";
import { domRoots } from "@/layout/root";

const gameComponent = new GameComponent(domRoots.app, domRoots.nav);

export const PingPong3DGameRoute: Route = {
  linkLabel: () => word("pingpong3d"),
  content: () => gameComponent.render(),
  onMount: () => gameComponent.onMount(),
  onUnmount: () => gameComponent.onUnmount(),
  head: { title: "Ping Pong 3D" },
};
