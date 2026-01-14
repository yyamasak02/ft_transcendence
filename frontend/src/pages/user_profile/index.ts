import type { Route } from "@/types/routes";
import { langManager, word, t, i18nAttr } from "@/i18n";
import { navigate } from "@/router";
import { getStoredAccessToken } from "@/utils/token-storage";
import { appendReturnTo, getCurrentPath } from "@/utils/return-to";
import {
  DEFAULT_PROFILE_IMAGE,
  getProfileImageSrc,
  isProfileImageKey,
} from "@/utils/profile-images";
import { formatMatchDate } from "@/utils/date-format";
import { fetchProfileImageBlob } from "@/utils/profile-image-fetch";
import type { FriendItem } from "@/types/friends";
import "./style.css";

type MatchItem = {
  id: number;
  ownerName: string;
  guestName?: string;
  ownerScore: number;
  guestScore: number;
  createdAt: string;
};

class UserProfileComponent {
  render = () => {
    return `
      <div class="user-profile-page">
        <div class="user-profile-card">
          <div class="user-profile-layout">
            <div class="user-profile-left">
              <div class="user-profile-name" id="user-profile-name"></div>
              <div class="user-profile-avatar-row">
                <img class="user-profile-avatar" id="user-profile-avatar" src="${getProfileImageSrc(DEFAULT_PROFILE_IMAGE)}" ${i18nAttr("alt", "profile_image_alt")} />
                <div class="user-profile-status" id="user-profile-status"></div>
              </div>
              <button class="user-profile-friend-request" id="user-profile-friend-request">
                ${t("friend_request_button")}
              </button>
              <div class="user-profile-friend-msg" id="user-profile-friend-msg"></div>
              <button class="user-profile-back" id="user-profile-back">
                ${t("my_profile")}
              </button>
            </div>
            <div class="user-profile-center">
              <div class="user-profile-section">
                <h3 class="user-profile-section-title">${t("match_results")}</h3>
                <div class="user-profile-matches" id="user-profile-matches"></div>
              </div>
            </div>
            <div class="user-profile-spacer"></div>
          </div>
        </div>
      </div>
    `;
  };
}

const formatMatchDateByLang = (createdAt: string) =>
  formatMatchDate(createdAt, langManager.lang);

const MATCH_RESULT_CONFIG = {
  win: {
    statusClass: "status-win",
    symbol: "●",
    resultText: "WIN",
  },
  lose: {
    statusClass: "status-lose",
    symbol: "○",
    resultText: "LOSE",
  },
} as const;

type FriendInfo = {
  isFriend: boolean;
  friendId: number | null;
};

class UserProfileController {
  private nameEl: HTMLDivElement | null;
  private statusEl: HTMLDivElement | null;
  private avatarEl: HTMLImageElement | null;
  private friendButton: HTMLButtonElement | null;
  private friendMsg: HTMLDivElement | null;
  private matchesEl: HTMLDivElement | null;
  private backButton: HTMLButtonElement | null;

  constructor() {
    this.nameEl = document.querySelector<HTMLDivElement>("#user-profile-name");
    this.statusEl = document.querySelector<HTMLDivElement>(
      "#user-profile-status",
    );
    this.avatarEl = document.querySelector<HTMLImageElement>(
      "#user-profile-avatar",
    );
    this.friendButton = document.querySelector<HTMLButtonElement>(
      "#user-profile-friend-request",
    );
    this.friendMsg = document.querySelector<HTMLDivElement>(
      "#user-profile-friend-msg",
    );
    this.matchesEl = document.querySelector<HTMLDivElement>(
      "#user-profile-matches",
    );
    this.backButton =
      document.querySelector<HTMLButtonElement>("#user-profile-back");
  }

  setProfileMessage(message: string) {
    if (!this.matchesEl) return;
    this.matchesEl.textContent = message;
  }

  setProfileHeader(name: string, online: boolean, isFriend: boolean) {
    if (this.nameEl) {
      this.nameEl.innerHTML = isFriend
        ? `<span class="user-profile-friend-heart">&#9829;</span> ${name}`
        : name;
    }
    if (this.statusEl) {
      this.statusEl.textContent = online
        ? word("user_profile_online")
        : word("user_profile_offline");
      this.statusEl.classList.toggle("is-online", online);
      this.statusEl.classList.toggle("is-offline", !online);
    }
  }

  setFriendMessage(message: string) {
    if (this.friendMsg) this.friendMsg.textContent = message;
  }

  async loadCustomProfileImage(name: string) {
    const accessToken = getStoredAccessToken();
    if (!accessToken || !this.avatarEl) return;
    const blob = await fetchProfileImageBlob(name, accessToken);
    if (!blob) return;
    this.avatarEl.src = URL.createObjectURL(blob);
  }

  setProfileImage(profileImage: string | null, name: string) {
    if (!this.avatarEl) return;
    if (profileImage && isProfileImageKey(profileImage)) {
      this.avatarEl.src = getProfileImageSrc(profileImage);
      return;
    }
    this.loadCustomProfileImage(name);
  }

