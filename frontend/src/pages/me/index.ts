import type { Route } from "@/types/routes";
import { langManager, word, t, i18nAttr } from "@/i18n";
import { navigate } from "@/router";
import { ACCESS_TOKEN_KEY, LONG_TERM_TOKEN_KEY } from "@/constants/auth";
import "./style.css";
import { decodeJwtPayload } from "@/utils/jwt";
import { getStoredAccessToken } from "@/utils/token-storage";
import {
  DEFAULT_PROFILE_IMAGE,
  PROFILE_IMAGES,
  getProfileImageSrc,
  isProfileImageKey,
  type ProfileImageKey,
} from "@/utils/profile-images";
import { formatMatchDate } from "@/utils/date-format";
import { fetchProfileImageBlob } from "@/utils/profile-image-fetch";
import type { FriendItem } from "@/types/friends";

class MeComponent {
  render = () => {
    const accessToken = getStoredAccessToken();
    const currentName = accessToken
      ? decodeJwtPayload(accessToken)?.name ?? word("user_menu")
      : word("user_menu");
    const pickerItems = PROFILE_IMAGES.map(
      (item) =>
        `<button type="button" data-profile="${item.key}">${item.label}</button>`,
    ).join("");
    return `
      <div class="me-layout">
        <div class="me-page">
          <form class="me-search" id="me-user-search">
            <input
              type="text"
              class="me-search-input"
              name="username"
              ${i18nAttr("placeholder", "user_search_placeholder")}
              required
            />
            <button class="me-search-btn" type="submit">
              ${t("user_search_button")}
            </button>
          </form>
          <div class="me-search-msg" id="me-user-search-msg"></div>
          <h2 class="me-title">${currentName}</h2>
          <div class="me-avatar-row">
            <img class="me-avatar" id="me-avatar" src="${getProfileImageSrc(DEFAULT_PROFILE_IMAGE)}" alt="Profile image" />
            <a class="me-avatar-link" href="#" id="me-avatar-change">${t("profile_image_change")}</a>
          </div>
          <div class="me-avatar-picker" id="me-avatar-picker">
            ${pickerItems}
            <label class="me-avatar-upload">
              <input type="file" id="me-avatar-upload" accept="image/png" />
              ${t("profile_image_upload")}
            </label>
          </div>
          <div class="me-avatar-msg" id="me-avatar-msg"></div>
        <div class="me-section">
          <h3 class="me-section-title">${t("two_factor")}</h3>
          <p class="me-section-desc">${t("two_factor_desc")}</p>
          <button class="me-2fa" id="me-2fa">${t("two_factor_enable")}</button>
          <div class="me-qr" id="me-qr"></div>
          <p class="me-2fa-msg" id="me-2fa-msg"></p>
        </div>
        <div class="me-section">
          <h3 class="me-section-title">${t("username_change")}</h3>
          <p class="me-section-desc">${t("username_change_desc")}</p>
          <a class="me-link" href="/username-change" data-nav>
            ${t("username_change_action")}
          </a>
        </div>
        <button class="me-logout" id="me-logout">${t("logout")}</button>
        </div>
        <div class="me-side">
          <h3 class="me-side-title">${t("match_results")}</h3>
          <div class="me-matches-summary" id="me-matches-summary"></div>
          <div class="me-matches" id="me-matches"></div>
        </div>
        <div class="me-friends-panel">
          <h3 class="me-side-title">${t("friends")}</h3>
          <div class="me-friends-list" id="me-friends-list"></div>
        </div>
      </div>
    `;
  };
}

const setTwoFactorMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#me-2fa-msg");
  if (el) el.textContent = message;
};

const QR_CODE_SIZE = 200;

const renderQr = (data: string) => {
  const container = document.querySelector<HTMLDivElement>("#me-qr");
  if (!container) return;
  const src =
    "https://api.qrserver.com/v1/create-qr-code/?" +
    `size=${QR_CODE_SIZE}x${QR_CODE_SIZE}&data=${encodeURIComponent(data)}`;
  container.innerHTML = "";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "2FA QR";
  img.width = QR_CODE_SIZE;
  img.height = QR_CODE_SIZE;
  const tokenText = document.createElement("div");
  tokenText.className = "me-qr-token";
  tokenText.textContent = data;
  container.append(img, tokenText);
};

const buildOtpAuthUri = (secret: string, name?: string) => {
  const issuer = "ft_transcendence";
  const label = `${issuer}:${name ?? "user"}`;
  return (
    `otpauth://totp/${encodeURIComponent(label)}` +
    `?secret=${encodeURIComponent(secret)}` +
    `&issuer=${encodeURIComponent(issuer)}`
  );
};

