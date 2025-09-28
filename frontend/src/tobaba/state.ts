// src/state.ts

import { gameData, stages } from './data';
import { setGameState } from './index';
import { updateCharacterImages, resetBall, toggleUIElements, applyCharacterStats } from './ui';

export function setPlayer1CharIndex(index: number) {
    gameData.player1CharIndex = index;
    updateCharacterImages();
}

export function setPlayer2CharIndex(index: number) {
    gameData.player2CharIndex = index;
    updateCharacterImages();
}

export function setPlayer1Ready(ready: boolean) {
    gameData.player1Ready = ready;
}

export function setPlayer2Ready(ready: boolean) {
    gameData.player2Ready = ready;
}

export function setPlayer2AILevel(level: 'Player' | 'AI: easy' | 'AI: normal' | 'AI: hard') {
    gameData.player2AILevel = level;
}

// 新しいステージ選択関数
export function setSelectedStage(index: number) {
    if (index >= 0 && index < stages.length) {
        gameData.selectedStageIndex = index;
    }
}

export function handleCharacterSelection() {
    if (gameData.player1Ready && gameData.player2Ready) {
        // キャラクター選択完了後、ステージ選択に移行
        setGameState('stageSelect');
        setPlayer1Ready(false);
        setPlayer2Ready(false);
    }
}

// ステージ選択完了後の処理
export function handleStageSelection() {
    applyCharacterStats();
    gameData.player1.stamina = gameData.player1.maxStamina;
    gameData.player2.stamina = gameData.player2.maxStamina;
    setGameState('countingDown');
    resetBall();
    toggleUIElements();
}