import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import { navigate } from "@/router/router";
import {
  ACCESS_TOKEN_KEY,
  LONG_TERM_TOKEN_KEY,
} from "@/constants/auth";
import "./style.css";
import { decodeJwtPayload } from "@/utils/jwt";
import { getStoredAccessToken } from "@/utils/token-storage";

class MeComponent {
  render = () => {
    return `
      <div class="me-layout">
        <div class="me-page">
          <h2 class="me-title">${word("user_menu")}</h2>
        <div class="me-section">
          <h3 class="me-section-title">${word("two_factor")}</h3>
          <p class="me-section-desc">${word("two_factor_desc")}</p>
          <button class="me-2fa" id="me-2fa">${word("two_factor_enable")}</button>
          <div class="me-qr" id="me-qr"></div>
          <p class="me-2fa-msg" id="me-2fa-msg"></p>
        </div>
        <div class="me-section">
          <h3 class="me-section-title">${word("username_change")}</h3>
          <p class="me-section-desc">${word("username_change_desc")}</p>
          <a class="me-link" href="/username-change" data-nav>
            ${word("username_change_action")}
          </a>
        </div>
        <button class="me-logout" id="me-logout">ログアウト</button>
        </div>
        <div class="me-side">
          <h3 class="me-side-title">${word("match_results")}</h3>
          <div class="me-matches" id="me-matches"></div>
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
          body?.message ?? `${word("two_factor_failed")} (status ${res.status})`,
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
  if (!container) return;
  if (!items.length) {
    container.textContent = word("no_matches");
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "me-match";
    const isOwner = currentName ? item.ownerName === currentName : true;
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
    const date = new Date(item.createdAt);
    const formattedDate = Number.isNaN(date.getTime())
      ? item.createdAt
      : date.toLocaleString();
    row.textContent = `${result} | ${opponent} | ${score} | ${formattedDate}`;
    container.appendChild(row);
  });
};

const setMatchesMessage = (message: string) => {
  const container = document.querySelector<HTMLDivElement>("#me-matches");
  if (!container) return;
  container.textContent = message;
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

export const MeRoute: Record<string, Route> = {
  "/me": {
    linkLabel: "",
    content: () => new MeComponent().render(),
    onMount: () => {
      if (!getStoredAccessToken()) {
        navigate("/login");
        return;
      }
      setupTwoFactor();
      setupRecentMatches();
      setupUserMenuLinks();
      setupLogout();
    },
    head: { title: "Me" },
  },
};
