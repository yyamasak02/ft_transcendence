// pingpong_3D/object/ui3D/GameHUD.ts
import {
	Scene,
	MeshBuilder,
	StandardMaterial,
	Color3,
	Vector3,
	Mesh,
} from "@babylonjs/core"
import { 
	AdvancedDynamicTexture,
	TextBlock, 
	Control,
} from "@babylonjs/gui";

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
		this.plane.position = new Vector3(0, 12, -25); // コートの奥・上
		this.plane.rotation = new Vector3(-Math.PI / 8, Math.PI, 0);
		this.plane.lookAt(new Vector3(0, 5, 0));
		this.plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
		
		this.plane.scaling = new Vector3(5, 10, 5);

		const mat = new StandardMaterial("hudMat", scene);
		mat.diffuseColor = new Color3(1, 1, 0);
		mat.alpha = 0.6; // 半透明
		mat.backFaceCulling = false;
		this.plane.material = mat;

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
		this.texture.addControl(score);
		this.scoreText = score;
		
		// カウントダウン
		const countdown = new TextBlock("countdown", "");
		countdown.fontSize = 56;
		countdown.color = "yellow";
		countdown.outlineWidth = 4;
		countdown.outlineColor = "yellow";
		countdown.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		countdown.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		this.texture.addControl(countdown);
		this.countdownText = countdown;

		// メッセージ (Game Over など)
		const info = new TextBlock("");
		info.fontSize = 36;
		info.color = "lightgray";
		info.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		info.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		info.top = "60px";
		this.texture.addControl(info);
		this.infoText = info;
		
		console.log(scene.meshes);
	}

	setScore(p1: number, p2: number) { this.scoreText.text = `${p1} - ${p2}`; }
	setCountdown(text: string) { this.countdownText.text = text; }
	clearCountdown() { this.countdownText.text = ""; }
	showGameOver(winner: "Player1" | "Player2") { this.infoText.text = `${winner} Wins!`; }
	clearGameOver() { this.infoText.text = ""; }
}
