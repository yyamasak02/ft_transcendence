// pingpong_3D/object/ui3D/GameHUD.ts
import { word } from "@/i18n";
import { Scene, MeshBuilder, Vector3, Mesh, Observer } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  Control,
  TextBlock,
  StackPanel,
} from "@babylonjs/gui";

interface FloatingText {
  textBlock: TextBlock;
  lifetime: number;
  currentLife: number;
}

// ============================================
// GameHUD クラス
// ============================================

export class GameHUD {
  // カメラ演出用の定数
  public static readonly PLAY_VIEW_ALPHA = -Math.PI / 2;
  public static readonly PLAY_VIEW_BETA = Math.PI / 2.2;
  public static readonly PLAY_VIEW_RADIUS = 150;

  // UI配置・アニメーション用の定数
  private static readonly PANEL_START_LEFT_PX = 1200;
  private static readonly PANEL_TARGET_LEFT_PX = -80;
  private static readonly SLIDE_ANIM_DURATION_MS = 1000;

  private static readonly TITLE_FONT_SIZE = 100;
  private static readonly SCORE_FONT_SIZE = 64;
  private static readonly COUNTDOWN_FONT_SIZE = 80;

  private static readonly FLOATING_TEXT_SPAWN_INTERVAL_MS = 2500;
  private static readonly FLOATING_TEXT_LIFETIME_SEC = 6;
  private static readonly FLOATING_TEXT_INITIAL_LIFE_SEC = 8;

  readonly plane: Mesh;
  private meshTexture: AdvancedDynamicTexture;
  private screenTexture: AdvancedDynamicTexture;

  private scoreText: TextBlock;
  private countdownText: TextBlock;
  private infoText: TextBlock;
  private titleText: TextBlock;

  private resultPanel: StackPanel;
  private resultWinnerText: TextBlock;
  private resultScoreText: TextBlock;

  private floatingTexts: FloatingText[] = [];
  private maxFloatingTexts = 6;
  private lastSpawnTime = 0;
  private animationObserver: Observer<Scene> | null = null;
  private slideInObserver: Observer<Scene> | null = null;
  private isNextPing: boolean = true;

  constructor(scene: Scene) {
    // 板を作る
    this.plane = MeshBuilder.CreatePlane(
      "hudplane",
      { width: 18, height: 8 },
      scene,
    );
    // billboard　と衝突するので rotation と lookAt は使わない
    this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.plane.position = new Vector3(0, 12, -25);
    this.plane.scaling = new Vector3(5, 10, 5);
    // GUIを貼る
    this.meshTexture = AdvancedDynamicTexture.CreateForMesh(this.plane);

    // スコア
    this.scoreText = new TextBlock("score", "0 - 0");
    this.scoreText.fontSize = GameHUD.SCORE_FONT_SIZE;
    this.scoreText.color = "white";
    this.scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scoreText.top = "-70px";
    this.meshTexture.addControl(this.scoreText);

    // カウントダウン
    this.countdownText = new TextBlock("countdown", "");
    this.countdownText.fontSize = GameHUD.COUNTDOWN_FONT_SIZE;
    this.countdownText.color = "yellow";
    this.meshTexture.addControl(this.countdownText);

    // メッセージ (Game Over など)
    this.infoText = new TextBlock("info", "");
    this.infoText.fontSize = 36;
    this.infoText.color = "lightgray";
    this.infoText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.infoText.top = "60px";
    this.meshTexture.addControl(this.infoText);

    this.screenTexture = AdvancedDynamicTexture.CreateFullscreenUI(
      "UI",
      true,
      scene,
    );

    this.titleText = new TextBlock("title", "");
    this.titleText.fontSize = GameHUD.TITLE_FONT_SIZE;
    this.titleText.color = "#b2dbf5ff";
    this.titleText.fontWeight = "bold";
    this.titleText.outlineWidth = 10;
    this.titleText.outlineColor = "#3e71fdff";
    this.titleText.isVisible = false;
    this.titleText.zIndex = 100;
    this.screenTexture.addControl(this.titleText);

    this.resultPanel = new StackPanel("resultPanel");
    this.resultPanel.width = "1000px";
    this.resultPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.resultPanel.leftInPixels = GameHUD.PANEL_START_LEFT_PX;
    this.resultPanel.topInPixels = -80;
    this.resultPanel.isVisible = false;
    this.screenTexture.addControl(this.resultPanel);

    this.resultWinnerText = new TextBlock("resultWinner", "");
    this.resultWinnerText.height = "120px";
    this.resultWinnerText.fontSize = 80;
    this.resultWinnerText.color = "#f93b3bff";
    this.resultWinnerText.fontWeight = "bold";
    this.resultWinnerText.outlineWidth = 6;
    this.resultWinnerText.outlineColor = "black";
    this.resultWinnerText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultWinnerText.resizeToFit = true;
    this.resultPanel.addControl(this.resultWinnerText);

    this.resultScoreText = new TextBlock("resultScore", "");
    this.resultScoreText.height = "80px";
    this.resultScoreText.fontSize = 70;
    this.resultScoreText.color = "white";
    this.resultScoreText.outlineWidth = 6;
    this.resultScoreText.outlineColor = "black";
    this.resultScoreText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultScoreText.resizeToFit = true;
    this.resultPanel.addControl(this.resultScoreText);
  }

