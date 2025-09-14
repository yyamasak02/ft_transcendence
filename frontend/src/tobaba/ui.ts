// src/ui.ts

import {
    gameData, characters,
    p1UIPanel, p2UIPanel, p1CharImageContainer, p2CharImageContainer,
    p1CharImg, p2CharImg, p1StaminaFill, p2StaminaFill, p1UsingGaugeContainer, p2UsingGaugeContainer,
    canvas
} from './data';

export function resetBall() {
    gameData.ball.x = canvas.width / 2;
    gameData.ball.y = canvas.height / 2;
    gameData.ball.speedX = 0;
    gameData.ball.speedY = 0;
    gameData.ball.power = 1;
    gameData.gameState = 'countingDown';
    gameData.countdown = 3;
}

export function applyCharacterStats() {
    const p1Char = characters[gameData.player1CharIndex];
    gameData.player1.height = p1Char.paddleHeight;
    gameData.player1.baseHeight = p1Char.paddleHeight;
    gameData.player1.baseSpeed = p1Char.paddleSpeed;
    gameData.player1.power = p1Char.power;
    gameData.player1.maxStamina = p1Char.maxStamina;
    gameData.player1.staminaRecoveryRate = p1Char.staminaRecoveryRate;
    gameData.player1.y = canvas.height / 2 - p1Char.paddleHeight / 2;
    gameData.player1.x = 0;
    gameData.player1.stamina = gameData.player1.maxStamina;
    gameData.player1.isSuiciderActive = false;
    gameData.player1.abilityUsages = 0; // 使用回数をリセット
    gameData.player1.maxAbilityUsages = p1Char.maxUsages; // 最大使用回数を設定

    const p2Char = characters[gameData.player2CharIndex];
    gameData.player2.height = p2Char.paddleHeight;
    gameData.player2.baseHeight = p2Char.paddleHeight;
    gameData.player2.baseSpeed = p2Char.paddleSpeed;
    gameData.player2.power = p2Char.power;
    gameData.player2.maxStamina = p2Char.maxStamina;
    gameData.player2.staminaRecoveryRate = p2Char.staminaRecoveryRate;
    gameData.player2.y = canvas.height / 2 - p2Char.paddleHeight / 2;
    gameData.player2.x = canvas.width - gameData.player2.width;
    gameData.player2.stamina = gameData.player2.maxStamina;
    gameData.player2.isSuiciderActive = false;
	gameData.player2.isSniperActive = false;
    gameData.player2.abilityUsages = 0; // 使用回数をリセット
    gameData.player2.maxAbilityUsages = p2Char.maxUsages; // 最大使用回数を設定
}

function renderUsageBars(container: HTMLElement, char: any, player: any) {
    container.innerHTML = '';
    const bars = document.createElement('div');
    bars.className = 'usage-bars';

    if (char.maxUsages === 0) {
        const bar = document.createElement('div');
        bar.className = 'usage-bar none';
        bar.textContent = 'NONE';
        bars.appendChild(bar);
    } else if (char.maxUsages === -1) {
        const bar = document.createElement('div');
        bar.className = 'usage-bar infinite';
        bar.textContent = '∞ INF';
        bars.appendChild(bar);
    } else {
        // 未消費バー（active）を先に追加（視覚的に上に表示される）
        for (let i = 0; i < char.maxUsages - player.abilityUsages; i++) {
            const bar = document.createElement('div');
            bar.className = 'usage-bar active';
            bars.appendChild(bar);
        }
        // 消費済みバー（inactive）を後に追加（視覚的に下に表示される）
        for (let i = 0; i < player.abilityUsages; i++) {
            const bar = document.createElement('div');
            bar.className = 'usage-bar inactive';
            bars.appendChild(bar);
        }
    }
    container.appendChild(bars);
}

function renderStaminaBars() {
    if (p1StaminaFill) {
        const p1StaminaPercentage = (gameData.player1.stamina / gameData.player1.maxStamina) * 100;
        p1StaminaFill.style.height = `${Math.max(0, p1StaminaPercentage)}%`;
    }
    if (p2StaminaFill) {
        const p2StaminaPercentage = (gameData.player2.stamina / gameData.player2.maxStamina) * 100;
        p2StaminaFill.style.height = `${Math.max(0, p2StaminaPercentage)}%`;
    }
}

export function updateUI() {
    if (p1UsingGaugeContainer) {
        renderUsageBars(p1UsingGaugeContainer, characters[gameData.player1CharIndex], gameData.player1);
    }
    if (p2UsingGaugeContainer) {
        renderUsageBars(p2UsingGaugeContainer, characters[gameData.player2CharIndex], gameData.player2);
    }
    renderStaminaBars();
}

export function toggleUIElements() {
    if (p1UIPanel) p1UIPanel.style.display = (gameData.gameState === 'game' || gameData.gameState === 'paused' || gameData.gameState === 'countingDown') ? 'flex' : 'none';
    if (p2UIPanel) p2UIPanel.style.display = (gameData.gameState === 'game' || gameData.gameState === 'paused' || gameData.gameState === 'countingDown') ? 'flex' : 'none';
    if (p1CharImageContainer) p1CharImageContainer.style.display = (gameData.gameState === 'characterSelect' || gameData.gameState === 'game' || gameData.gameState === 'paused' || gameData.gameState === 'countingDown') ? 'block' : 'none';
    if (p2CharImageContainer) p2CharImageContainer.style.display = (gameData.gameState === 'characterSelect' || gameData.gameState === 'game' || gameData.gameState === 'paused' || gameData.gameState === 'countingDown') ? 'block' : 'none';
}

export function updateCharacterImages() {
    if (p1CharImg) {
        p1CharImg.src = characters[gameData.player1CharIndex].imagePath;
    }
    if (p2CharImg) {
        p2CharImg.src = characters[gameData.player2CharIndex].imagePath;
    }
}

export const characterIcons = new Map<string, HTMLImageElement>();
export function preloadCharacterIcons() {
    characters.forEach(char => {
        const winImg = new Image();
        winImg.src = char.winIconPath;
        characterIcons.set(char.winIconPath, winImg);

        const loseImg = new Image();
        loseImg.src = char.loseIconPath;
        characterIcons.set(char.loseIconPath, loseImg);
    });
}