const revokeLongTermToken = async () => {
  const accessToken =
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ??
    localStorage.getItem(ACCESS_TOKEN_KEY);
  const longTermToken = localStorage.getItem(LONG_TERM_TOKEN_KEY);
  if (!accessToken || !longTermToken) return;
  const payload = decodeJwtPayload(accessToken);
  if (!payload?.puid) return;

  await fetch("/api/common/user/destroy_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ puid: payload.puid, longTermToken }),
  }).catch(() => null);
};

const clearTokens = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LONG_TERM_TOKEN_KEY);
};

const setupTwoFactor = () => {
  const button = document.querySelector<HTMLButtonElement>("#me-2fa");
  if (!button) return;
  const accessToken =
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ??
    localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    setTwoFactorMsg(word("two_factor_missing_login"));
    button.disabled = true;
    return;
  }

  fetch("/api/common/user/2fa_status", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then(async (res) => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;
      if (body?.enabled) {
        button.disabled = true;
        button.style.display = "none";
        setTwoFactorMsg(word("two_factor_already_enabled"));
      }
    })
    .catch(() => null);

  button.addEventListener("click", async () => {
    setTwoFactorMsg("");
    const payload = decodeJwtPayload(accessToken);
    if (!payload?.name) {
      setTwoFactorMsg(word("two_factor_missing_login"));
      return;
    }
    button.disabled = true;
    try {
      const res = await fetch("/api/common/user/enable_2fa", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTwoFactorMsg(
          body?.message ??
            `${word("two_factor_failed")} (status ${res.status})`,
        );
        return;
      }
      const token = String(body.token ?? "");
      if (!token) {
        setTwoFactorMsg(word("two_factor_failed"));
        return;
      }
      renderQr(buildOtpAuthUri(token, payload.name));
      setTwoFactorMsg(word("two_factor_enabled"));
      button.disabled = true;
      button.style.display = "none";
    } catch (error) {
      setTwoFactorMsg(`${word("two_factor_failed")}: ${error}`);
    } finally {
      if (!button.disabled) {
        button.disabled = false;
      }
    }
  });
};

const setupLogout = () => {
  const button = document.querySelector<HTMLButtonElement>("#me-logout");
  if (!button) return;
  button.addEventListener("click", async () => {
    try {
      await revokeLongTermToken();
    } catch (error) {
      console.error("Failed to revoke long-term token during logout:", error);
    }
    clearTokens();
    navigate("/");
  });
};

const setupUserMenuLinks = () => {
  const link = document.querySelector<HTMLAnchorElement>(
    ".me-link[href='/username-change']",
  );
  if (!link) return;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate("/username-change");
  });
};

const setupUserSearch = () => {
  const form = document.querySelector<HTMLFormElement>("#me-user-search");
  const message = document.querySelector<HTMLDivElement>("#me-user-search-msg");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (message) message.textContent = "";
    const formData = new FormData(form);
    const name = String(formData.get("username") ?? "").trim();
    if (!name) return;
    const accessToken = getStoredAccessToken();
    const currentName = accessToken
      ? decodeJwtPayload(accessToken)?.name ?? ""
      : "";
    if (currentName && currentName.toLowerCase() === name.toLowerCase()) {
      if (message) message.textContent = word("user_search_self");
      return;
    }
    if (!accessToken) {
      navigate("/login");
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
      if (res.status === 404) {
        if (message) message.textContent = word("user_profile_not_found");
        return;
      }
      if (!res.ok) {
        if (message) message.textContent = word("user_search_failed");
        return;
      }
      navigate(`/user?name=${encodeURIComponent(name)}`);
    } catch (error) {
      console.error("User search failed", error);
      if (message) message.textContent = word("user_search_failed");
    }
  });
};

const loadFriendCustomImage = async (name: string, img: HTMLImageElement) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  const blob = await fetchProfileImageBlob(name, accessToken);
  if (!blob) return;
  img.src = URL.createObjectURL(blob);
};

