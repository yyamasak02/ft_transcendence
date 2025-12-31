import type { Route } from "@/types/routes";
import { langManager, word, t, i18nAttr } from "@/i18n";
import { navigate } from "@/router";
import { getStoredAccessToken } from "@/utils/token-storage";
import {
  DEFAULT_PROFILE_IMAGE,
  getProfileImageSrc,
  isProfileImageKey,
} from "@/utils/profile-images";
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

const setProfileMessage = (message: string) => {
  const container = document.querySelector<HTMLDivElement>(
    "#user-profile-matches",
  );
  if (!container) return;
  container.textContent = message;
};

const setProfileHeader = (name: string, online: boolean, isFriend: boolean) => {
  const nameEl = document.querySelector<HTMLDivElement>("#user-profile-name");
  const statusEl = document.querySelector<HTMLDivElement>("#user-profile-status");
  if (nameEl) {
    nameEl.innerHTML = isFriend
      ? `<span class="user-profile-friend-heart">&#9829;</span> ${name}`
      : name;
    nameEl.classList.toggle("is-online", online);
    nameEl.classList.toggle("is-offline", !online);
  }
  if (statusEl) {
    statusEl.textContent = online ? word("user_profile_online") : word("user_profile_offline");
    statusEl.classList.toggle("is-online", online);
    statusEl.classList.toggle("is-offline", !online);
  }
};

const setFriendMessage = (message: string) => {
  const el = document.querySelector<HTMLDivElement>("#user-profile-friend-msg");
  if (el) el.textContent = message;
};

const loadCustomProfileImage = async (name: string) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  const img = document.querySelector<HTMLImageElement>("#user-profile-avatar");
  if (!img) return;
  try {
    const res = await fetch(
      `/api/common/user/profile_image_data?name=${encodeURIComponent(name)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!res.ok) return;
    const blob = await res.blob();
    img.src = URL.createObjectURL(blob);
  } catch {
    return;
  }
};

const setProfileImage = (profileImage: string | null, name: string) => {
  const img = document.querySelector<HTMLImageElement>("#user-profile-avatar");
  if (!img) return;
  if (profileImage && isProfileImageKey(profileImage)) {
    img.src = getProfileImageSrc(profileImage);
    return;
  }
  loadCustomProfileImage(name);
};

const parseMatchDate = (value: string) => {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const normalized = value.replace(" ", "T");
  const withZone = normalized.endsWith("Z") ? normalized : `${normalized}Z`;
  const fallback = new Date(withZone);
  if (!Number.isNaN(fallback.getTime())) return fallback;
  return null;
};

const formatMatchDate = (createdAt: string) => {
  const date = parseMatchDate(createdAt);
  if (!date) return createdAt;
  const lang = langManager.lang;
  const timeZone = "Asia/Tokyo";
  if (lang === "ja") {
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(date);
  }
  if (lang === "edo") {
    const edoDate = new Date(date.getTime());
    edoDate.setFullYear(edoDate.getFullYear() - 300);
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(edoDate);
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const renderMatches = (items: MatchItem[], profileName: string) => {
  const container = document.querySelector<HTMLDivElement>(
    "#user-profile-matches",
  );
  if (!container) return;
  if (!items.length) {
    container.textContent = word("no_matches");
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "user-profile-match";
    const isOwner = item.ownerName === profileName;
    const opponent = isOwner
      ? item.guestName ?? word("ai_opponent")
      : item.ownerName;
    const myScore = isOwner ? item.ownerScore : item.guestScore;
    const oppScore = isOwner ? item.guestScore : item.ownerScore;
    const result =
      myScore > oppScore
        ? word("result_win")
        : myScore < oppScore
          ? word("result_lose")
          : word("result_draw");
    const score = `${myScore} - ${oppScore}`;
    const formattedDate = formatMatchDate(item.createdAt);
    row.textContent = `${result} | ${opponent} | ${score} | ${formattedDate}`;
    container.appendChild(row);
  });
};

const loadProfile = async (name: string) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    navigate("/login");
    return;
  }
  try {
    const res = await fetch(`/api/common/user/profile?name=${encodeURIComponent(name)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 404) {
      setProfileMessage(word("user_profile_not_found"));
      return;
    }
    if (!res.ok) {
      setProfileMessage(body?.message ?? word("match_results_fetch_failed"));
      return;
    }
    const profileName = String(body.name ?? name);
    const online = Boolean(body.online);
    const isFriend = await loadFriendStatus(profileName);
    setProfileHeader(profileName, online, isFriend);
    const profileImage = body?.profileImage ?? null;
    const profileImageKey = typeof profileImage === "string" ? profileImage : null;
    setProfileImage(profileImageKey, profileName);
    if (Array.isArray(body.matches)) {
      renderMatches(body.matches as MatchItem[], profileName);
    } else {
      setProfileMessage(word("match_results_fetch_failed"));
    }
  } catch (error) {
    setProfileMessage(`${word("match_results_fetch_failed")}: ${error}`);
  }
};

const setupBack = () => {
  const button = document.querySelector<HTMLButtonElement>("#user-profile-back");
  if (!button) return;
  button.addEventListener("click", () => {
    navigate("/me");
  });
};

const setupFriendRequest = (name: string) => {
  const button = document.querySelector<HTMLButtonElement>(
    "#user-profile-friend-request",
  );
  if (!button) return;
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    button.disabled = true;
    return;
  }
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    button.disabled = true;
    setFriendMessage("");
    try {
      const res = await fetch("/api/common/user/friends/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFriendMessage(body?.message ?? word("friend_request_failed"));
        button.disabled = false;
        return;
      }
      setFriendMessage(word("friend_request_sent"));
    } catch {
      setFriendMessage(word("friend_request_failed"));
      button.disabled = false;
    }
  });
};

const loadFriendStatus = async (name: string) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return false;
  try {
    const res = await fetch("/api/common/user/friends", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return false;
    const body = await res.json().catch(() => ({}));
    const friends = Array.isArray(body?.friends) ? body.friends : [];
    return friends.some(
      (friend: { name?: string; status?: string }) =>
        friend?.name === name && friend?.status === "accepted",
    );
  } catch {
    return false;
  }
};

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
      setProfileMessage(word("user_profile_not_found"));
      return;
    }
    setupBack();
    setupFriendRequest(name);
    loadProfile(name);
  },
  head: { title: "User Profile" },
};
