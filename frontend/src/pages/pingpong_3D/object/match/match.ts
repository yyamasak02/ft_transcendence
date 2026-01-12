// src/pages/pingpong_3D/matchService.ts
import { getStoredAccessToken } from "@/utils/token-storage";

export const matchService = {
  async createSession(guestName: string): Promise<number | null> {
    const token = getStoredAccessToken();
    if (!token) {
      return null;
    }

    let guestPuid = guestName;
    let isGuest = false;

    try {
      const puidRes = await fetch(`/api/common/user/puid?name=${guestName}`);
      if (puidRes.ok) {
        const puidData = await puidRes.json();
        if (puidData.puid) {
          guestPuid = puidData.puid;
        } else {
          isGuest = true;
        }
      } else {
        isGuest = true;
      }
    } catch (e) {
      isGuest = true;
    }

    if (isGuest) {
      return null;
    }

    // セッション作成
    try {
      const res = await fetch("/api/common/match_session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ guestPuid }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.id;
      } else {
        return null;
      }
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
      const res = await fetch("/api/common/match_result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: matchId,
          ownerScore: ownerScore,
          guestScore: guestScore,
        }),
      });
    } catch (error) {
      console.error("[Error] Error saving match result:", error);
    }
  },
};