const renderFriends = (items: FriendItem[]) => {
  const container = document.querySelector<HTMLDivElement>("#me-friends-list");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) {
    container.textContent = word("friends_empty");
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "me-friend";

    const avatar = document.createElement("img");
    avatar.className = "me-friend-avatar";
    avatar.alt = word("profile_image_alt");
    if (item.profileImage && isProfileImageKey(item.profileImage)) {
      avatar.src = getProfileImageSrc(item.profileImage);
    } else {
      avatar.src = getProfileImageSrc(DEFAULT_PROFILE_IMAGE);
      loadFriendCustomImage(item.name, avatar);
    }

    const info = document.createElement("div");
    info.className = "me-friend-info";

    const nameLink = document.createElement("a");
    nameLink.className = "me-friend-link";
    nameLink.href = `/user?name=${encodeURIComponent(item.name)}`;
    nameLink.textContent = item.name;
    nameLink.setAttribute("data-name", item.name);

    const status = document.createElement("div");
    status.className = "me-friend-status";
    if (item.status === "accepted") {
      status.textContent = item.online
        ? word("user_profile_online")
        : word("user_profile_offline");
      status.classList.toggle("is-online", item.online);
      status.classList.toggle("is-offline", !item.online);
    } else if (item.status === "pending_incoming") {
      status.textContent = word("friend_status_pending_incoming");
    } else {
      status.textContent = word("friend_status_pending_outgoing");
    }

    info.append(nameLink, status);

    const actions = document.createElement("div");
    actions.className = "me-friend-actions";
    if (item.status === "pending_incoming") {
      const accept = document.createElement("button");
      accept.type = "button";
      accept.className = "me-friend-accept";
      accept.textContent = word("friend_accept");
      accept.setAttribute("data-id", String(item.id));
      accept.setAttribute("data-action", "accept");

      const decline = document.createElement("button");
      decline.type = "button";
      decline.className = "me-friend-decline";
      decline.textContent = word("friend_decline");
      decline.setAttribute("data-id", String(item.id));
      decline.setAttribute("data-action", "decline");

      actions.append(accept, decline);
    }

    row.append(avatar, info, actions);
    container.appendChild(row);
  });
};

const loadFriends = async () => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  try {
    const res = await fetch("/api/common/user/friends", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return;
    const body = await res.json().catch(() => ({}));
    const items = Array.isArray(body?.friends) ? body.friends : [];
    const sorted = [...items].sort((a, b) => {
      if (a.status === "accepted" && b.status === "accepted") {
        if (a.online === b.online) return 0;
        return a.online ? -1 : 1;
      }
      if (a.status === "accepted") return -1;
      if (b.status === "accepted") return 1;
      if (a.status === "pending_incoming" && b.status === "pending_outgoing") return -1;
      if (a.status === "pending_outgoing" && b.status === "pending_incoming") return 1;
      return 0;
    });
    renderFriends(sorted as FriendItem[]);
  } catch {
    return;
  }
};

const respondFriendRequest = async (requestId: number, accept: boolean) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  await fetch("/api/common/user/friends/respond", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ requestId, accept }),
  }).catch(() => null);
  loadFriends();
};

const setupFriendActions = () => {
  const container = document.querySelector<HTMLDivElement>("#me-friends-list");
  if (!container) return;
  container.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.classList.contains("me-friend-link")) {
      event.preventDefault();
      const name = target.getAttribute("data-name");
      if (name) navigate(`/user?name=${encodeURIComponent(name)}`);
      return;
    }
    const action = target.getAttribute("data-action");
    const id = target.getAttribute("data-id");
    if (!action || !id) return;
    const requestId = Number(id);
    if (!Number.isFinite(requestId)) return;
    respondFriendRequest(requestId, action === "accept");
  });
};


const renderMatches = (
  items: Array<{
    id: number;
    ownerName: string;
    guestName?: string;
    ownerScore: number;
    guestScore: number;
    createdAt: string;
  }>,
  currentName: string | null,
) => {
  const container = document.querySelector<HTMLDivElement>("#me-matches");
  const summary = document.querySelector<HTMLDivElement>("#me-matches-summary");
  if (!container) return;
  if (summary) {
    summary.textContent = "";
  }
  if (!items.length) {
    container.textContent = word("no_matches");
    return;
  }
  let wins = 0;
  let losses = 0;
  let draws = 0;
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "me-match";
    const isOwner = currentName ? item.ownerName === currentName : true;
    const opponent = isOwner
      ? (item.guestName ?? word("ai_opponent"))
      : item.ownerName;
    const myScore = isOwner ? item.ownerScore : item.guestScore;
    const oppScore = isOwner ? item.guestScore : item.ownerScore;
    const result =
      myScore > oppScore
        ? word("result_win")
        : myScore < oppScore
          ? word("result_lose")
          : word("result_draw");
    if (myScore > oppScore) wins += 1;
    else if (myScore < oppScore) losses += 1;
    else draws += 1;
    const score = `${myScore} - ${oppScore}`;
    const formattedDate = formatMatchDateByLang(item.createdAt);
    row.textContent = `${result} | ${opponent} | ${score} | ${formattedDate}`;
    container.appendChild(row);
  });
  if (summary) {
    summary.textContent = `${word("match_summary")} ${word("result_win")}: ${wins} / ${word("result_lose")}: ${losses} / ${word("result_draw")}: ${draws}`;
  }
};

const formatMatchDateByLang = (createdAt: string) =>
  formatMatchDate(createdAt, langManager.lang);

const setMatchesMessage = (message: string) => {
  const container = document.querySelector<HTMLDivElement>("#me-matches");
  if (!container) return;
  container.textContent = message;
};

