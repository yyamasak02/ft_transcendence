// pingpong_3D/object/ui3D/GameHUD.ts
import { word } from "@/i18n";
import { Scene, MeshBuilder, Vector3, Mesh, Observer } from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  Control,
  TextBlock,
  StackPanel,
} from "@babylonjs/gui";
import { isMobileViewport } from "../stageControl/cameraControl";

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
  private static readonly FONT_SIZE_FLOATING = 72;

  /** モバイルではベースサイズに対してこの倍率で描画（文字がはみ出しにくくする） */
  private static readonly MOBILE_FONT_SCALE = 0.5;

  // UI配置・サイズ
  private static readonly SCORE_TOP_PX = -70;
  private static readonly INFO_TOP_PX = 60;

  private static readonly RALLY_PANEL_SIZE_PX = 200;
  private static readonly RALLY_PANEL_OFFSET_PX = 30;
  private static readonly RALLY_LABEL_TOP_OFFSET_PX = -10;
  /** モバイルで得点をラリーパネル右に置くときの隙間 */
  private static readonly SCORE_GAP_FROM_RALLY_PX = 10;

  private static readonly NOTIFICATION_TOP_PX = 150;

  /** リザルトパネルは画面外右からスライド（開始オフセットは動的に決める） */
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
  private static readonly FLOATING_MAX_SCALE_ADDITION = 1.0;
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
  /** モバイル時のみ: ラリー表示の右隣に出す得点 */
  private scoreTextScreen: TextBlock | null = null;
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
    // billboardと衝突するので rotation と lookAt は使わない
    this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.plane.position = GameHUD.PLANE_POSITION;
    this.plane.scaling = GameHUD.PLANE_SCALING;
    // GUIを貼る
    this.meshTexture = AdvancedDynamicTexture.CreateForMesh(this.plane);

    // スコア
    this.scoreText = new TextBlock("score", "0 - 0");
    this.scoreText.fontSize = GameHUD.scaledFontSize(GameHUD.FONT_SIZE_SCORE);
    this.scoreText.color = GameHUD.COLOR_WHITE;
    this.scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scoreText.top = `${GameHUD.SCORE_TOP_PX}px`;
    this.scoreText.width = "96%";
    this.scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.meshTexture.addControl(this.scoreText);

    // カウントダウン
    this.countdownText = new TextBlock("countdown", "");
    this.countdownText.fontSize = GameHUD.scaledFontSize(
      GameHUD.FONT_SIZE_COUNTDOWN,
    );
    this.countdownText.color = GameHUD.COLOR_YELLOW;
    this.countdownText.width = "96%";
    this.countdownText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.countdownText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.meshTexture.addControl(this.countdownText);

    // メッセージ (Game Over など)
    this.infoText = new TextBlock("info", "");
    this.infoText.fontSize = GameHUD.scaledFontSize(GameHUD.FONT_SIZE_INFO);
    this.infoText.color = GameHUD.COLOR_LIGHTGRAY;
    this.infoText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.infoText.top = `${GameHUD.INFO_TOP_PX}px`;
    this.infoText.width = "92%";
    this.infoText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.infoText.textWrapping = true;
    this.meshTexture.addControl(this.infoText);

    this.screenTexture = AdvancedDynamicTexture.CreateFullscreenUI(
      "UI",
      true,
      scene,
    );

    // ラリーパネル（モバイルは文字に合わせて枠もやや小さく）
    const rallyPanelPx = isMobileViewport()
      ? Math.max(140, Math.round(GameHUD.RALLY_PANEL_SIZE_PX * 0.78))
      : GameHUD.RALLY_PANEL_SIZE_PX;
    this.rallyPanel = new StackPanel("rallyPanel");
    this.rallyPanel.width = `${rallyPanelPx}px`;
    this.rallyPanel.height = `${rallyPanelPx}px`;
    this.rallyPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.rallyPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.rallyPanel.left = `${GameHUD.RALLY_PANEL_OFFSET_PX}px`;
    this.rallyPanel.top = `${GameHUD.RALLY_PANEL_OFFSET_PX}px`;
    this.rallyPanel.isVisible = false;
    this.screenTexture.addControl(this.rallyPanel);

    // ラリー数
    this.rallyCountText = new TextBlock("rallyCount", "0");
    this.rallyCountText.fontSize = GameHUD.scaledFontSize(
      GameHUD.FONT_SIZE_RALLY_COUNT,
    );
    this.rallyCountText.height = `${GameHUD.scaledFontSize(GameHUD.FONT_SIZE_RALLY_COUNT)}px`;
    this.rallyCountText.fontFamily = "Bebas Neue, sans-serif";
    this.rallyCountText.color = GameHUD.COLOR_GOLD;
    this.rallyCountText.outlineWidth = GameHUD.scaledFontSize(
      GameHUD.OUTLINE_WIDTH_NORMAL,
    );
    this.rallyCountText.outlineColor = GameHUD.COLOR_BLACK;
    this.rallyCountText.shadowBlur = 0;
    this.rallyCountText.shadowColor = GameHUD.COLOR_BLACK;
    this.rallyCountText.shadowOffsetX = GameHUD.scaledFontSize(
      GameHUD.SHADOW_OFFSET,
    );
    this.rallyCountText.shadowOffsetY = GameHUD.scaledFontSize(
      GameHUD.SHADOW_OFFSET,
    );
    this.rallyPanel.addControl(this.rallyCountText);

    // ラリーラベル
    this.rallyLabelText = new TextBlock("rallyLabel", "RALLY");
    this.rallyLabelText.fontSize = GameHUD.scaledFontSize(
      GameHUD.FONT_SIZE_RALLY_LABEL,
    );
    this.rallyLabelText.height = `${GameHUD.scaledFontSize(GameHUD.FONT_SIZE_RALLY_LABEL)}px`;
    this.rallyLabelText.fontFamily = "Bebas Neue, sans-serif";
    this.rallyLabelText.color = GameHUD.COLOR_WHITE;
    this.rallyLabelText.outlineWidth = 0;
    this.rallyLabelText.outlineColor = GameHUD.COLOR_BLACK;
    this.rallyLabelText.top = `${GameHUD.RALLY_LABEL_TOP_OFFSET_PX}px`;
    this.rallyPanel.addControl(this.rallyLabelText);

    // モバイル: 得点をラリーパネルの右隣（ゲーム中は 3D プレーン上の得点は使わない）
    if (isMobileViewport()) {
      this.scoreText.isVisible = false;
      this.scoreTextScreen = new TextBlock("scoreScreen", "0 - 0");
      this.scoreTextScreen.fontSize = GameHUD.scaledFontSize(
        GameHUD.FONT_SIZE_SCORE,
      );
      this.scoreTextScreen.color = GameHUD.COLOR_WHITE;
      this.scoreTextScreen.fontFamily = "Bebas Neue, sans-serif";
      this.scoreTextScreen.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      this.scoreTextScreen.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.scoreTextScreen.left = `${GameHUD.RALLY_PANEL_OFFSET_PX + rallyPanelPx + GameHUD.SCORE_GAP_FROM_RALLY_PX}px`;
      this.scoreTextScreen.top = `${GameHUD.RALLY_PANEL_OFFSET_PX}px`;
      this.scoreTextScreen.textHorizontalAlignment =
        Control.HORIZONTAL_ALIGNMENT_LEFT;
      this.scoreTextScreen.zIndex = 5;
      this.scoreTextScreen.isVisible = false;
      this.screenTexture.addControl(this.scoreTextScreen);
    }

    // 前進通知
    this.notificationText = new TextBlock("notification", "");
    this.notificationText.fontSize = GameHUD.scaledFontSize(
      GameHUD.FONT_SIZE_NOTIFICATION,
    );
    this.notificationText.fontFamily = "Bebas Neue, sans-serif";
    this.notificationText.color = GameHUD.COLOR_CYAN;
    this.notificationText.textVerticalAlignment =
      Control.VERTICAL_ALIGNMENT_TOP;
    this.notificationText.top = `${GameHUD.NOTIFICATION_TOP_PX}px`;
    this.notificationText.width = "88%";
    this.notificationText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.notificationText.textWrapping = true;
    this.notificationText.outlineWidth = GameHUD.scaledFontSize(5);
    this.notificationText.outlineColor = GameHUD.COLOR_BLACK;
    this.notificationText.isVisible = false;
    this.screenTexture.addControl(this.notificationText);

    // タイトル
    this.titleText = new TextBlock("title", "");
    this.titleText.fontSize = GameHUD.scaledFontSize(GameHUD.FONT_SIZE_TITLE);
    this.titleText.color = GameHUD.COLOR_TITLE_TEXT;
    this.titleText.fontWeight = "bold";
    this.titleText.outlineWidth = GameHUD.scaledFontSize(
      GameHUD.OUTLINE_WIDTH_BOLD,
    );
    this.titleText.outlineColor = GameHUD.COLOR_TITLE_OUTLINE;
    this.titleText.width = "92%";
    this.titleText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.titleText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.titleText.textWrapping = true;
    this.titleText.isVisible = false;
    this.titleText.zIndex = 100;
    this.screenTexture.addControl(this.titleText);

    // リザルトパネル（clip すると折り返し長文の上下が欠けるためクリップしない）
    this.resultPanel = new StackPanel("resultPanel");
    this.resultPanel.width = "88%";
    this.resultPanel.clipChildren = false;
    this.resultPanel.spacing = 6;
    this.resultPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.resultPanel.leftInPixels = GameHUD.getResultPanelStartLeftPx(scene);
    this.resultPanel.topInPixels = GameHUD.RESULT_PANEL_TOP_PX;
    this.resultPanel.isVisible = false;
    this.screenTexture.addControl(this.resultPanel);

    // リザルト(勝者名) — 固定 height は行数・アウトラインで不足しがちなので内容に合わせる
    this.resultWinnerText = new TextBlock("resultWinner", "");
    this.resultWinnerText.fontSize = GameHUD.scaledFontSize(
      GameHUD.FONT_SIZE_RESULT_WINNER,
    );
    this.resultWinnerText.color = GameHUD.COLOR_WINNER_TEXT;
    this.resultWinnerText.fontWeight = "bold";
    this.resultWinnerText.outlineWidth = GameHUD.scaledFontSize(
      GameHUD.OUTLINE_WIDTH_NORMAL,
    );
    this.resultWinnerText.outlineColor = GameHUD.COLOR_BLACK;
    this.resultWinnerText.width = "100%";
    this.resultWinnerText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultWinnerText.textWrapping = true;
    this.resultWinnerText.resizeToFit = true;
    this.resultPanel.addControl(this.resultWinnerText);

    // リザルト(スコア)
    this.resultScoreText = new TextBlock("resultScore", "");
    this.resultScoreText.fontSize = GameHUD.scaledFontSize(
      GameHUD.FONT_SIZE_RESULT_SCORE,
    );
    this.resultScoreText.color = GameHUD.COLOR_WHITE;
    this.resultScoreText.outlineWidth = GameHUD.scaledFontSize(
      GameHUD.OUTLINE_WIDTH_NORMAL,
    );
    this.resultScoreText.outlineColor = GameHUD.COLOR_BLACK;
    this.resultScoreText.width = "100%";
    this.resultScoreText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resultScoreText.textWrapping = true;
    this.resultScoreText.resizeToFit = true;
    this.resultPanel.addControl(this.resultScoreText);
  }

  /** 画面右外にパネルを置くための left（幅に依存するため動的） */
  private static getResultPanelStartLeftPx(scene: Scene): number {
    return scene.getEngine().getRenderWidth() + 80;
  }

  /** デスクトップはベース値、モバイルは縮小 */
  private static scaledFontSize(base: number): number {
    if (typeof window === "undefined") return base;
    if (!isMobileViewport()) return base;
    return Math.max(10, Math.round(base * GameHUD.MOBILE_FONT_SCALE));
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

      let scale: number;
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
        const minO = GameHUD.scaledFontSize(GameHUD.TITLE_PULSE_MIN_WIDTH);
        const rangeO = GameHUD.scaledFontSize(GameHUD.TITLE_PULSE_RANGE);
        this.titleText.outlineWidth = minO + pulse * rangeO;
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
    text.fontSize = GameHUD.scaledFontSize(GameHUD.FONT_SIZE_FLOATING);
    text.color =
      textContent === "PING" ? GameHUD.COLOR_PING : GameHUD.COLOR_PONG;
    text.fontWeight = "bold";
    text.outlineWidth = GameHUD.scaledFontSize(GameHUD.OUTLINE_WIDTH_THIN);
    text.outlineColor = GameHUD.COLOR_WHITE;
    text.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    text.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

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

    const startLeft = GameHUD.getResultPanelStartLeftPx(scene);
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
    this.resultPanel.leftInPixels = GameHUD.getResultPanelStartLeftPx(
      this.plane.getScene(),
    );
  }

  setScore(p1: number, p2: number) {
    const s = `${p1} - ${p2}`;
    this.scoreText.text = s;
    if (this.scoreTextScreen) {
      this.scoreTextScreen.text = s;
    }
  }

  setCountdown(text: string) {
    this.countdownText.text = text;
  }

  clearCountdown() {
    this.countdownText.text = "";
  }

  hideScore() {
    this.scoreText.isVisible = false;
    if (this.scoreTextScreen) {
      this.scoreTextScreen.isVisible = false;
    }
  }
  showScore() {
    if (this.scoreTextScreen) {
      this.scoreTextScreen.isVisible = true;
      this.scoreText.isVisible = false;
    } else {
      this.scoreText.isVisible = true;
    }
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