  startFloatingTextAnimation(scene: Scene) {
    if (this.animationObserver)
      scene.onBeforeRenderObservable.remove(this.animationObserver);

    this.lastSpawnTime = Date.now();
    this.animationObserver = scene.onBeforeRenderObservable.add(() => {
      const now = Date.now();
      const dt = scene.getEngine().getDeltaTime() / 1000;

      if (this.titleText.isVisible) {
        const pulse = (Math.sin(now * 0.005) + 1) / 2;
        this.titleText.outlineWidth = 5 + pulse * 10;
      }

      if (now - this.lastSpawnTime > GameHUD.FLOATING_TEXT_SPAWN_INTERVAL_MS) {
        this.lastSpawnTime = now;
        this.spawnFloatingText();
      }

      this.floatingTexts = this.floatingTexts.filter((ft) => {
        ft.currentLife -= dt;
        if (ft.currentLife <= 0) {
          ft.textBlock.dispose();
          return false;
        }

        const ratio = ft.currentLife / ft.lifetime;
        const invRatio = 1.0 - ratio;
        const scale = 1.0 + invRatio * 4.0;

        ft.textBlock.scaleX = scale;
        ft.textBlock.scaleY = scale;
        ft.textBlock.alpha = ratio * 0.4;

        return true;
      });
    });
  }

  private spawnFloatingText() {
    if (this.floatingTexts.length >= this.maxFloatingTexts) {
      const old = this.floatingTexts.shift();
      if (old) old.textBlock.dispose();
    }

    const textContent = this.isNextPing ? "PING" : "PONG";
    this.isNextPing = !this.isNextPing;

    const text = new TextBlock("ft", textContent);
    text.fontSize = 120;
    text.color = textContent === "PING" ? "#fcc6c6" : "#d1eefc";
    text.fontWeight = "bold";
    text.outlineWidth = 2;
    text.outlineColor = "white";

    text.leftInPixels = 0;
    text.topInPixels = 0;
    text.zIndex = 50;
    text.alpha = 0.4;

    this.screenTexture.addControl(text);

    this.floatingTexts.push({
      textBlock: text,
      lifetime: GameHUD.FLOATING_TEXT_INITIAL_LIFE_SEC,
      currentLife: GameHUD.FLOATING_TEXT_LIFETIME_SEC,
    });
  }

  private animateSlideIn() {
    const startTime = Date.now();
    const scene = this.plane.getScene();

    if (this.slideInObserver) {
      scene.onBeforeRenderObservable.remove(this.slideInObserver);
    }

    this.slideInObserver = scene.onBeforeRenderObservable.add(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / GameHUD.SLIDE_ANIM_DURATION_MS, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentPos =
        GameHUD.PANEL_START_LEFT_PX +
        (GameHUD.PANEL_TARGET_LEFT_PX - GameHUD.PANEL_START_LEFT_PX) * ease;

      this.resultPanel.leftInPixels = currentPos;

      if (progress >= 1) {
        if (this.slideInObserver) {
          scene.onBeforeRenderObservable.remove(this.slideInObserver);
          this.slideInObserver = null;
        }
      }
    });
  }

  showTitle() {
    this.titleText.text = "PING PONG 3D\n\nPRESS ENTER TO START";
    this.titleText.isVisible = true;
  }

  clearTitle() {
    this.titleText.isVisible = false;
  }

  showFinalResult(
    winner: "Player1" | "Player2",
    p1Score: number,
    p2Score: number,
  ) {
    const winnerName = winner === "Player1" ? word("player1") : word("player2");
    this.resultWinnerText.text = `${winnerName} ${word("wins")}!`;
    this.resultScoreText.text = `${p1Score} - ${p2Score}`;

    this.resultPanel.isVisible = true;
    this.animateSlideIn();
  }

  clearFinalResult() {
    this.resultPanel.isVisible = false;
    this.resultPanel.leftInPixels = GameHUD.PANEL_START_LEFT_PX;
  }

  setScore(p1: number, p2: number) {
    this.scoreText.text = `${p1} - ${p2}`;
  }

  setCountdown(text: string) {
    this.countdownText.text = text;
  }

  clearCountdown() {
    this.countdownText.text = "";
  }

  hideScore() {
    this.scoreText.isVisible = false;
  }
  showScore() {
    this.scoreText.isVisible = true;
  }

  clearGameOver() {
    this.infoText.text = "";
    this.clearFinalResult();
  }

  stopFloatingTextAnimation(scene: Scene) {
    if (this.animationObserver) {
      scene.onBeforeRenderObservable.remove(this.animationObserver);
      this.animationObserver = null;
    }
    this.floatingTexts.forEach((ft) => {
      if (ft.textBlock) ft.textBlock.dispose();
    });
    this.floatingTexts = [];
    this.isNextPing = true;
  }

  public dispose() {
    const scene = this.plane.getScene();

    // Observer の解除
    if (this.animationObserver) {
      scene.onBeforeRenderObservable.remove(this.animationObserver);
      this.animationObserver = null;
    }
    if (this.slideInObserver) {
      scene.onBeforeRenderObservable.remove(this.slideInObserver);
      this.slideInObserver = null;
    }

    this.floatingTexts.forEach((ft) => ft.textBlock?.dispose());
    this.floatingTexts = [];

    this.meshTexture.dispose();
    this.screenTexture.dispose();
    this.plane.dispose();
  }
}
