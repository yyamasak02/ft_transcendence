// src/game-main.ts

import {
  initDOMRefs,
  gameData,
  canvas,
  characters,
  stages,
  setGameMode,
  engine,
  scene,
} from "./core/data";
import {
  ArcRotateCamera,
  HemisphericLight,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
  GlowLayer,
  DirectionalLight,     
  ShadowGenerator,      
  // TrailMesh,
} from "@babylonjs/core";
// import { update, updateAI } from "./systems/game";
import { 
  // updateAbilities, 
  activateAbility 
} from "./systems/abilities";
// import {
//   updateEffects,
//   renderEffects,
//   applyScreenShake,
//   createFireworkEffect,
// } from "./systems/effects";
// import {
//   drawRect,
//   drawBall,
//   drawScore,
//   drawMenu,
//   drawGameOver,
//   drawPauseMenu,
//   drawCountdown,
//   drawCharacterSelect,
//   drawModeSelect,
//   drawStageSelect,
// } from "./ui/draw";
import {
  toggleUIElements,
  updateCharacterImages,
  applyCharacterStats,
  // updateUI,
  preloadCharacterIcons,
} from "./ui/ui";
import {
  setPlayer1CharIndex,
  setPlayer2CharIndex,
  setPlayer1Ready,
  setPlayer2Ready,
  handleCharacterSelection,
  setPlayer2AILevel,
  setSelectedStage,
  handleStageSelection,
  setGameState,
} from "./core/state";
import {
  // FIXED_TIME_STEP,
  // MAX_DELTA_TIME,
  BASE_BALL_SPEED,
  WINNING_SCORE,
  // COUNTDOWN_INTERVAL,
  // FIREWORK_INTERVAL,
  setBallSpeed,
  setWinningScore,
} from "./core/constants";
import { createDefaultImportMeta } from "vite/module-runner";

// let lastTime = 0;
// let countdownTimer = 0;
// let accumulator = 0;
// let gameTime = 0;
// let lastFireworkTime = 0;

// function updateGameLogic(deltaTime: number) {
//   gameTime += deltaTime;

//   if (gameData.gameState === "game") {
//     updateAbilities(gameTime);
//     // updateEffects(gameTime);
//     handlePlayerMovement(deltaTime);
//     updateAI(gameTime);
//     update(deltaTime);
//     gameData.player1.stamina = Math.min(
//       gameData.player1.maxStamina,
//       gameData.player1.stamina +
//         gameData.player1.staminaRecoveryRate * (deltaTime / 1000),
//     );
//     gameData.player2.stamina = Math.min(
//       gameData.player2.maxStamina,
//       gameData.player2.stamina +
//         gameData.player2.staminaRecoveryRate * (deltaTime / 1000),
//     );
//   }
//   if (gameData.gameState === "countingDown") {
//     updateAbilities(gameTime);
//     // updateEffects(gameTime);
//     handlePlayerMovement(deltaTime);
//     gameData.player1.stamina = Math.min(
//       gameData.player1.maxStamina,
//       gameData.player1.stamina +
//         gameData.player1.staminaRecoveryRate * (deltaTime / 1000),
//     );
//     gameData.player2.stamina = Math.min(
//       gameData.player2.maxStamina,
//       gameData.player2.stamina +
//         gameData.player2.staminaRecoveryRate * (deltaTime / 1000),
//     );
//     countdownTimer += deltaTime;
//     if (countdownTimer >= COUNTDOWN_INTERVAL) {
//       gameData.countdown--;
//       countdownTimer = 0;
//       if (gameData.countdown <= 0) {
//         const currentStage = stages[gameData.selectedStageIndex];
//         const adjustedBallSpeed =
//           BASE_BALL_SPEED * currentStage.effects.ballSpeedMultiplier;
//         const startDirection =
//           gameData.player1.score > gameData.player2.score ? -1 : 1;
//         gameData.ball.speedX = adjustedBallSpeed * startDirection;
//         gameData.ball.speedY = 0;
//         setGameState("game");
//       }
//     }
//   }
//   if (gameData.gameState === "gameover") {
//     // updateEffects(gameTime);