const loadCustomProfileImage = async (name: string) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  const img = document.querySelector<HTMLImageElement>("#me-avatar");
  if (!img) return;
  const blob = await fetchProfileImageBlob(name, accessToken);
  if (!blob) return;
  img.src = URL.createObjectURL(blob);
};

const setProfileImage = (profileImage: string | null, name: string | null) => {
  const img = document.querySelector<HTMLImageElement>("#me-avatar");
  if (!img) return;
  if (profileImage && isProfileImageKey(profileImage)) {
    img.src = getProfileImageSrc(profileImage);
    return;
  }
  if (name) {
    loadCustomProfileImage(name);
  }
};

const loadProfileImage = async (name: string) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  try {
    const res = await fetch(
      `/api/common/user/profile_image?name=${encodeURIComponent(name)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!res.ok) return;
    const body = await res.json().catch(() => ({}));
    const profileImage = body?.profileImage ?? null;
    const profileImageKey = typeof profileImage === "string" ? profileImage : null;
    setProfileImage(profileImageKey, name);
  } catch {
    return;
  }
};

const updateProfileImage = async (profileImage: ProfileImageKey, name: string | null) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  try {
    const res = await fetch("/api/common/user/profile_image", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ profileImage }),
    });
    if (!res.ok) return;
    setProfileImage(profileImage, name);
  } catch {
    return;
  }
};

const uploadProfileImage = async (imageBase64: string, name: string | null) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  try {
    const res = await fetch("/api/common/user/profile_image_upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ imageBase64 }),
    });
    if (!res.ok) return;
    const img = document.querySelector<HTMLImageElement>("#me-avatar");
    if (img) {
      img.src = imageBase64;
    }
    if (name) {
      loadCustomProfileImage(name);
    }
  } catch {
    return;
  }
};

const setupProfileImagePicker = () => {
  const toggle = document.querySelector<HTMLAnchorElement>("#me-avatar-change");
  const picker = document.querySelector<HTMLDivElement>("#me-avatar-picker");
  const uploadInput = document.querySelector<HTMLInputElement>(
    "#me-avatar-upload",
  );
  const message = document.querySelector<HTMLDivElement>("#me-avatar-msg");
  if (!toggle || !picker) return;
  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    picker.classList.toggle("is-open");
  });
  picker.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const value = target.getAttribute("data-profile");
    if (value === null) return;
    const profileImage = value as ProfileImageKey;
    const isValid = PROFILE_IMAGES.some((item) => item.key === profileImage);
    if (!isValid) return;
    const accessToken = getStoredAccessToken();
    const name = accessToken ? decodeJwtPayload(accessToken)?.name ?? null : null;
    updateProfileImage(profileImage, name);
    picker.classList.remove("is-open");
  });
  if (uploadInput) {
    uploadInput.addEventListener("change", () => {
      const file = uploadInput.files?.[0];
      if (!file) return;
      if (message) message.textContent = "";
      const isPngType = file.type === "image/png";
      const isPngName = !file.type && file.name.toLowerCase().endsWith(".png");
      if (!isPngType && !isPngName) {
        if (message) message.textContent = word("profile_image_invalid_type");
        uploadInput.value = "";
        return;
      }
      const maxBytes = 1024 * 1024;
      if (file.size === 0 || file.size > maxBytes) {
        if (message) message.textContent = word("profile_image_too_large");
        uploadInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : null;
        if (!result) return;
        const accessToken = getStoredAccessToken();
        const name = accessToken ? decodeJwtPayload(accessToken)?.name ?? null : null;
        uploadProfileImage(result, name);
      };
      reader.readAsDataURL(file);
    });
  }
};

const setupRecentMatches = () => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return;
  const currentName = decodeJwtPayload(accessToken)?.name ?? null;
  fetch("/api/common/match_results?limit=10", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        setMatchesMessage(word("match_results_fetch_failed"));
        return;
      }
      const body = await res.json().catch(() => []);
      if (Array.isArray(body)) {
        renderMatches(body, currentName);
      } else {
        setMatchesMessage(word("match_results_fetch_failed"));
      }
    })
    .catch(() => {
      setMatchesMessage(word("match_results_fetch_failed"));
    });
};

export const MeRoute: Route = {
  linkLabel: "",
  content: () => new MeComponent().render(),
  onMount: () => {
    if (!getStoredAccessToken()) {
      navigate("/login");
      return;
    }
    const accessToken = getStoredAccessToken();
    const currentName = accessToken
      ? decodeJwtPayload(accessToken)?.name ?? null
      : null;
    if (currentName) loadProfileImage(currentName);
    setupTwoFactor();
    setupProfileImagePicker();
    setupRecentMatches();
    loadFriends();
    setupFriendActions();
    setupUserMenuLinks();
    setupUserSearch();
    setupLogout();
  },
  head: { title: "Me" },
};
