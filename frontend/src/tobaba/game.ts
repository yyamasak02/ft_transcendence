// src/game.ts

import {
    gameData, canvas, characters, AI_LEVELS, stages
} from './data';
import { setGameState, WINNING_SCORE, BASE_BALL_SPEED } from './index';
import { resetBall } from './ui';
import { createGoalEffect, createFastReturnEffect, createScreenShake, createShotEffect, createReturnEffect } from './effects';

const CORE_HIT_RANGE = 0.2;
let lastAITick = 0;
const AI_TICK_RATE = 1000;
let aiTargetY = gameData.player2.y; 

const BASE_FRAME_TIME = 1000 / 60;

function checkCollision(ball: any, player: any) {
    let ballX = ball.x + ball.size / 2;
    let ballY = ball.y + ball.size / 2;
    let playerX = player.x;
    let playerY = player.y;
    let playerW = player.width;
    let playerH = player.height;

    let hit = ballX + ball.size / 2 > playerX &&
              ballX - ball.size / 2 < playerX + playerW &&
              ballY + ball.size / 2 > playerY &&
              ballY - ball.size / 2 < playerY + playerH;

    if (hit) {
        let collidePoint = ball.y + ball.size / 2 - (player.y + playerH / 2);
        collidePoint = collidePoint / (playerH / 2);
        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        
        let charIndex = player.isPlayer1 ? gameData.player1CharIndex : gameData.player2CharIndex;
        let char = characters[charIndex];
        
        const currentStage = stages[gameData.selectedStageIndex];
        
        if (Math.abs(collidePoint) <= CORE_HIT_RANGE) {
            gameData.ball.power = char.power;
        } else {
            gameData.ball.power = 1;
        }
        
        let opponent = player.isPlayer1 ? gameData.player2 : gameData.player1;
        opponent.stamina = Math.max(0, opponent.stamina - (gameData.ball.power * 5));

        let newSpeedX = BASE_BALL_SPEED * Math.cos(angleRad) * gameData.ball.power * currentStage.effects.bounceMultiplier;
        let newSpeedY = BASE_BALL_SPEED * Math.sin(angleRad) * gameData.ball.power * currentStage.effects.bounceMultiplier;

        ball.speedX = direction * newSpeedX;
        ball.speedY = newSpeedY;
        
        const totalSpeed = Math.sqrt(newSpeedX * newSpeedX + newSpeedY * newSpeedY);
        if (totalSpeed > BASE_BALL_SPEED) {
            createFastReturnEffect(ballX, ballY, gameData.ball.power);
            createScreenShake(5, 200); 
            console.log(`Fast return effect! Speed: ${totalSpeed}, Power: ${gameData.ball.power}`);
        }
        else
            createReturnEffect(ballX, ballY)
    }
}

function handleWallCollision() {
    const currentStage = stages[gameData.selectedStageIndex];
    
    if (gameData.ball.y + gameData.ball.size / 2 > canvas.height || gameData.ball.y - gameData.ball.size / 2 < 0) {
        if (currentStage.effects.warpWalls) {
            if (gameData.ball.y - gameData.ball.size / 2 < 0) {
                gameData.ball.y = canvas.height - gameData.ball.size / 2;
            } else {
                gameData.ball.y = gameData.ball.size / 2;
            }
        } else {
            gameData.ball.speedY = -gameData.ball.speedY;
        }
    }
}

function handleAIAbility() {
    if (gameData.player2AILevel === 'Player') {
        return;
    }

    const aiChar = characters[gameData.player2CharIndex];
    const aiPlayer = gameData.player2;
    const distanceX = canvas.width - gameData.ball.x;

    switch (aiChar.name) {
        case 'Gust':
            if (aiPlayer.abilityUsages < aiChar.maxUsages && Math.abs(gameData.ball.x - aiPlayer.x) < 30 && Math.abs(gameData.ball.y - aiPlayer.y) > 5 && gameData.ball.speedX > 0) {
                aiChar.ability(aiPlayer, gameData.player2CharIndex);
                console.log("AI Gust used ability!");
            }
            break;
        case 'M':
            if (distanceX < 200 && aiPlayer.abilityUsages < aiChar.maxUsages) {
                aiChar.ability(aiPlayer, gameData.player2CharIndex);
                console.log("AI M used ability!");
            }
            break;
        case 'Sniper':
            if (!gameData.player2.isSniperActive && gameData.ball.speedX < 0 && aiPlayer.abilityUsages < aiChar.maxUsages && gameData.ball.x < 160 && gameData.ball.x > 150 && Math.abs(gameData.ball.speedY) > 0.7) {
                createShotEffect(gameData.ball.x, gameData.ball.y);
                createScreenShake(8, 300);
                
                gameData.ball.speedY = -gameData.ball.speedY;
                aiPlayer.abilityUsages++;
                console.log("AI Sniper used ability!");
                gameData.player2.isSniperActive = true;
            } else {
                if (gameData.ball.speedX > 0) {
                    gameData.player2.isSniperActive = false;
                }
            }
            break;
        case 'Suicider':
            if (!gameData.player2.isSuiciderActive) {
                if (gameData.ball.x > canvas.width / 2 - 50 && gameData.ball.x < canvas.width / 2 && Math.abs(gameData.ball.y - aiPlayer.y) < 50) {
                     gameData.player2.x = canvas.width / 2 - gameData.player2.width - 50;
                     gameData.player2.isSuiciderActive = true;
                     console.log("AI Suicider used ability!");
                }
            } else {
                if (gameData.ball.speedX < 0) {
                    gameData.player2.x = canvas.width - gameData.player2.width;
                    gameData.player2.isSuiciderActive = false;
                    console.log("AI Suicider reverted!");
                }
            }
            break;
    }
}