//     if (gameTime - lastFireworkTime >= FIREWORK_INTERVAL) {
//       lastFireworkTime = gameTime;

//       // const winner = gameData.player1.score > gameData.player2.score ? 1 : 2;
//       // const xPosition =
//       //   winner === 1
//       //     ? canvas.width / 4 + (Math.random() - 0.5) * 100
//       //     : (canvas.width * 3) / 4 + (Math.random() - 0.5) * 100;
//       // const yPosition = 100 + Math.random() * 200;

//       // createFireworkEffect(xPosition, yPosition);
//     }
//   }
// }

// function handlePlayerMovement(deltaTime: number) {
//   const frameMultiplier = deltaTime / FIXED_TIME_STEP;

//   if (gameData.gameState === "game" || gameData.gameState === "countingDown") {
//     const speedMultiplier1 = gameData.player1.stamina > 10 ? 1 : 0.5;
//     const speedMultiplier2 = gameData.player2.stamina > 10 ? 1 : 0.5;

//     if (gameData.keysPressed["w"] && gameData.player1.y > 0) {
//       const moveDistance =
//         gameData.player1.baseSpeed *
//         gameData.player1.speedMultiplier *
//         speedMultiplier1 *
//         frameMultiplier;
//       gameData.player1.y -= moveDistance;
//       gameData.player1.stamina = Math.max(
//         0,
//         gameData.player1.stamina - 1 * frameMultiplier,
//       );
//     }
//     if (
//       gameData.keysPressed["s"] &&
//       gameData.player1.y < canvas.height - gameData.player1.height
//     ) {
//       const moveDistance =
//         gameData.player1.baseSpeed *
//         gameData.player1.speedMultiplier *
//         speedMultiplier1 *
//         frameMultiplier;
//       gameData.player1.y += moveDistance;
//       gameData.player1.stamina = Math.max(
//         0,
//         gameData.player1.stamina - 1 * frameMultiplier,
//       );
//     }

//     if (gameData.player2AILevel === "Player") {
//       if (gameData.keysPressed["ArrowUp"] && gameData.player2.y > 0) {
//         const moveDistance =
//           gameData.player2.baseSpeed *
//           gameData.player2.speedMultiplier *
//           speedMultiplier2 *
//           frameMultiplier;
//         gameData.player2.y -= moveDistance;
//         gameData.player2.stamina = Math.max(
//           0,
//           gameData.player2.stamina - 1 * frameMultiplier,
//         );
//       }
//       if (
//         gameData.keysPressed["ArrowDown"] &&
//         gameData.player2.y < canvas.height - gameData.player2.height
//       ) {
//         const moveDistance =
//           gameData.player2.baseSpeed *
//           gameData.player2.speedMultiplier *
//           speedMultiplier2 *
//           frameMultiplier;
//         gameData.player2.y += moveDistance;
//         gameData.player2.stamina = Math.max(
//           0,
//           gameData.player2.stamina - 1 * frameMultiplier,
//         );
//       }
//     }
//   }
// }

