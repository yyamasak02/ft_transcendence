import type { Route } from "@/types/routes";
import { langManager, word, t, i18nAttr } from "@/i18n";
import { navigate } from "@/router";
import { ACCESS_TOKEN_KEY, LONG_TERM_TOKEN_KEY } from "@/constants/auth";
import { decodeJwtPayload } from "@/utils/jwt";
import { getStoredAccessToken } from "@/utils/token-storage";
import { getCurrentPath, setReturnTo } from "@/router";
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
import type { I18nKey } from "@/i18n/lang";
import { escapeHtml } from "@/utils/escape";

const UPLOAD_IMAGE_SIZE = 256;

class MeComponent {
  render = () => {
    const accessToken = getStoredAccessToken();
    const currentName = accessToken
      ? (decodeJwtPayload(accessToken)?.name ?? null)
      : null;
    const safeCurrentName = currentName ? escapeHtml(currentName) : "";
    const pickerItems = PROFILE_IMAGES.map((item) => {
    const imgSrc = getProfileImageSrc(item.key);
      return `
        <button type="button" 
                data-profile="${item.key}" 
                class="
                  group relative w-12 h-12
                  rounded-lg border-2 border-slate-800
                  hover:border-blue-500 overflow-hidden transition-all
                  bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <img src="${imgSrc}" 
              alt="${item.label}" 
              class="w-full h-full object-cover pointer-events-none" 
              onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <span class="hidden text-[10px] text-slate-500">${item.label[0]}</span>
        </button>`;
    }).join("");

    return `
      <div class="
            w-full flex overflow-x-auto snap-x snap-mandatory snap-stop-always
            scrollbar-width:none -ms-overflow-style:none
            md:grid md:grid-cols-[repeat(3,minmax(0,1fr))] md:overflow-visible md:flex-none
            gap-4 lg:gap-8 lg:p-8 text-white">
        
        <div class="w-screen shrink-0 snap-center flex flex-col items-center gap-6 
                    md:w-full md:min-w-0 md:shrink">
          
          <form id="me-user-search" class="flex flex-row gap-2 w-full">
            <input type="text" name="username"
                   class="flex-[5] min-w-0 flex-1 py-2 px-3 bg-slate-900
                          border border-slate-700 rounded-md text-slate-100
                          focus:outline-none focus:border-blue-500
                          transition-all text-sm"
                          ${i18nAttr("placeholder", "user_search_placeholder")} required />
            <button type="submit"
                    class="flex-[1] shrink-0 py-2 px-4 bg-slate-800 text-slate-100
                           border border-slate-700 rounded-md
                           hover:bg-slate-700 hover:border-slate-600
                           transition-colors cursor-pointer text-sm font-bold">
              ${t("user_search_button")}
            </button>
            <p
              id="me-user-search-msg"
              class="mt-2 min-h-[1.5rem] text-sm text-red-400">
            </p>
          </form>

          <h2 class="text-2xl font-bold tracking-wider text-center">${safeCurrentName}</h2>
          
          <img
            id="me-avatar"
            class="
              w-40 h-40 object-cover
              border border-slate-800 rounded-lg
              hover:opacity-80 hover:border-blue-500
              cursor-pointer transition-all
            "
            src="${getProfileImageSrc(DEFAULT_PROFILE_IMAGE)}" alt="Profile image"
          />

          <div id="me-avatar-picker"
               class="hidden flex-col items-center mt-2 gap-4 p-4
                      bg-slate-900/60 rounded-lg border border-slate-800 w-full max-w-[240px]">
            <div class="grid grid-cols-3 gap-4 justify-items-center">
              ${pickerItems}
              <label class="w-12 h-12 flex items-center justify-center bg-slate-800
                            border-2 border-dashed border-slate-600 rounded-full
                            cursor-pointer
                            hover:bg-slate-700 hover:border-blue-500 transition-all shadow-lg">
                <input type="file" id="me-avatar-upload" class="hidden" accept="image/png" />
                <svg xmlns="http://www.w3.org/2000/svg"
                     class="w-5 h-5 text-slate-400"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </label>
            </div>
          </div>
          <div id="me-avatar-msg" class="text-xs text-slate-500 text-center"></div>

          <div class="p-5 border border-slate-800 bg-slate-900/40 rounded-xl w-full">
            <h3
              class="
                text-base font-semibold
                mb-3 tracking-wide uppercase text-slate-300
                text-center md:text-left
              "
            >
              ${t("two_factor")}
            </h3>
            <button
              id="me-2fa"
              class="
                w-full py-2 px-3.5
                bg-slate-800
                text-slate-100 font-semibold text-sm
                border border-slate-700 rounded-md
                cursor-pointer
                hover:bg-slate-700 transition-colors">
              ${t("two_factor_enable")}
            </button>
            <div
              id="me-qr"
              class="mt-3 flex flex-col items-center gap-2.5"
            ></div>
            <div
              id="me-2fa-msg"
              class="mt-2 text-xs text-slate-500 text-center"
            ></div>
          </div>

          <div class="p-5 border border-slate-800 bg-slate-900/40 rounded-xl w-full">
            <h3
              class="
                text-base font-semibold mb-3
                tracking-wide uppercase text-slate-300 text-center
                md:text-left
              "
            >
              ${t("username_change")}
            </h3>
            <a href="/username-change" data-nav class="inline-block w-full text-center py-2.5 bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-colors rounded-md font-semibold text-sm no-underline">
              ${t("username_change_action")}
            </a>
          </div>

          <button id="me-logout" class="mt-4 mb-40 md:mb-10 py-3 px-4 bg-red-950/20 text-red-500 border border-red-900/30 hover:bg-red-900/30 transition-all rounded-md font-bold text-sm cursor-pointer uppercase tracking-widest w-full">
            ${t("logout")}
          </button>
        </div>

        <div class="min-w-full shrink-0 snap-center bg-slate-900/20 p-6 border border-slate-900 rounded-2xl 
                    md:w-full md:min-w-0 md:shrink">
          <h3 class="text-lg font-bold mb-5 border-b border-slate-800 pb-3 flex justify-between items-end">
            ${t("match_results")}
            <span id="me-matches-summary" class="text-[10px] text-slate-500 font-mono font-normal"></span>
          </h3>
          <div id="me-matches" class="flex flex-col gap-3"></div>
        </div> 

        <div class="min-w-full shrink-0 snap-center bg-slate-900/20 p-6 border border-slate-900 rounded-2xl 
                    md:w-full md:min-w-0 md:shrink">
          <h3 class="text-lg font-bold mb-5 border-b border-slate-800 pb-3">${t("friends")}</h3>
          <div id="me-friends-list" class="flex flex-col gap-3"></div>
        </div>
      </div>
    `;
  };
}

const setTwoFactorMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#me-2fa-msg");
  if (el) el.textContent = message;
};

// NOTE:
// 2FA secret は実際に使用する（Stateとして保持）。
// QRコード表示用コンテナ (#me-qr) は将来のUI実装向け。
// 現在の画面ではUI未実装のため、表示処理はスキップする。
const renderTwoFactorSecret = (secret: string) => {
  const container = document.querySelector<HTMLDivElement>("#me-qr");
  if (!container) return;
  container.innerHTML = `
    <div class="w-full p-3 bg-black border border-slate-800 rounded font-mono text-[11px] break-all text-blue-400 text-center">
      ${secret}
    </div>
    <button type="button" class="me-qr-copy w-full py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors cursor-pointer text-sm font-bold">
      COPY KEY
    </button>
    <div class="me-qr-copy-msg text-[10px] text-slate-500 italic" aria-live="polite"></div>
  `; 
  const copyButton = container.querySelector<HTMLButtonElement>(".me-qr-copy");
  const copyMsg = container.querySelector<HTMLDivElement>(".me-qr-copy-msg");
  if (!copyButton) return;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(secret);
      if (copyMsg) copyMsg.textContent = word("copied");
    } catch {
      if (copyMsg) copyMsg.textContent = word("failed");
    }
  });
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
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    setTwoFactorMsg(word("two_factor_missing_login"));
    button.disabled = true;
    setReturnTo(getCurrentPath());
    navigate("/login");
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
      if (!res.ok) {
        if (res.status === 401) {
          setReturnTo(getCurrentPath());
          navigate("/login");
        }
        return;
      }
      if (body?.enabled) {
        button.disabled = true;
        button.style.display = "none";
        setTwoFactorMsg(word("two_factor_already_enabled"));
      }
    })
    .catch(() => null);

  button.addEventListener("click", async () => {
    setTwoFactorMsg("");
    const currentToken = getStoredAccessToken();
    if (!currentToken) {
      setTwoFactorMsg(word("two_factor_missing_login"));
      setReturnTo(getCurrentPath());
      navigate("/login");
      return;
    }
    const payload = decodeJwtPayload(currentToken);
    if (!payload?.name) {
      setTwoFactorMsg(word("two_factor_missing_login"));
      setReturnTo(getCurrentPath());
      navigate("/login");
      return;
    }
    button.disabled = true;
    try {
      const res = await fetch("/api/common/user/enable_2fa", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTwoFactorMsg(
          body?.message ??
            `${word("two_factor_failed")} (status ${res.status})`,
        );
        if (res.status === 401) {
          setReturnTo(getCurrentPath());
          navigate("/login");
        }
        return;
      }
      const token = String(body.token ?? "");
      if (!token) {
        setTwoFactorMsg(word("two_factor_failed"));
        return;
      }
      renderTwoFactorSecret(token);
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

  const setMsg = (key: I18nKey) => {
    if (!message) return;
    message.innerHTML = t(key);
  };
  const clearMsg = () => {
    if (!message) return;
    message.textContent = "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMsg();
    if (message) message.textContent = "";
    const formData = new FormData(form);
    const name = String(formData.get("username") ?? "").trim();
    if (!name) return;
    const accessToken = getStoredAccessToken();
    const currentName = accessToken
      ? (decodeJwtPayload(accessToken)?.name ?? "")
      : "";
    if (currentName && currentName.toLowerCase() === name.toLowerCase()) {
      setMsg("user_search_self");
      return;
    }
    if (!accessToken) {
      setReturnTo(getCurrentPath());
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
        setMsg("user_profile_not_found");
        return;
      }
      if (!res.ok) {
        setMsg("user_search_failed");
        return;
      }
      navigate(`/user?name=${encodeURIComponent(name)}`);
    } catch (error) {
      console.error("User search failed", error);
      setMsg("user_search_failed");
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
    row.className = "flex gap-2.5 items-center p-2 px-2.5 border border-slate-800 bg-slate-900/40 rounded-md";

    const avatar = document.createElement("img");
    avatar.className = "w-10 h-10 rounded-md object-cover border border-slate-700";
    avatar.alt = word("profile_image_alt");
    if (item.profileImage && isProfileImageKey(item.profileImage)) {
      avatar.src = getProfileImageSrc(item.profileImage);
    } else {
      avatar.src = getProfileImageSrc(DEFAULT_PROFILE_IMAGE);
      loadFriendCustomImage(item.name, avatar);
    }

    const info = document.createElement("div");
    info.className = "flex flex-col gap-0.5 flex-1 min-w-0";

    const nameLink = document.createElement("a");
    nameLink.className = "text-slate-100 text-sm no-underline hover:underline truncate";
    nameLink.href = `/user?name=${encodeURIComponent(item.name)}`;
    nameLink.textContent = item.name;
    nameLink.setAttribute("data-name", item.name);

    const status = document.createElement("div");
    const statusColor = item.online ? "text-blue-400" : "text-slate-500";
    status.className = `text-[11px] ${statusColor}`;
    if (item.status === "accepted") {
      status.textContent = item.online
        ? word("user_profile_online")
        : word("user_profile_offline");
      // status.classList.toggle("is-online", item.online);
      // status.classList.toggle("is-offline", !item.online);
    } else if (item.status === "pending_incoming") {
      status.textContent = word("friend_status_pending_incoming");
    } else {
      status.textContent = word("friend_status_pending_outgoing");
    }

    info.append(nameLink, status);

    const actions = document.createElement("div");
    actions.className = "flex gap-1.5";
    if (item.status === "pending_incoming") {
      const accept = document.createElement("button");
      const buttonClass = "py-1 px-2 bg-slate-800 text-slate-200 border border-slate-600 rounded cursor-pointer text-[11px] hover:bg-slate-700 transition-colors";
      accept.type = "button";
      accept.className = buttonClass;
      accept.textContent = word("friend_accept");
      accept.setAttribute("data-id", String(item.id));
      accept.setAttribute("data-action", "accept");

      const decline = document.createElement("button");
      decline.type = "button";
      decline.className = buttonClass;
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
  if (!accessToken) {
    setReturnTo(getCurrentPath());
    navigate("/login");
    return;
  }
  try {
    const res = await fetch("/api/common/user/friends", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        setReturnTo(getCurrentPath());
        navigate("/login");
      }
      return;
    }
    const body = await res.json().catch(() => ({}));
    const items = Array.isArray(body?.friends) ? body.friends : [];
    const sorted = [...items].sort((a, b) => {
      if (a.status === "accepted" && b.status === "accepted") {
        if (a.online === b.online) return 0;
        return a.online ? -1 : 1;
      }
      if (a.status === "accepted") return -1;
      if (b.status === "accepted") return 1;
      if (a.status === "pending_incoming" && b.status === "pending_outgoing")
        return -1;
      if (a.status === "pending_outgoing" && b.status === "pending_incoming")
        return 1;
      return 0;
    });
    renderFriends(sorted as FriendItem[]);
  } catch {
    return;
  }
};

const respondFriendRequest = async (requestId: number, accept: boolean) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    setReturnTo(getCurrentPath());
    navigate("/login");
    return;
  }
  const res = await fetch("/api/common/user/friends/respond", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ requestId, accept }),
  }).catch(() => null);
  if (res?.status === 401) {
    setReturnTo(getCurrentPath());
    navigate("/login");
    return;
  }
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

