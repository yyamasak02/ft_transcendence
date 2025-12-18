// pingpong_3D/core/gameSettings.ts ユーザー設定/local storage
export type PlayerType = "Player" | "Easy" | "Normal" | "Hard";

export type GameSettings = {
  winningScore: number;
  ballSpeed: number;
  selectedCountdownSpeed: number;
  selectedStageIndex: number;
  player1Color: string;
  player1Length: number;
  player2Color: string;
  player2Length: number;
  player2Type: PlayerType;
};

const DEFAULT_SETTINGS: GameSettings = {
  winningScore: 5,
  ballSpeed: 50,
  selectedCountdownSpeed: 1000,
  selectedStageIndex: 0,
  player1Color: "blue",
  player1Length: 8,
  player2Color: "green",
  player2Length: 8,
  player2Type: "Player",
};

const STORAGE_KEY = "pingpong-3D-settings";

export function loadSettings(): GameSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return JSON.parse(raw);
}

export function saveSettings(settings: GameSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
