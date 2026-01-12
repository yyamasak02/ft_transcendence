// src/pages/pingpong_3D/matchService.ts
import { getStoredAccessToken } from "@/utils/token-storage";

export const matchService = {
  // セッション作成
  async createSession(opponentName: string): Promise<number | null> {
    const token = getStoredAccessToken();
    if (!token) return null;

    let targetPuid: string | null = null;

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
    if (!token) return;

    try {
      await fetch("/api/common/match_result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId,
          ownerScore,
          guestScore,
        }),
      });
    } catch (error) {
      console.error("[Error] Error saving match result:", error);
    }
  },
};