const MATCH_RESULT_CONFIG = {
  win: {
    symbol: "●",
  },
  lose: {
    symbol: "○",
  },
} as const;

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
    container.innerHTML = `<div class="me-no-matches">${word("no_matches")}</div>`;
    return;
  }
  let wins = 0;
  let losses = 0;

  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    const isOwner = currentName ? item.ownerName === currentName : true;
    const opponent = isOwner
      ? (item.guestName ?? word("unknown_user"))
      : (item.ownerName ?? word("unknown_user"));
    const safeOpponent = escapeHtml(opponent);
    const myScore = isOwner ? item.ownerScore : item.guestScore;
    const oppScore = isOwner ? item.guestScore : item.ownerScore;
    const isWin = myScore > oppScore;

    if (isWin) {
      wins += 1;
    } else {
      losses += 1;
    }

    const formattedDate = formatMatchDateByLang(item.createdAt);

    const { symbol } = isWin
      ? MATCH_RESULT_CONFIG.win
      : MATCH_RESULT_CONFIG.lose;

    const resultText = isWin ? t("result_win") : t("result_lose"); 

    const baseClass = `
      flex items-center gap-4 rounded-lg border
      px-4 py-3 bg-slate-900/40 border-slate-700/80
    `;
    const rowStatusClass = isWin
      ? "border-l-4 border-l-emerald-500"
      : "border-l-4 border-l-rose-500 opacity-80";

    row.className = `${baseClass} ${rowStatusClass}`;

    row.innerHTML = `
      <div class="flex flex-col items-center justify-center gap-1 shrink-0">
        <span class="mt-0.5 text-xl text-slate-100 leading-none">${symbol}</span>
        <span class="text-xs font-semibold text-slate-400 tracking-tight">${resultText}</span>
      </div>
      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="text-base font-semibold text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">${safeOpponent}</div>
        <div class="text-xs text-slate-500 mt-0.5">${formattedDate}</div>
      </div>
      <div class="flex items-center gap-2 font-mono font-semibold text-xl ml-4">
        <span class="min-w-[20px] text-white">${myScore}</span>
        <span class="text-slate-600 text-base">-</span>
        <span class="min-w-[20px] text-slate-500">${oppScore}</span>
      </div>
    `;

    container.appendChild(row);
  });
  if (summary) {
    summary.textContent = `${word("match_summary")} ${wins}W - ${losses}L`;
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
  if (!accessToken) {
    setReturnTo(getCurrentPath());
    navigate("/login");
    return;
  }
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
  if (!accessToken) {
    setReturnTo(getCurrentPath());
    navigate("/login");
    return;
  }
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
    if (!res.ok) {
      if (res.status === 401) {
        setReturnTo(getCurrentPath());
        navigate("/login");
      }
      return;
    }
    const body = await res.json().catch(() => ({}));
    const profileImage = body?.profileImage ?? null;
    const profileImageKey =
      typeof profileImage === "string" ? profileImage : null;
    setProfileImage(profileImageKey, name);
  } catch {
    return;
  }
};

