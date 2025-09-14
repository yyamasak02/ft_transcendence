// src/index.ts

import {
  initDOMRefs,
  gameData,
  canvas,
  ctx,
  characters,
  COUNTDOWN_INTERVAL,
  BASE_BALL_SPEED,
  setGameMode
} from './data';
import { update, updateAI } from './game';
import { drawRect, drawBall, drawScore, drawMenu, drawGameOver, drawPauseMenu, drawCountdown, drawCharacterSelect, drawModeSelect } from './draw';
import {
    toggleUIElements, updateCharacterImages, applyCharacterStats,
    resetBall, updateUI, preloadCharacterIcons
} from './ui';
import {
    setPlayer1CharIndex, setPlayer2CharIndex,
    setPlayer1Ready, setPlayer2Ready,
    handleCharacterSelection, setPlayer2AILevel
} from './state';

let lastTime = 0;
let countdownTimer = 0;

export function setGameState(newState: typeof gameData.gameState) {
    gameData.gameState = newState;
}

export function setCountdown(newCountdown: number) {
    gameData.countdown = newCountdown;
}

function updateTimers(timestamp: number) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (gameData.gameState === 'game') {
        
        let isPlayer1Moving = gameData.keysPressed['w'] || gameData.keysPressed['s'];
        let isPlayer2Moving = gameData.keysPressed['ArrowUp'] || gameData.keysPressed['ArrowDown'];
		updateAI(timestamp);

        gameData.player1.stamina = Math.min(gameData.player1.maxStamina, gameData.player1.stamina + gameData.player1.staminaRecoveryRate * deltaTime);
        gameData.player2.stamina = Math.min(gameData.player2.maxStamina, gameData.player2.stamina + gameData.player2.staminaRecoveryRate * deltaTime);
    }
    if (gameData.gameState === 'countingDown') {
        gameData.player1.stamina = Math.min(gameData.player1.maxStamina, gameData.player1.stamina + gameData.player1.staminaRecoveryRate * deltaTime);
        gameData.player2.stamina = Math.min(gameData.player2.maxStamina, gameData.player2.stamina + gameData.player2.staminaRecoveryRate * deltaTime);
        countdownTimer += deltaTime * 1000;
        if (countdownTimer >= COUNTDOWN_INTERVAL) {
            gameData.countdown--;
            countdownTimer = 0;
            if (gameData.countdown <= 0) {
                const startDirection = (gameData.player1.score > gameData.player2.score) ? -1 : 1;
                gameData.ball.speedX = BASE_BALL_SPEED * startDirection;
                gameData.ball.speedY = 0;
                setGameState('game');
            }
        }
    }
}

