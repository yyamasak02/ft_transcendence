// src/pages/pingpong_3D/matchService.ts
import { getStoredAccessToken } from "@/utils/token-storage";

const PENDING_RESULTS_KEY = "pending_match_results";
interface MatchResultData {
  matchId: number;
  ownerScore: number;
  guestScore: number;
}

export const matchService = {
  // セッション作成
  async createSession(opponentName: string): Promise<number | null> {
    const token = getStoredAccessToken();
    let targetPuid: string | null = null;
    if (!token) return null;

    try {
      const res = await fetch(`/api/common/user/puid?name=${opponentName}`);
      if (res.ok) {
        const data = await res.json();
        if (data.puid) {
          targetPuid = data.puid;
        }
      }
    } catch (e) {}

    if (!targetPuid) {
      try {
        const guestRes = await fetch(`/api/common/user/puid?name=guest`);
        if (guestRes.ok) {
          const guestData = await guestRes.json();
          if (guestData.puid) {
            targetPuid = guestData.puid;
          }
        }
      } catch (e) {}
    }

    if (!targetPuid) {
      return null;
    }
    try {
      const res = await fetch("/api/common/match_session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ guestPuid: targetPuid }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      return data.id;
    } catch (e) {
      return null;
    }
  },

  // 対戦結果の保存
  async saveResult(
    matchId: number,
    ownerScore: number,
    guestScore: number,
  ): Promise<void> {
    const token = getStoredAccessToken();
    const data: MatchResultData = { matchId, ownerScore, guestScore };

    if (!token) {
      this.saveLocally(data);
      return;
    }

    try {
      const res = await fetch("/api/common/match_result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        this.saveLocally(data);
      }
    } catch (error) {
      console.error("[Error] Error saving match result:", error);
      this.saveLocally(data);
    }
  },

  // 一時保存
  saveLocally(data: MatchResultData) {
    try {
      const json = localStorage.getItem(PENDING_RESULTS_KEY);
      const list: MatchResultData[] = json ? JSON.parse(json) : [];
      // 重複チェック
      if (!list.some((d) => d.matchId === data.matchId)) {
        list.push(data);
        localStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(list));
      }
    } catch (e) {}
  },

  // 一時保存データの送信
  async retryPendingResults() {
    const token = getStoredAccessToken();
    if (!token) return;

    const json = localStorage.getItem(PENDING_RESULTS_KEY);
    if (!json) return;

    const list: MatchResultData[] = JSON.parse(json);
    const remaining: MatchResultData[] = [];

    for (const data of list) {
      try {
        const res = await fetch("/api/common/match_result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        if (!res.ok) remaining.push(data);
      } catch (e) {
        remaining.push(data);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(PENDING_RESULTS_KEY);
    }
  },
};
