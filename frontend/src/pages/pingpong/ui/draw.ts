// src/ui/draw.ts

import { ctx, canvas, gameData, characters, stages } from "../core/data";

import { BASE_BALL_SPEED, WINNING_SCORE } from "../core/constants";

export function drawRect(
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  isGlowing: boolean,
  effectColor: string = "#0f0",
  isStealth: boolean = false,
) {
  if (isStealth) {
    ctx.globalAlpha = 0.3;
  }
  ctx.fillStyle = color;
  if (isGlowing) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = effectColor;
  }
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawBall(
  x: number,
  y: number,
  size: number,
  color: string,
  power: number,
) {
  const currentStage = stages[gameData.selectedStageIndex];
  if (currentStage.effects.darkZone) {
    const centerX = canvas.width / 2;
    const darkZoneWidth = canvas.width * 0.4;
    const distanceFromCenter = Math.abs(x - centerX);

    if (distanceFromCenter < darkZoneWidth / 2) {
      const fullStealthZoneRatio = 0.5;
      const fadingZoneStart = (darkZoneWidth / 2) * fullStealthZoneRatio;
      const fadingZoneWidth = darkZoneWidth / 2 - fadingZoneStart;

      let opacity = 0;

      if (distanceFromCenter <= fadingZoneStart) {
        opacity = 0.0;
      } else {
        const distanceInFadingZone = distanceFromCenter - fadingZoneStart;
        const baseOpacity = distanceInFadingZone / fadingZoneWidth;
        opacity = Math.min(baseOpacity, 0.8);
      }

      ctx.globalAlpha = opacity;
    }
  }

  ctx.fillStyle = power > 1 ? "#ff4500" : color;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();

  if (currentStage.effects.warpWalls) {
    drawWarpParticles(x, y, size);
  }

  ctx.globalAlpha = 1;
}

function drawWarpParticles(x: number, y: number, size: number) {
  const particleCount = 3;
  const time = Date.now() * 0.005;

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + time;
    const radius = size + Math.sin(time + i) * 5;
    const particleX = x + Math.cos(angle) * radius;
    const particleY = y + Math.sin(angle) * radius;

    ctx.globalAlpha = 0.5 + Math.sin(time + i) * 0.3;
    ctx.fillStyle = "#ff00ff";
    ctx.beginPath();
    ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "24px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText(gameData.player1.score.toString(), canvas.width / 4, 50);
  ctx.fillText(gameData.player2.score.toString(), (canvas.width * 3) / 4, 50);
}

export function drawMenu() {
  ctx.fillStyle = "#fff";
  ctx.font = "30px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText("ft_transcendence", canvas.width / 2, canvas.height / 2 - 50);
  ctx.fillText("- PONG -", canvas.width / 2, canvas.height / 2);

  ctx.font = "16px 'Press Start 2P'";
  ctx.fillText(
    "Press 'Enter' to Start",
    canvas.width / 2,
    canvas.height / 2 + 50,
  );
}

export function drawModeSelect() {
  ctx.fillStyle = "#fff";
  ctx.font = "32px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText("SELECT GAME MODE", canvas.width / 2, canvas.height / 2 - 120);

  const localY = canvas.height / 2 - 20;
  const onlineY = canvas.height / 2 + 40;

  if (gameData.gameMode === "local") {
    ctx.fillStyle = "#a8fbacff";
    ctx.fillRect(canvas.width / 2 - 180, localY - 40, 360, 50);
  } else {
    ctx.fillStyle = "#82c3f8ff";
    ctx.fillRect(canvas.width / 2 - 180, onlineY - 40, 360, 50);
  }

  ctx.fillStyle = "#ffffffff";
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillText("LOCAL BATTLE", canvas.width / 2, localY);
  ctx.fillText("ONLINE BATTLE", canvas.width / 2, onlineY);

  ctx.font = "14px 'Press Start 2P'";
  ctx.fillText(
    "Use W/S or UP/DOWN to select",
    canvas.width / 2,
    canvas.height / 2 + 120,
  );
  ctx.fillText(
    "Press Enter to confirm",
    canvas.width / 2,
    canvas.height / 2 + 150,
  );

  ctx.font = "12px 'Press Start 2P'";
  if (gameData.gameMode === "local") {
    ctx.fillText(
      "Play with a friend on the same device",
      canvas.width / 2,
      canvas.height / 2 + 200,
    );
  } else {
    ctx.fillText(
      "Play with someone online (Coming Soon)",
      canvas.width / 2,
      canvas.height / 2 + 200,
    );
  }
}