export function update(deltaTime: number = BASE_FRAME_TIME) {
    const frameMultiplier = deltaTime / BASE_FRAME_TIME;
    
    gameData.ball.x += gameData.ball.speedX * frameMultiplier;
    gameData.ball.y += gameData.ball.speedY * frameMultiplier;

    handleWallCollision();
    
    if (gameData.ball.speedX < 0)
        checkCollision(gameData.ball, gameData.player1)
    else if (gameData.ball.speedX > 0)
        checkCollision(gameData.ball, gameData.player2)
    if (gameData.player2AILevel !== 'Player') {
        const aiLevel = AI_LEVELS[gameData.player2AILevel as keyof typeof AI_LEVELS];
        const moveDirection = aiTargetY - gameData.player2.y;
        const distance = Math.abs(moveDirection);
        const maxSpeed = gameData.player2.baseSpeed * aiLevel.trackingSpeed * frameMultiplier;

        const moveStep = Math.min(distance, maxSpeed);

        if (moveDirection > 0) {
            gameData.player2.y += moveStep;
        } else if (moveDirection < 0) {
            gameData.player2.y -= moveStep;
        }

        if (moveStep > 0) {
            gameData.player2.stamina = Math.max(0, gameData.player2.stamina - (1 * frameMultiplier));
        }
    }
    
    handleAIAbility();
    if (gameData.ball.x - gameData.ball.size / 2 < 0) {
        gameData.player2.score++;
        createGoalEffect(50, canvas.height / 2);
        resetBall();
    } else if (gameData.ball.x + gameData.ball.size / 2 > canvas.width) {
        gameData.player1.score++;
        createGoalEffect(canvas.width - 50, canvas.height / 2);
        resetBall();
    }
    if (gameData.player1.score >= WINNING_SCORE || gameData.player2.score >= WINNING_SCORE) {
        setGameState('gameover');
    }
}

export function updateAI(gameTime: number) {
    if (gameData.player2AILevel === 'Player') {
        return;
    }
    if (gameTime - lastAITick < AI_TICK_RATE) {
        return;
    }

    lastAITick = gameTime;

    const aiLevel = AI_LEVELS[gameData.player2AILevel as keyof typeof AI_LEVELS];
    const currentStage = stages[gameData.selectedStageIndex];
    
    let predictedY = gameData.ball.y;
    const distanceX = canvas.width - gameData.ball.x;
    const speedX = Math.abs(gameData.ball.speedX);
    
    if (speedX > 0) {
        const timeToReachPaddle = distanceX / speedX;
        let travelY = gameData.ball.speedY * timeToReachPaddle;
        predictedY += travelY;
        if (currentStage.effects.warpWalls) {
            while (predictedY < 0 || predictedY > canvas.height) {
                if (predictedY < 0) {
                    predictedY = canvas.height + predictedY;
                } else if (predictedY > canvas.height) {
                    predictedY = predictedY - canvas.height;
                }
            }
        } else {
            if (predictedY < 0 || predictedY > canvas.height) {
                let numBounces = Math.floor(Math.abs(predictedY) / canvas.height);
                if (numBounces % 2 !== 0) {
                    predictedY = canvas.height - Math.abs(predictedY % canvas.height);
                } else {
                    predictedY = Math.abs(predictedY % canvas.height);
                }
            }
        }

        const inaccuracy = (Math.random() - 0.5) * gameData.player2.height * aiLevel.accuracy;
        predictedY += inaccuracy;
    }

    aiTargetY = predictedY - gameData.player2.height / 2;
    aiTargetY = Math.max(0, Math.min(canvas.height - gameData.player2.height, aiTargetY));
}