  renderMatches(items: MatchItem[], profileName: string) {
    if (!this.matchesEl) return;
    if (!items.length) {
      this.matchesEl.textContent = word("no_matches");
      return;
    }
    this.matchesEl.innerHTML = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      const isOwner = item.ownerName === profileName;
      const opponent = isOwner
        ? (item.guestName ?? word("unknown_user"))
        : item.ownerName;
      const myScore = isOwner ? item.ownerScore : item.guestScore;
      const oppScore = isOwner ? item.guestScore : item.ownerScore;

      const isWin = myScore > oppScore;
      const { statusClass, symbol, resultText } = isWin
        ? MATCH_RESULT_CONFIG.win
        : MATCH_RESULT_CONFIG.lose;

      const formattedDate = formatMatchDateByLang(item.createdAt);

      row.className = `user-profile-match ${statusClass}`;

      row.innerHTML = `
        <div class="card-left">
          <span class="result-symbol">${symbol}</span>
          <span class="result-label">${resultText}</span>
        </div>
        <div class="card-center">
          <div class="opponent-name">${opponent}</div>
          <div class="match-date">${formattedDate}</div>
        </div>
        <div class="card-right">
          <span class="score-num my-score">${myScore}</span>
          <span class="score-sep">-</span>
          <span class="score-num opp-score">${oppScore}</span>
        </div>
      `;

      this.matchesEl?.appendChild(row);
    });
  }

  setupBack() {
    if (!this.backButton) return;
    this.backButton.addEventListener("click", () => {
      navigate("/me");
    });
  }

  setupFriendAction(name: string, online: boolean, friendInfo: FriendInfo) {
    if (!this.friendButton) return;
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      this.friendButton.disabled = true;
      return;
    }
    this.friendButton.disabled = false;
    this.friendButton.innerHTML = friendInfo.isFriend
      ? t("friend_remove_button")
      : t("friend_request_button");
    this.friendButton.onclick = async (event) => {
      event.preventDefault();
      this.friendButton!.disabled = true;
      this.setFriendMessage("");
      try {
        const res =
          friendInfo.isFriend && friendInfo.friendId
            ? await fetch("/api/common/user/friends/remove", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ friendId: friendInfo.friendId }),
              })
            : await fetch("/api/common/user/friends/request", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
              });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          this.setFriendMessage(
            body?.message ??
              word(
                friendInfo.isFriend
                  ? "friend_remove_failed"
                  : "friend_request_failed",
              ),
          );
          this.friendButton!.disabled = false;
          return;
        }
        if (friendInfo.isFriend) {
          this.setFriendMessage(word("friend_remove_done"));
          this.setProfileHeader(name, online, false);
          this.setupFriendAction(name, online, {
            isFriend: false,
            friendId: null,
          });
          return;
        }
        this.setFriendMessage(word("friend_request_sent"));
      } catch {
        this.setFriendMessage(
          word(
            friendInfo.isFriend
              ? "friend_remove_failed"
              : "friend_request_failed",
          ),
        );
        this.friendButton!.disabled = false;
      }
    };
  }

  async loadFriendStatus(name: string): Promise<FriendInfo> {
    const accessToken = getStoredAccessToken();
    if (!accessToken) return { isFriend: false, friendId: null };
    try {
      const res = await fetch("/api/common/user/friends", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) return { isFriend: false, friendId: null };
      const body = await res.json().catch(() => ({}));
      const friends = Array.isArray(body?.friends) ? body.friends : [];
      const match = (friends as FriendItem[]).find(
        (friend) => friend?.name === name && friend?.status === "accepted",
      );
      return match?.id
        ? { isFriend: true, friendId: match.id }
        : { isFriend: false, friendId: null };
    } catch {
      return { isFriend: false, friendId: null };
    }
  }

  async loadProfile(name: string) {
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      navigate(appendReturnTo("/login", getCurrentPath()));
      return;
    }
    try {
      const res = await fetch(
        `/api/common/user/profile?name=${encodeURIComponent(name)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const body = await res.json().catch(() => ({}));
      if (res.status === 404) {
        this.setProfileMessage(word("user_profile_not_found"));
        return;
      }
      if (!res.ok) {
        this.setProfileMessage(
          body?.message ?? word("match_results_fetch_failed"),
        );
        return;
      }
      const profileName = String(body.name ?? name);
      const online = Boolean(body.online);
      const friendInfo = await this.loadFriendStatus(profileName);
      this.setProfileHeader(profileName, online, friendInfo.isFriend);
      this.setupFriendAction(profileName, online, friendInfo);
      const profileImage = body?.profileImage ?? null;
      const profileImageKey =
        typeof profileImage === "string" ? profileImage : null;
      this.setProfileImage(profileImageKey, profileName);
      if (Array.isArray(body.matches)) {
        this.renderMatches(body.matches as MatchItem[], profileName);
      } else {
        this.setProfileMessage(word("match_results_fetch_failed"));
      }
    } catch (error) {
      console.error("Match results fetch failed", error);
      this.setProfileMessage(word("match_results_fetch_failed"));
    }
  }
}

const getProfileNameFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name")?.trim() ?? "";
};

export const UserProfileRoute: Route = {
  linkLabel: "",
  content: () => new UserProfileComponent().render(),
  onMount: () => {
    const name = getProfileNameFromQuery();
    if (!name) {
      new UserProfileController().setProfileMessage(
        word("user_profile_not_found"),
      );
      return;
    }
    const controller = new UserProfileController();
    controller.setupBack();
    controller.loadProfile(name);
  },
  head: { title: "User Profile" },
};