export function drawGameOver() {
  ctx.fillStyle = "#fff";
  ctx.font = "30px 'Press Start 2P'";
  ctx.textAlign = "center";
  let winner: "Player 1" | "Player 2";
  let winnerCharIndex: number;
  let loserCharIndex: number;
  let winnerIsPlayer1: boolean;

  if (gameData.player1.score > gameData.player2.score) {
    winner = "Player 1";
    winnerCharIndex = gameData.player1CharIndex;
    loserCharIndex = gameData.player2CharIndex;
    winnerIsPlayer1 = true;
  } else {
    winner = "Player 2";
    winnerCharIndex = gameData.player2CharIndex;
    loserCharIndex = gameData.player1CharIndex;
    winnerIsPlayer1 = false;
  }

  ctx.fillText(`${winner} Wins!`, canvas.width / 2, canvas.height / 2 - 100);

  const iconSize = 150;
  const leftIconX = canvas.width / 4 - iconSize / 2;
  const rightIconX = (canvas.width * 3) / 4 - iconSize / 2;
  const iconY = canvas.height / 2 - iconSize / 2;

  const winnerChar = characters[winnerCharIndex];
  const loserChar = characters[loserCharIndex];

  const winnerIcon = new Image();
  winnerIcon.src = winnerChar.winIconPath;
  const loserIcon = new Image();
  loserIcon.src = loserChar.loseIconPath;

  if (winnerIcon && winnerIcon.complete && loserIcon && loserIcon.complete) {
    if (winnerIsPlayer1) {
      ctx.drawImage(winnerIcon, leftIconX, iconY, iconSize, iconSize);
      ctx.globalAlpha = 0.5;
      ctx.drawImage(loserIcon, rightIconX, iconY, iconSize, iconSize);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(loserIcon, leftIconX, iconY, iconSize, iconSize);
      ctx.globalAlpha = 1.0;
      ctx.drawImage(winnerIcon, rightIconX, iconY, iconSize, iconSize);
    }
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillText("Loading icons...", canvas.width / 2, iconY + iconSize / 2);
  }

  ctx.font = "16px 'Press Start 2P'";
  ctx.fillText(
    "Press 'Enter' to Play Again",
    canvas.width / 2,
    canvas.height / 2 + 100,
  );
}

export function drawPauseMenu() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "30px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText("Paused", canvas.width / 2, canvas.height / 2 - 100);

  ctx.font = "16px 'Press Start 2P'";
  ctx.fillText(
    `Ball Speed: ${BASE_BALL_SPEED}`,
    canvas.width / 2,
    canvas.height / 2 - 40,
  );
  ctx.fillText(
    `Winning Score: ${WINNING_SCORE}`,
    canvas.width / 2,
    canvas.height / 2 - 10,
  );
  ctx.fillText(
    "Use Q/A to adjust Ball Speed",
    canvas.width / 2,
    canvas.height / 2 + 30,
  );
  ctx.fillText(
    "Use W/S to adjust Winning Score",
    canvas.width / 2,
    canvas.height / 2 + 60,
  );
  ctx.fillText("Press P to Resume", canvas.width / 2, canvas.height / 2 + 100);
  ctx.fillText(
    "Press Enter to return to menu",
    canvas.width / 2,
    canvas.height / 2 + 130,
  );
}

