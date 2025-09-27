// src/index.ts

import {
  initDOMRefs,
  gameData,
  canvas,
  ctx,
  characters,
  COUNTDOWN_INTERVAL,
  setGameMode
} from './data';
import { update, updateAI } from './game';
import { updateAbilities, activateAbility } from './abilities';
import { drawRect, drawBall, drawScore, drawMenu, drawGameOver, drawPauseMenu, drawCountdown, drawCharacterSelect, drawModeSelect } from './draw';
import {
    toggleUIElements, updateCharacterImages, applyCharacterStats,
    updateUI, preloadCharacterIcons
} from './ui';
import {
    setPlayer1CharIndex, setPlayer2CharIndex,
    setPlayer1Ready, setPlayer2Ready,
    handleCharacterSelection, setPlayer2AILevel
} from './state';

const TARGET_FPS = 60;
const FIXED_TIME_STEP = 1000 / TARGET_FPS;
const MAX_DELTA_TIME = FIXED_TIME_STEP * 5;
export let BASE_BALL_SPEED = 10;
export let WINNING_SCORE = 10;

let lastTime = 0;
let countdownTimer = 0;
let accumulator = 0;
let gameTime = 0;

export function setGameState(newState: typeof gameData.gameState) {
	gameData.previousGameState = gameData.gameState;
    gameData.gameState = newState;
}

export function setCountdown(newCountdown: number) {
    gameData.countdown = newCountdown;
}