const updateProfileImage = async (
  profileImage: ProfileImageKey,
  name: string | null,
) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    setReturnTo(getCurrentPath());
    navigate("/login");
    return;
  }
  try {
    const res = await fetch("/api/common/user/profile_image", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ profileImage }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        setReturnTo(getCurrentPath());
        navigate("/login");
      }
      return;
    }
    setProfileImage(profileImage, name);
  } catch {
    return;
  }
};

const uploadProfileImage = async (imageBase64: string, name: string | null) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    setReturnTo(getCurrentPath());
    navigate("/login");
    return;
  }
  try {
    const res = await fetch("/api/common/user/profile_image_upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ imageBase64 }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        setReturnTo(getCurrentPath());
        navigate("/login");
      }
      return;
    }

    // upload成功後
    const picker = document.querySelector<HTMLDivElement>("#me-avatar-picker");
    if (picker) {
      picker.classList.add("hidden");
    }
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
  const avatarImg = document.querySelector<HTMLImageElement>("#me-avatar");
  const picker = document.querySelector<HTMLDivElement>("#me-avatar-picker");
  const uploadInput =
    document.querySelector<HTMLInputElement>("#me-avatar-upload");
  const message = document.querySelector<HTMLDivElement>("#me-avatar-msg");

  if (!avatarImg || !picker || !uploadInput) return;
  if (picker.dataset.bound === "1") return;

  picker.dataset.bound = "1";

  const closePicker = () => { picker.classList.add("hidden"); };
  const togglePicker = () => { picker.classList.toggle("hidden"); };

  avatarImg.addEventListener("click", togglePicker);
  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    if (picker.contains(target) || avatarImg.contains(target)) return;
    closePicker();
  })

  picker.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const value = target.getAttribute("data-profile");
    if (value === null) return;
    const profileImage = value as ProfileImageKey;
    const isValid = PROFILE_IMAGES.some((item) => item.key === profileImage);
    if (!isValid) return;
    const accessToken = getStoredAccessToken();
    const name = accessToken
      ? (decodeJwtPayload(accessToken)?.name ?? null)
      : null;
    updateProfileImage(profileImage, name);
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
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            if (message) {
              message.textContent = word("profile_image_invalid_type");
            }
            uploadInput.value = "";
            return;
          }

          canvas.width = UPLOAD_IMAGE_SIZE;
          canvas.height = UPLOAD_IMAGE_SIZE;

          const minSize = Math.min(img.width, img.height);
          const sx = (img.width - minSize) / 2;
          const sy = (img.height - minSize) / 2;

          ctx.drawImage(
            img,
            sx,
            sy,
            minSize,
            minSize,
            0,
            0,
            UPLOAD_IMAGE_SIZE,
            UPLOAD_IMAGE_SIZE,
          );

          const resizedDataUrl = canvas.toDataURL("image/png");

          const accessToken = getStoredAccessToken();
          const name = accessToken
            ? (decodeJwtPayload(accessToken)?.name ?? null)
            : null;
          uploadProfileImage(resizedDataUrl, name);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
  }
};

const setupRecentMatches = () => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    setReturnTo(getCurrentPath());
    navigate("/login");
    return;
  }
  const currentName = decodeJwtPayload(accessToken)?.name ?? null;
  fetch("/api/common/match_results?limit=10", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 401) {
          setReturnTo(getCurrentPath());
          navigate("/login");
          return;
        }
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
      setReturnTo(getCurrentPath());
      navigate("/login");
      return;
    }
    const accessToken = getStoredAccessToken();
    const currentName = accessToken
      ? (decodeJwtPayload(accessToken)?.name ?? null)
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