export function drawCountdown() {
  ctx.fillStyle = "#fff";
  ctx.font = "100px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText(
    gameData.countdown.toString(),
    canvas.width / 2,
    canvas.height / 2,
  );
}

export function drawDarkZone() {
  const centerX = canvas.width / 2;
  const darkZoneWidth = canvas.width * 0.4;

  const gradient = ctx.createLinearGradient(
    centerX - darkZoneWidth / 2,
    0,
    centerX + darkZoneWidth / 2,
    0,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.5, "rgba(0, 0, 0, 1)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(centerX - darkZoneWidth / 2, 0, darkZoneWidth, canvas.height);
}

export function drawWarpEffects() {
  const time = Date.now() * 0.003;

  for (let i = 0; i < 20; i++) {
    const y = (canvas.height / 20) * i;
    const intensity = Math.sin(time + i * 0.3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 0, 255, ${intensity * 0.3})`;
    ctx.fillRect(0, y, 5, canvas.height / 20);
  }

  for (let i = 0; i < 20; i++) {
    const y = (canvas.height / 20) * i;
    const intensity = Math.sin(time + i * 0.3 + Math.PI) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 0, 255, ${intensity * 0.3})`;
    ctx.fillRect(canvas.width - 5, y, 5, canvas.height / 20);
  }
}

export function drawStatsBar(
  x: number,
  y: number,
  rank: number,
  label: string,
  color: string,
  totalBlocks: number = 5,
) {
  const BAR_BLOCK_WIDTH = 30;
  const BAR_HEIGHT = 12;
  const GAP = 8;

  ctx.fillStyle = "#fff";
  ctx.font = "12px 'Press Start 2P'";
  ctx.textAlign = "left";
  ctx.fillText(label, x, y - 5);

  for (let i = 0; i < totalBlocks; i++) {
    ctx.fillStyle = i < rank ? color : "#333";
    ctx.fillRect(
      x + (BAR_BLOCK_WIDTH + GAP) * i,
      y,
      BAR_BLOCK_WIDTH,
      BAR_HEIGHT,
    );
  }
}

function wrapText(
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
      line = words[i] + " ";
      lineCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
}

export function drawPlayerPanel(
  x: number,
  y: number,
  char: any,
  isPlayer1: boolean,
) {
  const PANEL_WIDTH = 300;
  const PANEL_HEIGHT = 350;

  if (
    (isPlayer1 && gameData.player1Ready && !gameData.player2Ready) ||
    (!isPlayer1 && gameData.player2Ready && !gameData.player1Ready)
  ) {
    const glowAlpha = Math.abs(Math.sin(Date.now() / 250));
    ctx.shadowBlur = 30;
    ctx.shadowColor = `rgba(255, 255, 255, ${glowAlpha})`;
  } else {
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, PANEL_WIDTH, PANEL_HEIGHT);
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 2, y + 2, PANEL_WIDTH - 4, PANEL_HEIGHT - 4);

  ctx.fillStyle = "#fff";
  ctx.font = "20px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText(`Player ${isPlayer1 ? 1 : 2}`, x + PANEL_WIDTH / 2, y + 30);
  ctx.font = "24px 'Press Start 2P'";
  ctx.fillText(`${char.name}`, x + PANEL_WIDTH / 2, y + 70);

  ctx.font = "12px 'Press Start 2P'";
  ctx.textAlign = "center";
  wrapText(char.description, x + PANEL_WIDTH / 2, y + 95, PANEL_WIDTH - 10, 15);

  const statsX = x + 40;
  let statsY = y + 140;
  drawStatsBar(statsX, statsY, char.speedRank, "Speed", "#007BFF");
  statsY += 35;
  drawStatsBar(statsX, statsY, char.powerRank, "Power", "#FFC107");
  statsY += 35;
  drawStatsBar(statsX, statsY, char.staminaRank, "Stamina", "#28A745");
  statsY += 35;
  drawStatsBar(statsX, statsY, char.sizeRank, "Size", "#DC3545");

  statsY += 45;
  ctx.fillStyle = "#fff";
  ctx.font = "16px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText(`${char.abilityName}`, x + PANEL_WIDTH / 2, statsY);
  ctx.font = "12px 'Press Start 2P'";
  wrapText(
    char.abilityDescription,
    x + PANEL_WIDTH / 2,
    statsY + 20,
    PANEL_WIDTH - 5,
    14,
  );

  ctx.shadowBlur = 0;
}