document.addEventListener('keydown', (e) => {
    gameData.keysPressed[e.key] = true;
    if (e.key.toLowerCase() === 'p') {
        if (gameData.gameState === 'game') {
            setGameState('paused');
        } else if (gameData.gameState === 'paused') {
            setGameState('game');
        }
        toggleUIElements();
        return;
    }

    if (gameData.gameState === 'modeSelect') {
        switch (e.key) {
            case 'w':
            case 'ArrowUp':
                setGameMode('local');
                break;
            case 's':
            case 'ArrowDown':
                setGameMode('online');
                break;
        }
        
        if (e.key === 'Enter') {
            if (gameData.gameMode === 'local') {
                setGameState('characterSelect');
                toggleUIElements();
                updateCharacterImages();
            } else {
                // オンラインモードは未実装のため警告を表示
                console.log('Online mode coming soon!');
                setGameMode('local');
                setGameState('menu');
                toggleUIElements();
                updateCharacterImages();
            }
        }
        return;
    }

    if (gameData.gameState === 'characterSelect') {
        switch (e.key) {
            case 'w':
                if (!gameData.player1Ready) {
                    setPlayer1CharIndex((gameData.player1CharIndex > 0) ? gameData.player1CharIndex - 1 : characters.length - 1);
                }
                break;
            case 's':
                if (!gameData.player1Ready) {
                    setPlayer1CharIndex((gameData.player1CharIndex < characters.length - 1) ? gameData.player1CharIndex + 1 : 0);
                }
                break;
            case 'ArrowUp':
                if (!gameData.player2Ready) {
                    setPlayer2CharIndex((gameData.player2CharIndex > 0) ? gameData.player2CharIndex - 1 : characters.length - 1);
                }
                break;
            case 'ArrowDown':
                if (!gameData.player2Ready) {
                    setPlayer2CharIndex((gameData.player2CharIndex < characters.length - 1) ? gameData.player2CharIndex + 1 : 0);
                }
                break;
            case 'd':
                if (!gameData.player1Ready) {
                    setPlayer1Ready(true);
                }
                break;
            case 'Enter':
                if (!gameData.player2Ready) {
                    setPlayer2Ready(true);
                }
                break;
            case 'ArrowLeft':
                if (!gameData.player2Ready) {
                    if (gameData.player2AILevel === 'Player') {
                        setPlayer2AILevel('AI: hard');
                    } else if (gameData.player2AILevel === 'AI: hard') {
                        setPlayer2AILevel('AI: normal');
                    } else if (gameData.player2AILevel === 'AI: normal') {
                        setPlayer2AILevel('AI: easy');
                    } else {
                        setPlayer2AILevel('Player');
                    }
                }
                break;
            case 'ArrowRight':
                if (!gameData.player2Ready) {
                    if (gameData.player2AILevel === 'Player') {
                        setPlayer2AILevel('AI: easy');
                    } else if (gameData.player2AILevel === 'AI: easy') {
                        setPlayer2AILevel('AI: normal');
                    } else if (gameData.player2AILevel === 'AI: normal') {
                        setPlayer2AILevel('AI: hard');
                    } else {
                        setPlayer2AILevel('Player');
                    }
                }
                break;
        }
        handleCharacterSelection();
        return;
    }

    if (gameData.gameState === 'game') {
        if (e.key.toLowerCase() === 'f') {
            const char = characters[gameData.player1CharIndex];
            const canUse = char.maxUsages === -1 || gameData.player1.abilityUsages < char.maxUsages;
            
            if (canUse) {
                if (char.abilityName === "Shot") {
                    gameData.ball.speedY = -gameData.ball.speedY;
                    gameData.player1.abilityUsages++;
                } else {
                    char.ability(gameData.player1, gameData.player1CharIndex);
                }
            }
        }

        if (e.key.toLowerCase() === 'j') {
            const char = characters[gameData.player2CharIndex];
            const canUse = char.maxUsages === -1 || gameData.player2.abilityUsages < char.maxUsages;
            
            if (canUse) {
                if (char.abilityName === "Shot") {
                    gameData.ball.speedY = -gameData.ball.speedY;
                    gameData.player2.abilityUsages++;
                } else {
                    char.ability(gameData.player2, gameData.player2CharIndex);
                }
            }
        }
    }

    if (e.key === 'Enter') {
        if (gameData.gameState === 'menu') {
            setGameState('modeSelect');
        } else if (gameData.gameState === 'gameover') {
            setGameState('menu');
            gameData.player1.score = 0;
            gameData.player2.score = 0;
            applyCharacterStats();
            toggleUIElements();
        }
    }
});

document.addEventListener('keyup', (e) => {
    gameData.keysPressed[e.key] = false;
});

