// pingpong_3D/core/gameSettings.ts

export type PlayerType = "Player" | "Easy" | "Normal" | "Hard";

export type GameSettings = {
  winningScore: number;
  rallyRush: boolean;
  selectedCountdownSpeed: number;
  selectedStageIndex: number;
  player1Color: string;
  player1Length: number;
  player2Color: string;
  player2Length: number;
  player2Type: PlayerType;
};

const DEFAULT_SETTINGS: GameSettings = {
  winningScore: 3,
  rallyRush: true,
  selectedCountdownSpeed: 1000,
  selectedStageIndex: 0,
  player1Color: "blue",
  player1Length: 8,
  player2Color: "green",
  player2Length: 8,
  player2Type: "Player",
};

const STORAGE_KEY = "pingpong-3D-settings";

const VALID_PLAYER_TYPES: PlayerType[] = ["Player", "Easy", "Normal", "Hard"];

export function loadSettings(): GameSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(raw);
    const settings: GameSettings = { ...DEFAULT_SETTINGS, ...parsed };

    if (typeof settings.rallyRush !== "boolean") {
      settings.rallyRush = DEFAULT_SETTINGS.rallyRush;
    }

    if (!VALID_PLAYER_TYPES.includes(settings.player2Type)) {
      console.warn(
        `Invalid player2Type detected: ${settings.player2Type}. Resetting to default.`,
      );
      settings.player2Type = DEFAULT_SETTINGS.player2Type;
    }
    if (
      typeof settings.winningScore !== "number" ||
      settings.winningScore < 1
    ) {
      settings.winningScore = DEFAULT_SETTINGS.winningScore;
    }

    return settings;
  } catch (e) {
    console.error(
      "Failed to parse settings from localStorage. Using defaults.",
    );
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
