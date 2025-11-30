// pingpong_3D/input/keyboard.ts
import { gameData, engine } from "../core/data";
import { setBallSpeed, setWinningScore, BASE_BALL_SPEED, WINNING_SCORE } from "../core/constants";
import { setGameState } from "../core/state";
import { toggleUIElements } from "../ui/ui";

export function setupKeyboardListener() {
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

		if (e.key === "Enter") {
			if (gameData.gameState === "menu") {
				setGameState("modeSelect");
			} else if (gameData.gameState === "gameover") {
				setGameState("menu");
				gameData.player1.score = 0;
				gameData.player2.score = 0;
				toggleUIElements();
			} else if (gameData.gameState === "paused") {
				setGameState("menu");
				gameData.player1.score = 0;
				gameData.player2.score = 0;
				toggleUIElements();
			}
		}
	});

	document.addEventListener("keyup", (e) => {
		gameData.keysPressed[e.key] = false;
	});
	
	// スマホ用画面のリサイズ
	window.addEventListener("resize", () => {
		engine.resize();
	});
}