export function drawCharacterSelect() {
  ctx.fillStyle = "#fff";
  ctx.font = "24px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText("Select Your Character", canvas.width / 2, 50);

  const PANEL_WIDTH = 300;

  const p1PanelX = canvas.width / 4 - PANEL_WIDTH / 2;
  const p1PanelY = canvas.height / 2 - 200;
  drawPlayerPanel(
    p1PanelX,
    p1PanelY,
    characters[gameData.player1CharIndex],
    true,
  );

  const p2PanelX = (canvas.width * 3) / 4 - PANEL_WIDTH / 2;
  const p2PanelY = canvas.height / 2 - 200;
  drawPlayerPanel(
    p2PanelX,
    p2PanelY,
    characters[gameData.player2CharIndex],
    false,
  );

  ctx.fillStyle = "#fff";
  ctx.font = "16px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText(
    "Player 1: W/S to select, D to confirm",
    canvas.width / 2,
    canvas.height - 70,
  );
  ctx.fillText(
    "Player 2: UP/DOWN to select, LEFT to confirm",
    canvas.width / 2,
    canvas.height - 40,
  );
  ctx.font = "18px 'Press Start 2P'";
  ctx.fillStyle = "rgba(138, 137, 137, 0.33)";
  ctx.fillRect(450, 450, 300, 35);
  ctx.fillStyle = "#fff";
  ctx.fillText(
    `2P ${gameData.player2AILevel.toUpperCase()}`,
    (canvas.width * 3) / 4,
    canvas.height - 120,
  );
}