document.addEventListener("keydown", (e) => {
  gameData.keysPressed[e.key] = true;

  if (gameData.gameState === "paused") {
    switch (e.key.toLowerCase()) {
      case "q":
        setBallSpeed(BASE_BALL_SPEED + 1);
        return;
      case "a":
        setBallSpeed(BASE_BALL_SPEED - 1);
        return;
      case "w":
        setWinningScore(WINNING_SCORE + 1);
        return;
      case "s":
        setWinningScore(WINNING_SCORE - 1);
        return;
    }
  }

  if (e.key.toLowerCase() === "p") {
    if (gameData.gameState === "game") {
      setGameState("paused");
    } else if (gameData.gameState === "characterSelect") {
      setGameState("paused");
    } else if (gameData.gameState === "paused") {
      if (gameData.previousGameState === "characterSelect") {
        setGameState("characterSelect");
      } else {
        setGameState("game");
      }
    }
    toggleUIElements();
    return;
  }

  if (gameData.gameState === "modeSelect") {
    switch (e.key) {
      case "w":
      case "ArrowUp":
        setGameMode("local");
        break;
      case "s":
      case "ArrowDown":
        setGameMode("online");
        break;
    }

    if (e.key === "Enter") {
      if (gameData.gameMode === "local") {
        setGameState("characterSelect");
        toggleUIElements();
        updateCharacterImages();
      } else {
        console.log("Online mode coming soon!");
        setGameMode("local");
        setGameState("menu");
        toggleUIElements();
        updateCharacterImages();
      }
    }
    return;
  } else if (gameData.gameState === "characterSelect") {
    switch (e.key) {
      case "w":
        if (!gameData.player1Ready) {
          setPlayer1CharIndex(
            gameData.player1CharIndex > 0
              ? gameData.player1CharIndex - 1
              : characters.length - 1,
          );
        }
        break;
      case "s":
        if (!gameData.player1Ready) {
          setPlayer1CharIndex(
            gameData.player1CharIndex < characters.length - 1
              ? gameData.player1CharIndex + 1
              : 0,
          );
        }
        break;
      case "ArrowUp":
        if (!gameData.player2Ready) {
          setPlayer2CharIndex(
            gameData.player2CharIndex > 0
              ? gameData.player2CharIndex - 1
              : characters.length - 1,
          );
        }
        break;
      case "ArrowDown":
        if (!gameData.player2Ready) {
          setPlayer2CharIndex(
            gameData.player2CharIndex < characters.length - 1
              ? gameData.player2CharIndex + 1
              : 0,
          );
        }
        break;
      case "d":
        if (!gameData.player1Ready) {
          setPlayer1Ready(true);
        } else setPlayer1Ready(false);
        break;
      case "Enter":
        if (!gameData.player2Ready) {
          setPlayer2Ready(true);
        } else setPlayer2Ready(false);
        break;
      case "ArrowLeft":
        if (!gameData.player2Ready) {
          if (gameData.player2AILevel === "Player") {
            setPlayer2AILevel("AI: hard");
          } else if (gameData.player2AILevel === "AI: hard") {
            setPlayer2AILevel("AI: normal");
          } else if (gameData.player2AILevel === "AI: normal") {
            setPlayer2AILevel("AI: easy");
          } else {
            setPlayer2AILevel("Player");
          }
        }
        break;
      case "ArrowRight":
        if (!gameData.player2Ready) {
          if (gameData.player2AILevel === "Player") {
            setPlayer2AILevel("AI: easy");
          } else if (gameData.player2AILevel === "AI: easy") {
            setPlayer2AILevel("AI: normal");
          } else if (gameData.player2AILevel === "AI: normal") {
            setPlayer2AILevel("AI: hard");
          } else {
            setPlayer2AILevel("Player");
          }
        }
        break;
    }
    handleCharacterSelection();
    return;
  } else if (gameData.gameState === "stageSelect") {
    switch (e.key) {
      case "a":
      case "ArrowLeft":
        if (gameData.selectedStageIndex > 0) {
          setSelectedStage(gameData.selectedStageIndex - 1);
        }
        break;
      case "d":
      case "ArrowRight":
        if (gameData.selectedStageIndex < stages.length - 1) {
          setSelectedStage(gameData.selectedStageIndex + 1);
        }
        break;
    }

    if (e.key === "Enter") {
      handleStageSelection();
    }
    return;
  } else if (gameData.gameState === "game") {
    if (e.key.toLowerCase() === "f") {
      const char = characters[gameData.player1CharIndex];
      let abilityType = "";

      switch (char.name) {
        case "Gust":
          abilityType = "gust";
          break;
        case "M":
          abilityType = "mega";
          break;
        case "Suicider":
          abilityType = "suicider";
          break;
        case "Sniper":
          abilityType = "shot";
          break;
      }

      if (abilityType) {
        activateAbility(1, gameData.player1CharIndex, abilityType);
      }
    }

    if (e.key.toLowerCase() === "j") {
      const char = characters[gameData.player2CharIndex];
      let abilityType = "";

      switch (char.name) {
        case "Gust":
          abilityType = "gust";
          break;
        case "M":
          abilityType = "mega";
          break;
        case "Suicider":
          abilityType = "suicider";
          break;
        case "Sniper":
          abilityType = "shot";
          break;
      }

      if (abilityType) {
        activateAbility(2, gameData.player2CharIndex, abilityType);
      }
    }
  }
  if (e.key === "Enter") {
    if (gameData.gameState === "menu") {
      setGameState("modeSelect");
    } else if (gameData.gameState === "gameover") {
      setGameState("menu");
      gameData.player1.score = 0;
      gameData.player2.score = 0;
      applyCharacterStats();
      toggleUIElements();
    } else if (gameData.gameState === "paused") {
      setGameState("menu");
      gameData.player1.score = 0;
      gameData.player2.score = 0;
      applyCharacterStats();
      toggleUIElements();
    }
  }
});

