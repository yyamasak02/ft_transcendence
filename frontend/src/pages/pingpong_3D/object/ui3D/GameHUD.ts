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

  // 3Dプレーン設定
  private static readonly PLANE_WIDTH = 18;
  private static readonly PLANE_HEIGHT = 8;
  private static readonly PLANE_POSITION = new Vector3(0, 12, -25);
  private static readonly PLANE_SCALING = new Vector3(5, 10, 5);

  // フォントサイズ
  private static readonly FONT_SIZE_TITLE = 100;
  private static readonly FONT_SIZE_SCORE = 64;
  private static readonly FONT_SIZE_COUNTDOWN = 80;
  private static readonly FONT_SIZE_INFO = 36;
  private static readonly FONT_SIZE_RALLY_COUNT = 100;
  private static readonly FONT_SIZE_RALLY_LABEL = 40;
  private static readonly FONT_SIZE_NOTIFICATION = 80;
  private static readonly FONT_SIZE_RESULT_WINNER = 80;
  private static readonly FONT_SIZE_RESULT_SCORE = 70;
  private static readonly FONT_SIZE_FLOATING = 120;

  // UI配置・サイズ
  private static readonly SCORE_TOP_PX = -70;
  private static readonly INFO_TOP_PX = 60;

  private static readonly RALLY_PANEL_SIZE_PX = 200;
  private static readonly RALLY_PANEL_OFFSET_PX = 30;
  private static readonly RALLY_LABEL_TOP_OFFSET_PX = -10;

  private static readonly NOTIFICATION_TOP_PX = 150;

  private static readonly RESULT_PANEL_WIDTH_PX = 1000;
  private static readonly RESULT_PANEL_START_LEFT_PX = 1200;
  private static readonly RESULT_PANEL_TARGET_LEFT_PX = -80;
  private static readonly RESULT_PANEL_TOP_PX = -80;

  // アウトライン
  private static readonly OUTLINE_WIDTH_BOLD = 10;
  private static readonly OUTLINE_WIDTH_NORMAL = 6;
  private static readonly OUTLINE_WIDTH_THIN = 2;
  private static readonly SHADOW_OFFSET = 4;

  private static readonly SLIDE_ANIM_DURATION_MS = 1000;

  // ラリー拡大縮小演出
  private static readonly RALLY_BOUNCE_DURATION_MS = 400;
  private static readonly RALLY_BOUNCE_PEAK_RATIO = 0.3;
  private static readonly RALLY_BOUNCE_MAX_SCALE = 1.5;
  private static readonly RALLY_EFFECT_INTERVAL = 10;

  // 前進通知
  private static readonly NOTIFICATION_POPUP_MS = 300;
  private static readonly NOTIFICATION_FADE_MS = 1000;

  // タイトル演出
  private static readonly TITLE_PULSE_SPEED = 0.005;
  private static readonly TITLE_PULSE_MIN_WIDTH = 5;
  private static readonly TITLE_PULSE_RANGE = 10;

  // PINGとPONG
  private static readonly FLOATING_SPAWN_INTERVAL_MS = 2500;
  private static readonly FLOATING_LIFETIME_SEC = 6;
  private static readonly FLOATING_INITIAL_LIFE_SEC = 8;
  private static readonly FLOATING_MAX_COUNT = 6;
  private static readonly FLOATING_MAX_SCALE_ADDITION = 4.0;
  private static readonly FLOATING_MAX_ALPHA = 0.4;

  // カラーパレット
  private static readonly COLOR_WHITE = "white";
  private static readonly COLOR_YELLOW = "yellow";
  private static readonly COLOR_LIGHTGRAY = "lightgray";
  private static readonly COLOR_GOLD = "#FFD700";
  private static readonly COLOR_ORANGE_RED = "#FF4500";
  private static readonly COLOR_CYAN = "#00FFFF";
  private static readonly COLOR_BLACK = "#000000";
  private static readonly COLOR_TITLE_TEXT = "#b2dbf5ff";
  private static readonly COLOR_TITLE_OUTLINE = "#3e71fdff";
  private static readonly COLOR_WINNER_TEXT = "#f93b3bff";
  private static readonly COLOR_PING = "#fcc6c6";
  private static readonly COLOR_PONG = "#d1eefc";

  readonly plane: Mesh;
  private meshTexture: AdvancedDynamicTexture;
  private screenTexture: AdvancedDynamicTexture;

  private scoreText: TextBlock;
  private countdownText: TextBlock;
  private infoText: TextBlock;
  private titleText: TextBlock;

  private rallyPanel: StackPanel;
  private rallyCountText: TextBlock;
  private rallyLabelText: TextBlock;
  private rallyAnimObserver: Observer<Scene> | null = null;
  private notificationText: TextBlock;

  private resultPanel: StackPanel;
  private resultWinnerText: TextBlock;
  private resultScoreText: TextBlock;

  private floatingTexts: FloatingText[] = [];
  private lastSpawnTime = 0;
  private animationObserver: Observer<Scene> | null = null;
  private slideInObserver: Observer<Scene> | null = null;
  private isNextPing: boolean = true;

  // 初期生成
  constructor(scene: Scene) {
    // 板を作る
    this.plane = MeshBuilder.CreatePlane(
      "hudplane",
      { width: GameHUD.PLANE_WIDTH, height: GameHUD.PLANE_HEIGHT },
      scene,
    );
    // billboard　と衝突するので rotation と lookAt は使わない
    this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.plane.position = GameHUD.PLANE_POSITION;
    this.plane.scaling = GameHUD.PLANE_SCALING;
    // GUIを貼る
    this.meshTexture = AdvancedDynamicTexture.CreateForMesh(this.plane);

    // スコア
    this.scoreText = new TextBlock("score", "0 - 0");
    this.scoreText.fontSize = GameHUD.FONT_SIZE_SCORE;
    this.scoreText.color = GameHUD.COLOR_WHITE;
    this.scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scoreText.top = `${GameHUD.SCORE_TOP_PX}px`;
    this.meshTexture.addControl(this.scoreText);

    // カウントダウン
    this.countdownText = new TextBlock("countdown", "");
    this.countdownText.fontSize = GameHUD.FONT_SIZE_COUNTDOWN;
    this.countdownText.color = GameHUD.COLOR_YELLOW;
    this.meshTexture.addControl(this.countdownText);

    // メッセージ (Game Over など)
    this.infoText = new TextBlock("info", "");
    this.infoText.fontSize = GameHUD.FONT_SIZE_INFO;
    this.infoText.color = GameHUD.COLOR_LIGHTGRAY;
    this.infoText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.infoText.top = `${GameHUD.INFO_TOP_PX}px`;
    this.meshTexture.addControl(this.infoText);

    this.screenTexture = AdvancedDynamicTexture.CreateFullscreenUI(
      "UI",
      true,
      scene,
    );

    // ラリーパネル
    this.rallyPanel = new StackPanel("rallyPanel");
    this.rallyPanel.width = `${GameHUD.RALLY_PANEL_SIZE_PX}px`;
    this.rallyPanel.height = `${GameHUD.RALLY_PANEL_SIZE_PX}px`;
    this.rallyPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.rallyPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.rallyPanel.left = `${GameHUD.RALLY_PANEL_OFFSET_PX}px`;
    this.rallyPanel.top = `${GameHUD.RALLY_PANEL_OFFSET_PX}px`;
    this.rallyPanel.isVisible = false;
    this.screenTexture.addControl(this.rallyPanel);

    // ラリー数
    this.rallyCountText = new TextBlock("rallyCount", "0");
    this.rallyCountText.fontSize = GameHUD.FONT_SIZE_RALLY_COUNT;
    this.rallyCountText.height = `${GameHUD.FONT_SIZE_RALLY_COUNT}px`;
    this.rallyCountText.fontFamily = "Bebas Neue, sans-serif";
    this.rallyCountText.color = GameHUD.COLOR_GOLD;
    this.rallyCountText.outlineWidth = GameHUD.OUTLINE_WIDTH_NORMAL;
    this.rallyCountText.outlineColor = GameHUD.COLOR_BLACK;
    this.rallyCountText.shadowBlur = 0;
    this.rallyCountText.shadowColor = GameHUD.COLOR_BLACK;
    this.rallyCountText.shadowOffsetX = GameHUD.SHADOW_OFFSET;
    this.rallyCountText.shadowOffsetY = GameHUD.SHADOW_OFFSET;
    this.rallyPanel.addControl(this.rallyCountText);

    // ラリーラベル
    this.rallyLabelText = new TextBlock("rallyLabel", "RALLY");
    this.rallyLabelText.fontSize = GameHUD.FONT_SIZE_RALLY_LABEL;
    this.rallyLabelText.height = `${GameHUD.FONT_SIZE_RALLY_LABEL}px`;
    this.rallyLabelText.fontFamily = "Bebas Neue, sans-serif";
    this.rallyLabelText.color = GameHUD.COLOR_WHITE;
    this.rallyLabelText.outlineWidth = 0;
    this.rallyLabelText.outlineColor = GameHUD.COLOR_BLACK;
    this.rallyLabelText.top = `${GameHUD.RALLY_LABEL_TOP_OFFSET_PX}px`;
    this.rallyPanel.addControl(this.rallyLabelText);

    // 前進通知
    this.notificationText = new TextBlock("notification", "");
    this.notificationText.fontSize = GameHUD.FONT_SIZE_NOTIFICATION;
    this.notificationText.fontFamily = "Bebas Neue, sans-serif";
    this.notificationText.color = GameHUD.COLOR_CYAN;
    this.notificationText.textVerticalAlignment =
      Control.VERTICAL_ALIGNMENT_TOP;
    this.notificationText.top = `${GameHUD.NOTIFICATION_TOP_PX}px`;
    this.notificationText.outlineWidth = 5;
    this.notificationText.outlineColor = GameHUD.COLOR_BLACK;
    this.notificationText.isVisible = false;
    this.screenTexture.addControl(this.notificationText);

    // タイトル
    this.titleText = new TextBlock("title", "");
    this.titleText.fontSize = GameHUD.FONT_SIZE_TITLE;
    this.titleText.color = GameHUD.COLOR_TITLE_TEXT;
    this.titleText.fontWeight = "bold";
    this.titleText.outlineWidth = GameHUD.OUTLINE_WIDTH_BOLD;
    this.titleText.outlineColor = GameHUD.COLOR_TITLE_OUTLINE;
    this.titleText.isVisible = false;
    this.titleText.zIndex = 100;
    this.screenTexture.addControl(this.titleText);

    // リザルトパネル
    this.resultPanel = new StackPanel("resultPanel");
    this.resultPanel.width = `${GameHUD.RESULT_PANEL_WIDTH_PX}px`;
    this.resultPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.resultPanel.leftInPixels = GameHUD.RESULT_PANEL_START_LEFT_PX;
    this.resultPanel.topInPixels = GameHUD.RESULT_PANEL_TOP_PX;
    this.resultPanel.isVisible = false;
    this.screenTexture.addControl(this.resultPanel);

    // リザルト(勝者名)
    this.resultWinnerText = new TextBlock("resultWinner", "");
    this.resultWinnerText.height = "120px";
    this.resultWinnerText.fontSize = GameHUD.FONT_SIZE_RESULT_WINNER;
    this.resultWinnerText.color = GameHUD.COLOR_WINNER_TEXT;
    this.resultWinnerText.fontWeight = "bold";
    this.resultWinnerText.outlineWidth = GameHUD.OUTLINE_WIDTH_NORMAL;
    this.resultWinnerText.outlineColor = GameHUD.COLOR_BLACK;
    this.resultWinnerText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultWinnerText.resizeToFit = true;
    this.resultPanel.addControl(this.resultWinnerText);

    // リザルト(スコア)
    this.resultScoreText = new TextBlock("resultScore", "");
    this.resultScoreText.height = "80px";
    this.resultScoreText.fontSize = GameHUD.FONT_SIZE_RESULT_SCORE;
    this.resultScoreText.color = GameHUD.COLOR_WHITE;
    this.resultScoreText.outlineWidth = GameHUD.OUTLINE_WIDTH_NORMAL;
    this.resultScoreText.outlineColor = GameHUD.COLOR_BLACK;
    this.resultScoreText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultScoreText.resizeToFit = true;
    this.resultPanel.addControl(this.resultScoreText);
  }

  // ラリー数更新と演出
  setRallyCount(count: number) {
    this.rallyCountText.text = count.toString();

    if (count > 0 && count % GameHUD.RALLY_EFFECT_INTERVAL === 0) {
      this.rallyCountText.color = GameHUD.COLOR_ORANGE_RED;
      this.triggerRallyBounce();
    } else {
      this.rallyCountText.color = GameHUD.COLOR_GOLD;
    }
  }

  // 拡大縮小演出
  private triggerRallyBounce() {
    const scene = this.plane.getScene();

    if (this.rallyAnimObserver) {
      scene.onBeforeRenderObservable.remove(this.rallyAnimObserver);
      this.rallyPanel.scaleX = 1.0;
      this.rallyPanel.scaleY = 1.0;
    }

    let elapsed = 0;
    const DURATION = GameHUD.RALLY_BOUNCE_DURATION_MS;
    const PEAK_RATIO = GameHUD.RALLY_BOUNCE_PEAK_RATIO;
    const MAX_SCALE = GameHUD.RALLY_BOUNCE_MAX_SCALE;

    this.rallyAnimObserver = scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime();
      elapsed += dt;
      const t = Math.min(elapsed / DURATION, 1.0);

      let scale = 1.0;
      if (t < PEAK_RATIO) {
        const tPhase = t / PEAK_RATIO;
        scale = 1.0 + (MAX_SCALE - 1.0) * tPhase;
      } else {
        const tPhase = (t - PEAK_RATIO) / (1.0 - PEAK_RATIO);
        scale = MAX_SCALE - (MAX_SCALE - 1.0) * (1 - Math.pow(1 - tPhase, 3));
      }

      this.rallyPanel.scaleX = scale;
      this.rallyPanel.scaleY = scale;

      if (t >= 1.0) {
        this.rallyPanel.scaleX = 1.0;
        this.rallyPanel.scaleY = 1.0;
        if (this.rallyAnimObserver) {
          scene.onBeforeRenderObservable.remove(this.rallyAnimObserver);
          this.rallyAnimObserver = null;
        }
      }
    });
  }

  showRallyText() {
    this.rallyPanel.isVisible = true;
  }

  hideRallyText() {
    this.rallyPanel.isVisible = false;
  }

  showNotification(text: string, duration = 2000) {
    this.notificationText.text = text;
    this.notificationText.isVisible = true;
    this.notificationText.alpha = 1.0;
    this.notificationText.scaleX = 0.5;
    this.notificationText.scaleY = 0.5;

    const scene = this.plane.getScene();
    const POPUP_TIME = GameHUD.NOTIFICATION_POPUP_MS;
    const FADE_TIME = GameHUD.NOTIFICATION_FADE_MS;

    let elapsed = 0;
    const observer = scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime();
      elapsed += dt;

      if (elapsed < POPUP_TIME) {
        const t = elapsed / POPUP_TIME;
        const scale = 0.5 + 0.5 * (1 - Math.pow(1 - t, 3));
        this.notificationText.scaleX = scale;
        this.notificationText.scaleY = scale;
      } else if (elapsed > duration - FADE_TIME) {
        const fadeT = (elapsed - (duration - FADE_TIME)) / FADE_TIME;
        this.notificationText.alpha = 1.0 - fadeT;
      }

      if (elapsed >= duration) {
        this.notificationText.isVisible = false;
        scene.onBeforeRenderObservable.remove(observer);
      }
    });
  }

  // PINGとPONGの背景演出
  startFloatingTextAnimation(scene: Scene) {
    if (this.animationObserver)
      scene.onBeforeRenderObservable.remove(this.animationObserver);

    this.lastSpawnTime = Date.now();
    this.animationObserver = scene.onBeforeRenderObservable.add(() => {
      const now = Date.now();
      const dt = scene.getEngine().getDeltaTime() / 1000;

      if (this.titleText.isVisible) {
        const pulse = (Math.sin(now * GameHUD.TITLE_PULSE_SPEED) + 1) / 2;
        this.titleText.outlineWidth =
          GameHUD.TITLE_PULSE_MIN_WIDTH + pulse * GameHUD.TITLE_PULSE_RANGE;
      }

      if (now - this.lastSpawnTime > GameHUD.FLOATING_SPAWN_INTERVAL_MS) {
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
        const scale = 1.0 + invRatio * GameHUD.FLOATING_MAX_SCALE_ADDITION;

        ft.textBlock.scaleX = scale;
        ft.textBlock.scaleY = scale;
        ft.textBlock.alpha = ratio * GameHUD.FLOATING_MAX_ALPHA;

        return true;
      });
    });
  }

  // PINGとPONGのリスト追加
  private spawnFloatingText() {
    if (this.floatingTexts.length >= GameHUD.FLOATING_MAX_COUNT) {
      const old = this.floatingTexts.shift();
      if (old) old.textBlock.dispose();
    }

    const textContent = this.isNextPing ? "PING" : "PONG";
    this.isNextPing = !this.isNextPing;

    const text = new TextBlock("ft", textContent);
    text.fontSize = GameHUD.FONT_SIZE_FLOATING;
    text.color =
      textContent === "PING" ? GameHUD.COLOR_PING : GameHUD.COLOR_PONG;
    text.fontWeight = "bold";
    text.outlineWidth = GameHUD.OUTLINE_WIDTH_THIN;
    text.outlineColor = GameHUD.COLOR_WHITE;

    text.leftInPixels = 0;
    text.topInPixels = 0;
    text.zIndex = 50;
    text.alpha = GameHUD.FLOATING_MAX_ALPHA;

    this.screenTexture.addControl(text);

    this.floatingTexts.push({
      textBlock: text,
      lifetime: GameHUD.FLOATING_INITIAL_LIFE_SEC,
      currentLife: GameHUD.FLOATING_LIFETIME_SEC,
    });
  }

  // リザルトの右からスライドする演出
  private animateSlideIn() {
    const startTime = Date.now();
    const scene = this.plane.getScene();

    if (this.slideInObserver) {
      scene.onBeforeRenderObservable.remove(this.slideInObserver);
    }

    const startLeft = GameHUD.RESULT_PANEL_START_LEFT_PX;
    const targetLeft = GameHUD.RESULT_PANEL_TARGET_LEFT_PX;

    this.slideInObserver = scene.onBeforeRenderObservable.add(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / GameHUD.SLIDE_ANIM_DURATION_MS, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentPos = startLeft + (targetLeft - startLeft) * ease;

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
    this.resultPanel.leftInPixels = GameHUD.RESULT_PANEL_START_LEFT_PX;
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

  // PINGとPONGの停止
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
    if (this.rallyAnimObserver) {
      scene.onBeforeRenderObservable.remove(this.rallyAnimObserver);
      this.rallyAnimObserver = null;
    }

    this.floatingTexts.forEach((ft) => ft.textBlock?.dispose());
    this.floatingTexts = [];
    this.meshTexture.dispose();
    this.screenTexture.dispose();
    this.plane.dispose();
  }
}
