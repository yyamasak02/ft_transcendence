// pingpong_3D/index.ts ルーティングと設定画面
import type { Routes } from "@/types/routes";
import * as PingPong3DGame from "./game-main";
import { PingPong3DGameView } from "./game-view";
import { navigate } from "@/router/router";
import "./style.css";
import { word } from "@/i18n";

const gameView = new PingPong3DGameView();

export const PingPong3DGameRoute: Routes = {
  "/pingpong_3D": {
    linkLabel: () => word("pingpong3d"),
    content: () => gameView.render(),
    onMount: () => {
      const app = document.getElementById("app");
      if (app) app.classList.add("no-overflow");
      document.body.classList.add("game-body");
      const nav = document.getElementById("nav");
      if (nav) nav.style.display = "none";

      // ゲーム初期化
      PingPong3DGame.stopGame();
      PingPong3DGame.startGame();

      const gameRoot = document.getElementById(
        "pingpong-3d-root",
      ) as HTMLElement | null;
      if (!gameRoot) {
        console.error("pingpong-3d-root not found");
        return;
      }

      const handleHome = () => {
        PingPong3DGame.stopGame();
        navigate("/");
      };

      const handleSettings = () => {
        PingPong3DGame.stopGame();
        navigate("/pingpong_3D_config");
      };

      // HOMEボタン
      gameRoot
        .querySelector("#btn-3d-home-nav")
        ?.addEventListener("click", handleHome);
      gameRoot
        .querySelector("#btn-3d-home")
        ?.addEventListener("click", handleHome);

      // SETTINGSボタン
      const btnSettingsNav =
        gameRoot.querySelector("#btn-3d-settings-nav") ||
        gameRoot.querySelector("#btn-3d-setting-nav");
      const btnSettingsCentral =
        gameRoot.querySelector("#btn-3d-settings") ||
        gameRoot.querySelector("#btn-3d-setting");

      btnSettingsNav?.addEventListener("click", handleSettings);
      btnSettingsCentral?.addEventListener("click", handleSettings);

      // PAUSEボタン
      gameRoot.querySelector("#btn-3d-pause")?.addEventListener("click", () => {
        PingPong3DGame.pauseGame();
      });

      // RESUMEボタン
      gameRoot
        .querySelector("#btn-3d-resume")
        ?.addEventListener("click", () => {
          PingPong3DGame.resumeGame();
        });

      // RESETボタン
      gameRoot.querySelector("#btn-3d-reset")?.addEventListener("click", () => {
        if (PingPong3DGame.gameState.resetLocked) return;
        PingPong3DGame.resetGame();
      });

      // CAMERA RESETボタン
      gameRoot
        .querySelector("#btn-3d-camera-reset")
        ?.addEventListener("click", () => {
          PingPong3DGame.resetCamera();
        });
    },
    onUnmount: () => {
      document.body.classList.remove("game-body");
      const nav = document.getElementById("nav");
      if (nav) nav.style.display = "flex";
      PingPong3DGame.stopGame();
    },
    head: { title: "Ping Pong 3D" },
  },
};
