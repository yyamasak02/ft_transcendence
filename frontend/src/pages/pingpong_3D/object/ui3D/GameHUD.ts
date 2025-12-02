// pingpong_3D/object/ui3D/GameHUD.ts
import { Scene, MeshBuilder, Vector3, Mesh } from "@babylonjs/core"
import { AdvancedDynamicTexture, TextBlock, Control } from "@babylonjs/gui";

// ============================================
// GameHUD クラス
// ============================================

export class GameHUD {
	readonly plane: Mesh;
	private texture: AdvancedDynamicTexture;
	private scoreText: TextBlock;
	private countdownText: TextBlock;
	private infoText: TextBlock;

	constructor(scene: Scene) {
		// 板を作る
		this.plane = MeshBuilder.CreatePlane(
			"hudplane", 
			{ width: 18, height: 8 },
			scene,
		);
		// billboard　と衝突するので rotation と lookAt は使わない
		this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
		this.plane.position = new Vector3(0, 12, -25);
		this.plane.scaling = new Vector3(5, 10, 5);
		
		// GUIを貼る
		this.texture = AdvancedDynamicTexture.CreateForMesh(this.plane);
		
		// スコア
		const score = new TextBlock("score", "0 - 0");
		score.fontSize = 64;
		score.color = "white";
		score.outlineWidth = 4;
		score.outlineColor = "white";
		score.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		score.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		score.top = "-70px";
		score.zIndex = 1;
		this.texture.addControl(score);
		this.scoreText = score;
		
		// カウントダウン
		const countdown = new TextBlock("countdown", "");
		console.log("countdownText init:", countdown);
		countdown.fontSize = 56;
		countdown.color = "yellow";
		countdown.outlineWidth = 4;
		countdown.outlineColor = "yellow";
		countdown.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		countdown.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		countdown.zIndex = 100;
		this.texture.addControl(countdown);
		this.countdownText = countdown;
		
		// メッセージ (Game Over など)
		const info = new TextBlock("");
		info.fontSize = 36;
		info.color = "lightgray";
		info.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		info.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		info.top = "60px";
		info.zIndex = 50;
		this.texture.addControl(info);
		this.infoText = info;
	}

	setScore(p1: number, p2: number) { 
		if (!this.scoreText) return;
		this.scoreText.text = `${p1} - ${p2}`;
	}
	setCountdown(text: string) {
		console.log("HUD setCountdown called:", text);
		if (!this.countdownText) return;
			this.countdownText.text = text;
	}
	clearCountdown() { 
		if (!this.countdownText) return;
			this.countdownText.text = "";
	}
	showGameOver(winner: "Player1" | "Player2") { 
		if (!this.infoText) return;
			this.infoText.text = `${winner} Wins!`; 
	}	
	clearGameOver() {
		if (!this.infoText) return;
			this.infoText.text = ""; 
	}
}