function updateGameLogic(deltaTime: number) {
    gameTime += deltaTime;
    
    if (gameData.gameState === 'game') {
        updateAbilities(gameTime);
        
        handlePlayerMovement(deltaTime);
        
        updateAI(gameTime);
        
        update(deltaTime);
        
        gameData.player1.stamina = Math.min(
            gameData.player1.maxStamina, 
            gameData.player1.stamina + gameData.player1.staminaRecoveryRate * (deltaTime / 1000)
        );
        gameData.player2.stamina = Math.min(
            gameData.player2.maxStamina, 
            gameData.player2.stamina + gameData.player2.staminaRecoveryRate * (deltaTime / 1000)
        );
    }
    
    if (gameData.gameState === 'countingDown') {
        updateAbilities(gameTime);
		handlePlayerMovement(deltaTime);
        
        gameData.player1.stamina = Math.min(
            gameData.player1.maxStamina, 
            gameData.player1.stamina + gameData.player1.staminaRecoveryRate * (deltaTime / 1000)
        );
        gameData.player2.stamina = Math.min(
            gameData.player2.maxStamina, 
            gameData.player2.stamina + gameData.player2.staminaRecoveryRate * (deltaTime / 1000)
        );
        
        countdownTimer += deltaTime;
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

function handlePlayerMovement(deltaTime: number) {
    const frameMultiplier = deltaTime / FIXED_TIME_STEP;
    
    if (gameData.gameState === 'game' || gameData.gameState === 'countingDown') {
        const speedMultiplier1 = (gameData.player1.stamina > 10) ? 1 : 0.5;
        const speedMultiplier2 = (gameData.player2.stamina > 10) ? 1 : 0.5;

        if (gameData.keysPressed['w'] && gameData.player1.y > 0) {
            const moveDistance = gameData.player1.baseSpeed * gameData.player1.speedMultiplier * speedMultiplier1 * frameMultiplier;
            gameData.player1.y -= moveDistance;
            gameData.player1.stamina = Math.max(0, gameData.player1.stamina - (1 * frameMultiplier));
        }
        if (gameData.keysPressed['s'] && gameData.player1.y < canvas.height - gameData.player1.height) {
            const moveDistance = gameData.player1.baseSpeed * gameData.player1.speedMultiplier * speedMultiplier1 * frameMultiplier;
            gameData.player1.y += moveDistance;
            gameData.player1.stamina = Math.max(0, gameData.player1.stamina - (1 * frameMultiplier));
        }

        if (gameData.player2AILevel === 'Player') {
            if (gameData.keysPressed['ArrowUp'] && gameData.player2.y > 0) {
                const moveDistance = gameData.player2.baseSpeed * gameData.player2.speedMultiplier * speedMultiplier2 * frameMultiplier;
                gameData.player2.y -= moveDistance;
                gameData.player2.stamina = Math.max(0, gameData.player2.stamina - (1 * frameMultiplier));
            }
            if (gameData.keysPressed['ArrowDown'] && gameData.player2.y < canvas.height - gameData.player2.height) {
                const moveDistance = gameData.player2.baseSpeed * gameData.player2.speedMultiplier * speedMultiplier2 * frameMultiplier;
                gameData.player2.y += moveDistance;
                gameData.player2.stamina = Math.max(0, gameData.player2.stamina - (1 * frameMultiplier));
            }
        }
    }
}

document.addEventListener('keydown', (e) => {
    gameData.keysPressed[e.key] = true;
    if (e.key.toLowerCase() === 'p') {
        if (gameData.gameState === 'game') {
            setGameState('paused');
        } else if (gameData.gameState === 'characterSelect') {
            setGameState('paused');
        } else if (gameData.gameState === 'paused') {
            // 直前の状態に戻る
            if (gameData.previousGameState === 'characterSelect') {
                setGameState('characterSelect');
            } else {
                setGameState('game');
            }
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
                console.log('Online mode coming soon!');
                setGameMode('local');
                setGameState('menu');
                toggleUIElements();
                updateCharacterImages();
            }
        }
        return;
    }
	else if (gameData.gameState === 'characterSelect') {
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
	else if (gameData.gameState === 'game') {
        if (e.key.toLowerCase() === 'f') {
            const char = characters[gameData.player1CharIndex];
            let abilityType = '';
            
            switch (char.name) {
                case 'Gust':
                    abilityType = 'gust';
                    break;
                case 'M':
                    abilityType = 'mega';
                    break;
                case 'Suicider':
                    abilityType = 'suicider';
                    break;
                case 'Sniper':
                    abilityType = 'shot';
                    break;
            }
            
            if (abilityType) {
                activateAbility(1, gameData.player1CharIndex, abilityType);
            }
        }

        if (e.key.toLowerCase() === 'j') {
            const char = characters[gameData.player2CharIndex];
            let abilityType = '';
            
            switch (char.name) {
                case 'Gust':
                    abilityType = 'gust';
                    break;
                case 'M':
                    abilityType = 'mega';
                    break;
                case 'Suicider':
                    abilityType = 'suicider';
                    break;
                case 'Sniper':
                    abilityType = 'shot';
                    break;
            }
            
            if (abilityType) {
                activateAbility(2, gameData.player2CharIndex, abilityType);
            }
        }
    }
    else if (gameData.gameState === 'paused') {
        if (e.key.toLowerCase() === 'a' && BASE_BALL_SPEED > 5) {
            BASE_BALL_SPEED -= 1;
        }
        if (e.key.toLowerCase() === 'q' && BASE_BALL_SPEED < 20) {
            BASE_BALL_SPEED += 1;
        }
        if (e.key.toLowerCase() === 's' && WINNING_SCORE > 1) {
            WINNING_SCORE -= 1;
        }
        if (e.key.toLowerCase() === 'w' && WINNING_SCORE < 20) {
            WINNING_SCORE += 1;
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
        } else if (gameData.gameState === 'paused') {
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

function gameLoop(currentTime: number) {
    const deltaTime = lastTime === 0 ? 0 : Math.min(currentTime - lastTime, MAX_DELTA_TIME);
    lastTime = currentTime;
    accumulator += deltaTime;

    while (accumulator >= FIXED_TIME_STEP) {
        updateGameLogic(FIXED_TIME_STEP);
        accumulator -= FIXED_TIME_STEP;
    }
    render();

    requestAnimationFrame(gameLoop);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    toggleUIElements();

    if (gameData.gameState === 'game' || gameData.gameState === 'countingDown') {
        updateUI();

        let p1EffectColor = characters[gameData.player1CharIndex].effectColor;
        let p2EffectColor = characters[gameData.player2CharIndex].effectColor;
        let p1IsGlowing = gameData.player1.isAbilityActive;
        let p2IsGlowing = gameData.player2.isAbilityActive;

        if (gameData.player1.isSuiciderActive) {
            gameData.player1.x = canvas.width / 2 - gameData.player1.width - 50;
        } else {
            gameData.player1.x = 0;
        }
        
        if (!gameData.player2.isAI) {
            if (gameData.player2.isSuiciderActive) {
                gameData.player2.x = canvas.width / 2 + 50;
            } else {
                gameData.player2.x = canvas.width - gameData.player2.width;
            }
        }
        drawRect(
            gameData.player1.x, 
            gameData.player1.y, 
            gameData.player1.width, 
            gameData.player1.height, 
            "#fff", 
            p1IsGlowing, 
            p1EffectColor, 
            gameData.player1.stamina <= 10
        );
        drawRect(
            gameData.player2.x, 
            gameData.player2.y, 
            gameData.player2.width, 
            gameData.player2.height, 
            "#fff", 
            p2IsGlowing, 
            p2EffectColor, 
            gameData.player2.stamina <= 10
        );

        drawScore();
        drawBall(gameData.ball.x, gameData.ball.y, gameData.ball.size, "#fff", gameData.ball.power);
        
        if (gameData.gameState === 'countingDown') {
            drawCountdown();
        }

    } else if (gameData.gameState === 'menu') {
        drawMenu();
    } else if (gameData.gameState === 'modeSelect') {
        drawModeSelect();
    } else if (gameData.gameState === 'characterSelect') {
        drawCharacterSelect();
    } else if (gameData.gameState === 'gameover') {
        drawGameOver();
    } else if (gameData.gameState === 'paused') {
        drawPauseMenu();
    }
}

export function startPingPongGame() {
    initDOMRefs();
    preloadCharacterIcons();
    updateCharacterImages();
    requestAnimationFrame(gameLoop);
}