document.addEventListener("keyup", (e) => {
  gameData.keysPressed[e.key] = false;
});

// function gameLoop(currentTime: number) {
//   const deltaTime =
//     lastTime === 0 ? 0 : Math.min(currentTime - lastTime, MAX_DELTA_TIME);
//   lastTime = currentTime;
//   accumulator += deltaTime;

//   while (accumulator >= FIXED_TIME_STEP) {
//     updateGameLogic(FIXED_TIME_STEP);
//     accumulator -= FIXED_TIME_STEP;
//   }
//   render();

//   requestAnimationFrame(gameLoop);
// }

// function render() {
//   const shake = applyScreenShake();
//   ctx.save();
//   ctx.translate(shake.x, shake.y);

//   if (gameData.gameState === "game" || gameData.gameState === "countingDown") {
//     const currentStage = stages[gameData.selectedStageIndex];
//     ctx.fillStyle = currentStage.backgroundColor;
//     ctx.fillRect(-shake.x, -shake.y, canvas.width, canvas.height);
//   } else {
//     ctx.clearRect(-shake.x, -shake.y, canvas.width, canvas.height);
//   }

//   toggleUIElements();

//   if (gameData.gameState === "game" || gameData.gameState === "countingDown") {
//     updateUI();

//     let p1EffectColor = characters[gameData.player1CharIndex].effectColor;
//     let p2EffectColor = characters[gameData.player2CharIndex].effectColor;
//     let p1IsGlowing = gameData.player1.isAbilityActive;
//     let p2IsGlowing = gameData.player2.isAbilityActive;

//     const currentStage = stages[gameData.selectedStageIndex];

//     if (gameData.player1.isSuiciderActive) {
//       gameData.player1.x = canvas.width / 2 - gameData.player1.width - 50;
//     } else {
//       gameData.player1.x = 0;
//     }

//     if (!gameData.player2.isAI) {
//       if (gameData.player2.isSuiciderActive) {
//         gameData.player2.x = canvas.width / 2 + 50;
//       } else {
//         gameData.player2.x = canvas.width - gameData.player2.width;
//       }
//     }

//     drawRect(
//       gameData.player1.x,
//       gameData.player1.y,
//       gameData.player1.width,
//       gameData.player1.height,
//       currentStage.paddleColor,
//       p1IsGlowing,
//       p1EffectColor,
//       gameData.player1.stamina <= 10,
//     );
//     drawRect(
//       gameData.player2.x,
//       gameData.player2.y,
//       gameData.player2.width,
//       gameData.player2.height,
//       currentStage.paddleColor,
//       p2IsGlowing,
//       p2EffectColor,
//       gameData.player2.stamina <= 10,
//     );

//     drawScore();
//     drawBall(
//       gameData.ball.x,
//       gameData.ball.y,
//       gameData.ball.size,
//       currentStage.ballColor,
//       gameData.ball.power,
//     );

//     renderEffects();