export function drawStageSelect() {
  // 背景を現在選択されたステージの色で描画
  const currentStage = stages[gameData.selectedStageIndex];
  ctx.fillStyle = currentStage.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ワープゾーンエフェクトを描画
  if (currentStage.effects.warpWalls) {
    drawWarpEffects();
  }

  // ダークゾーンエフェクトを描画
  if (currentStage.effects.darkZone) {
    drawDarkZone();
  }

  // タイトル
  ctx.fillStyle = "#fff";
  ctx.font = "28px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText("SELECT STAGE", canvas.width / 2, 60);

  // ステージプレビューエリア
  const previewX = canvas.width / 2 - 200;
  const previewY = 120;
  const previewW = 400;
  const previewH = 200;

  // プレビュー背景
  ctx.fillStyle = currentStage.backgroundColor;
  ctx.fillRect(previewX, previewY, previewW, previewH);

  // プレビューの枠
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.strokeRect(previewX, previewY, previewW, previewH);

  // プレビュー内にミニゲーム画面を描画
  const miniPaddleH = 40;
  const miniPaddleW = 8;
  const miniBallSize = 8;

  // 左パドル
  ctx.fillStyle = currentStage.paddleColor;
  ctx.fillRect(
    previewX + 20,
    previewY + previewH / 2 - miniPaddleH / 2,
    miniPaddleW,
    miniPaddleH,
  );

  // 右パドル
  ctx.fillRect(
    previewX + previewW - 20 - miniPaddleW,
    previewY + previewH / 2 - miniPaddleH / 2,
    miniPaddleW,
    miniPaddleH,
  );

  // 中央線
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(previewX + previewW / 2, previewY);
  ctx.lineTo(previewX + previewW / 2, previewY + previewH);
  ctx.stroke();
  ctx.setLineDash([]);

  // ボール
  ctx.fillStyle = currentStage.ballColor;
  ctx.beginPath();
  ctx.arc(
    previewX + previewW / 2,
    previewY + previewH / 2,
    miniBallSize / 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // プレビューエリア内で特殊エフェクトを描画
  if (currentStage.effects.darkZone) {
    const miniCenterX = previewX + previewW / 2;
    const miniDarkZoneWidth = previewW * 0.4;

    const miniGradient = ctx.createLinearGradient(
      miniCenterX - miniDarkZoneWidth / 2,
      previewY,
      miniCenterX + miniDarkZoneWidth / 2,
      previewY,
    );
    miniGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    miniGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.6)");
    miniGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = miniGradient;
    ctx.fillRect(
      miniCenterX - miniDarkZoneWidth / 2,
      previewY,
      miniDarkZoneWidth,
      previewH,
    );
  }

  if (currentStage.effects.warpWalls) {
    const time = Date.now() * 0.005;

    // 左側のワープエフェクト
    for (let i = 0; i < 8; i++) {
      const y = previewY + (previewH / 8) * i;
      const intensity = Math.sin(time + i * 0.5) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 0, 255, ${intensity * 0.5})`;
      ctx.fillRect(previewX, y, 3, previewH / 8);
    }

    // 右側のワープエフェクト
    for (let i = 0; i < 8; i++) {
      const y = previewY + (previewH / 8) * i;
      const intensity = Math.sin(time + i * 0.5 + Math.PI) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 0, 255, ${intensity * 0.5})`;
      ctx.fillRect(previewX + previewW - 3, y, 3, previewH / 8);
    }
  }

  // ステージ名
  ctx.fillStyle = "#fff";
  ctx.font = "24px 'Press Start 2P'";
  ctx.fillText(currentStage.name, canvas.width / 2, previewY + previewH + 50);

  // ステージ説明
  ctx.font = "14px 'Press Start 2P'";
  wrapText(
    currentStage.description,
    canvas.width / 2,
    previewY + previewH + 80,
    600,
    20,
  );

  // ステージ効果の表示
  ctx.font = "12px 'Press Start 2P'";
  // ctx.fillText("Effects:", canvas.width / 2, previewY + previewH + 140);

  // let effectsText = `Ball Speed: x${currentStage.effects.ballSpeedMultiplier}  |  Bounce Power: x${currentStage.effects.bounceMultiplier}`;

  // if (currentStage.effects.darkZone) {
  //     effectsText += "  |  Dark Zone: ON";
  // }

  // if (currentStage.effects.warpWalls) {
  //     effectsText += "  |  Warp Walls: ON";
  // }

  // ctx.fillText(effectsText, canvas.width / 2, previewY + previewH + 165);

  // ナビゲーション表示
  const navY = canvas.height - 100;
  ctx.font = "16px 'Press Start 2P'";

  // 左矢印
  if (gameData.selectedStageIndex > 0) {
    ctx.fillStyle = "#fff";
    ctx.fillText("< A", canvas.width / 4, navY);
  } else {
    ctx.fillStyle = "#666";
    ctx.fillText("< A", canvas.width / 4, navY);
  }

  // 右矢印
  if (gameData.selectedStageIndex < stages.length - 1) {
    ctx.fillStyle = "#fff";
    ctx.fillText("D >", (canvas.width * 3) / 4, navY);
  } else {
    ctx.fillStyle = "#666";
    ctx.fillText("D >", (canvas.width * 3) / 4, navY);
  }

  // ステージカウンター
  ctx.fillStyle = "#fff";
  ctx.fillText(
    `${gameData.selectedStageIndex + 1} / ${stages.length}`,
    canvas.width / 2,
    navY,
  );

  // 確定ボタン
  ctx.font = "18px 'Press Start 2P'";
  ctx.fillText("Press Enter to Confirm", canvas.width / 2, navY + 40);
}