function gameLoop(timestamp: number) {
    updateTimers(timestamp);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    toggleUIElements();

    if (
        gameData.gameState === 'game' ||
        gameData.gameState === 'countingDown'
    ) {
        const speedMultiplier1 = (gameData.player1.stamina > 10) ? 1 : 0.5;
        const speedMultiplier2 = (gameData.player2.stamina > 10) ? 1 : 0.5;

        // --- プレイヤーの移動処理 ---
        if (gameData.keysPressed['w'] && gameData.player1.y > 0) {
            gameData.player1.y -= gameData.player1.baseSpeed * gameData.player1.speedMultiplier * speedMultiplier1;
            gameData.player1.stamina = Math.max(0, gameData.player1.stamina - 1);
        }
        if (gameData.keysPressed['s'] && gameData.player1.y < canvas.height - gameData.player1.height) {
            gameData.player1.y += gameData.player1.baseSpeed * gameData.player1.speedMultiplier * speedMultiplier1;
            gameData.player1.stamina = Math.max(0, gameData.player1.stamina - 1);
        }
        if (
            gameData.player2AILevel === 'Player' &&
            gameData.keysPressed['ArrowUp'] &&
            gameData.player2.y > 0
        ) {
            gameData.player2.y -= gameData.player2.baseSpeed * gameData.player2.speedMultiplier * speedMultiplier2;
            gameData.player2.stamina = Math.max(0, gameData.player2.stamina - 1);
        }
        if (
            gameData.player2AILevel === 'Player' &&
            gameData.keysPressed['ArrowDown'] &&
            gameData.player2.y < canvas.height - gameData.player2.height
        ) {
            gameData.player2.y += gameData.player2.baseSpeed * gameData.player2.speedMultiplier * speedMultiplier2;
            gameData.player2.stamina = Math.max(0, gameData.player2.stamina - 1);
        }

        updateUI();

        let p1EffectColor = characters[gameData.player1CharIndex].effectColor;
        let p2EffectColor = characters[gameData.player2CharIndex].effectColor;
        let p1IsGlowing = gameData.player1.isAbilityActive;
        let p2IsGlowing = gameData.player2.isAbilityActive;
        
        if (gameData.player1.isAbilityActive && characters[gameData.player1CharIndex].abilityName !== "Shot") {
            gameData.player1.isAbilityActive = false;
        }
        if (gameData.player2.isAbilityActive && characters[gameData.player2CharIndex].abilityName !== "Shot") {
            gameData.player2.isAbilityActive = false;
        }

        if (gameData.player1.isSuiciderActive) {
            gameData.player1.x = canvas.width / 2 - gameData.player1.width - 50;
        } else {
            gameData.player1.x = 0;
        }
		if (!gameData.player2.isAI)
		{
			if (gameData.player2.isSuiciderActive)
				gameData.player2.x = canvas.width / 2 + 50;
			else
				gameData.player2.x = canvas.width - gameData.player2.width;
		}

        drawRect(gameData.player1.x, gameData.player1.y, gameData.player1.width, gameData.player1.height, "#fff", p1IsGlowing, p1EffectColor, gameData.player1.stamina <= 0);
        drawRect(gameData.player2.x, gameData.player2.y, gameData.player2.width, gameData.player2.height, "#fff", p2IsGlowing, p2EffectColor, gameData.player2.stamina <= 0);

        if (gameData.gameState === 'game') {
            update();
            drawScore();
            drawBall(gameData.ball.x, gameData.ball.y, gameData.ball.size, "#fff", gameData.ball.power);
        } else if (gameData.gameState === 'countingDown') {
            drawBall(gameData.ball.x, gameData.ball.y, gameData.ball.size, "#fff", gameData.ball.power);
            drawScore();
            drawCountdown();
        }

    } else if (gameData.gameState === 'menu') {
        drawMenu();
    } else if (gameData.gameState === 'modeSelect') {
        drawModeSelect(); // モード選択画面を描画
    } else if (gameData.gameState === 'characterSelect') {
        drawCharacterSelect();
    } else if (gameData.gameState === 'gameover') {
        drawGameOver();
    } else if (gameData.gameState === 'paused') {
        drawPauseMenu();
    }

    requestAnimationFrame(gameLoop);
}

export function startPingPongGame() {
    initDOMRefs();
    preloadCharacterIcons();
    updateCharacterImages();
    requestAnimationFrame(gameLoop);
}