//     if (gameData.gameState === "countingDown") {
//       drawCountdown();
//     }
//   } else if (gameData.gameState === "menu") {
//     drawMenu();
//   } else if (gameData.gameState === "modeSelect") {
//     drawModeSelect();
//   } else if (gameData.gameState === "characterSelect") {
//     drawCharacterSelect();
//   } else if (gameData.gameState === "stageSelect") {
//     drawStageSelect();
//   } else if (gameData.gameState === "gameover") {
//     drawGameOver();
//     renderEffects();
//   } else if (gameData.gameState === "paused") {
//     drawPauseMenu();
//   }

//   ctx.restore();
// }

// export function startPingPongGame() {
//   // DOM と Babylon の初期化
//   initDOMRefs();
//   preloadCharacterIcons();
//   updateCharacterImages();
//   // 初期状態でUIを非表示に
//   toggleUIElements();
//   // requestAnimationFrame(gameLoop);
//   engine.runRenderLoop(() => { 
//     scene.render();
//   });
//   console.log("Babylon render loop started");
// }

export function startPingPongGame() {
  // DOM 初期化（Canvas 取得）
  initDOMRefs();

  // UI 用の画像読み込みなど（そのまま維持）
  preloadCharacterIcons();
  updateCharacterImages();
  toggleUIElements();

  //-----------------------------------------------------
  // Babylon 3D シーン構築
  //-----------------------------------------------------

  // ===== カメラ =====
  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    1.2,
    80,
    new Vector3(0, 10, 0),
    scene
  );
  camera.attachControl(canvas, true);

  // ===== ライト =====
  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // ===== GlowLayer（発光エフェクト） =====
  const glow = new GlowLayer("glow", scene);
  glow.intensity = 0.25;

  // ===== コート（床） =====
  const court = MeshBuilder.CreateGround(
    "court",
    { width: 40, height: 60 },
    scene
  );
  const courtMat = new StandardMaterial("courtMat", scene);

  // 暗めの青っぽい色
  courtMat.diffuseColor = new Color3(0.02, 0.05, 0.18); // 好きな値に調整してOK
  // ちょっとだけ自発光させたいなら
  courtMat.emissiveColor = new Color3(0.0, 0.25, 0.7);

  court.material = courtMat;

  // ===== 壁（左右の Box） =====
  // const leftWall = MeshBuilder.CreateBox(
  //   "leftWall",
  //   { width: 0.1, height: 100, depth: 60 },
  //   scene
  // );
  // leftWall.position.x = -20;
  // leftWall.position.y = 3;

  // const wallMat = new StandardMaterial("wallMat", scene);

  // // 壁の色（薄いグレー）
  // wallMat.diffuseColor = new Color3(0.8, 0.8, 0.8);

  // // 透明度 0.0 = 完全透明, 1.0 = 不透明
  // wallMat.alpha = 0.15;   // 15% 不透明（85% 透明）

  // // 見た目を綺麗にしたい場合（任意）
  
  // wallMat.disableDepthWrite = true;
  // // 壁に適用
  // leftWall.material = wallMat;
  
  // const rightWall = leftWall.clone("rightWall");
  // rightWall.position.x = 20;
  // rightWall.material = wallMat;

  // ===== 3D darkZone（半透明 Plane） =====
  // const darkZone = MeshBuilder.CreatePlane(
  //   "darkZone",
  //   { width: 12, height: 60 },
  //   scene
  // );
  // darkZone.position.y = 0.1;
  // darkZone.rotation.x = Math.PI / 2;

  // const darkMat = new StandardMaterial("darkMat", scene);
  // darkMat.diffuseColor = new Color3(0, 0, 0);
  // darkMat.alpha = 0.6;
  // darkZone.material = darkMat;

  // ===== パドル C（発光する Box） =====
  const paddleLength = 6;      // 左右方向の長さ（X 軸）
  const paddleThickness = 1; // 太さ（直径）

  const paddle1 = MeshBuilder.CreateCylinder(
    "paddle1",
    {
      height: paddleLength,
      diameter: paddleThickness,
    },
    scene
  );

  // 地面から少し浮かせる（高さの半分）
  paddle1.position = new Vector3(0, paddleThickness / 2 + 1, 28);

  // 必要なら向き調整（横倒しにしたい場合）
  // paddle1.rotation.x = Math.PI / 2;

  const p1Mat = new StandardMaterial("p1Mat", scene);
  p1Mat.diffuseColor   = new Color3(0.1, 0.6, 1.0);
  p1Mat.emissiveColor  = new Color3(0.2, 0.8, 1.5);
  paddle1.material = p1Mat;

  // const paddle1 = MeshBuilder.CreateBox(
  //   "paddle1",
  //   { width: 1, height: 6, depth: 1 },
  //   scene
  // );
  // paddle1.position = new Vector3(0, 0, 28);

  // const p1Mat = new StandardMaterial("p1Mat", scene);
  // p1Mat.diffuseColor = new Color3(0.1, 0.6, 1.0);
  // p1Mat.emissiveColor = new Color3(0.2, 0.8, 1.5); // 発光
  // paddle1.material = p1Mat;

  paddle1.rotation.z = Math.PI / 2;

  const paddle2 = paddle1.clone("paddle2");
  paddle2.position = new Vector3(0, paddleThickness / 2 + 1, -28);

  const p2Mat = p1Mat.clone("p2Mat");
  p2Mat.diffuseColor = new Color3(1.0, 0.3, 0.3);
  p2Mat.emissiveColor = new Color3(1.5, 0.4, 0.4);
  paddle2.material = p2Mat;

  // paddle2.rotation.z = Math.PI / 2;

  // ===== ボール C（Sphere + TrailMesh） =====
  const ball = MeshBuilder.CreateSphere(
    "ball",
    { diameter: 2 },
    scene
  );
  ball.position = new Vector3(0, 2, 0);

  // const _trail = new TrailMesh("ballTrail", ball, scene, 40, 0.3);

  //-----------------------------------------------------
  // Babylon の描画ループ開始
  //-----------------------------------------------------
  engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();
    updatePaddles(deltaTime, paddle1, paddle2);
    scene.render();
  });

  // engine.runRenderLoop(() => {
  //   scene.render();
  // });


  // ===== 影用のライト =====
  const dirLight = new DirectionalLight(
    "dirLight",
    new Vector3(-0.5, -1, -0.3), // 斜め前から当てるイメージ
    scene
  );
  dirLight.position = new Vector3(0, 20, 20); // 上の方から

  // ===== ShadowGenerator =====
  const shadowGen = new ShadowGenerator(1024, dirLight);

  // 影のクオリティ調整（ふんわり影）
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 32;

  // 影を「落とす」メッシュ
  shadowGen.addShadowCaster(paddle1);
  shadowGen.addShadowCaster(paddle2);
  shadowGen.addShadowCaster(ball);

  // 影を「受ける」メッシュ
  court.receiveShadows = true;
  // leftWall.receiveShadows = true;
  // rightWall.receiveShadows = true;
  // darkZone は影いらなければ:
  // darkZone.receiveShadows = false;

  console.log("Babylon 3D PONG initialized");
}



function updatePaddles(deltaTime: number, paddle1: any, paddle2: any) {
  const speed = 0.05 * deltaTime;

  // Player 1
  if (gameData.keysPressed["d"]) {
    paddle1.position.x -= speed;
  }
  if (gameData.keysPressed["a"]) {
    paddle1.position.x += speed;
  }

  // Player 2（テスト用：上下キー）
  if (gameData.keysPressed["ArrowRight"]) {
    paddle2.position.x -= speed;
  }
  if (gameData.keysPressed["ArrowLeft"]) {
    paddle2.position.x += speed;
  }

  const min = -20;
  const max = 20;

  paddle1.position.x = Math.max(min, Math.min(max, paddle1.position.x));
  paddle2.position.x = Math.max(min, Math.min(max, paddle2.position.x));
}

