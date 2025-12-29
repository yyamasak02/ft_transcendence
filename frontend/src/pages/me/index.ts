import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import { navigate } from "@/router/router";
import "./style.css";

class MeComponent {
  render = () => {
    return `
      <div class="me-page">
        <h2 class="me-title">テスト</h2>
        <div class="me-section">
          <h3 class="me-section-title">${word("two_factor")}</h3>
          <p class="me-section-desc">${word("two_factor_desc")}</p>
          <button class="me-2fa" id="me-2fa">${word("two_factor_enable")}</button>
          <div class="me-qr" id="me-qr"></div>
          <p class="me-2fa-msg" id="me-2fa-msg"></p>
        </div>
        <button class="me-logout" id="me-logout">ログアウト</button>
      </div>
    `;
  };
}

const ACCESS_TOKEN_KEY = "accessToken";
const LONG_TERM_TOKEN_KEY = "longTermToken";

const decodeJwtPayload = (token: string) => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload as { puid?: string; name?: string };
  } catch {
    return null;
  }
};

const setTwoFactorMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#me-2fa-msg");
  if (el) el.textContent = message;
};

const renderQr = (data: string) => {
  const container = document.querySelector<HTMLDivElement>("#me-qr");
  if (!container) return;
  const size = 200;
  const src =
    "https://api.qrserver.com/v1/create-qr-code/?" +
    `size=${size}x${size}&data=${encodeURIComponent(data)}`;
  container.innerHTML = `
    <img src="${src}" alt="2FA QR" width="${size}" height="${size}" />
    <div class="me-qr-token">${data}</div>
  `;
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
        body: "{}",
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
    } catch (error) {
      setTwoFactorMsg(`${word("two_factor_failed")}: ${error}`);
    } finally {
      button.disabled = false;
    }
  });
};

const setupLogout = () => {
  const button = document.querySelector<HTMLButtonElement>("#me-logout");
  if (!button) return;
  button.addEventListener("click", async () => {
    await revokeLongTermToken();
    clearTokens();
    navigate("/");
  });
};

export const MeRoute: Record<string, Route> = {
  "/me": {
    linkLabel: "",
    content: () => new MeComponent().render(),
    onMount: () => {
      setupTwoFactor();
      setupLogout();
    },
    head: { title: "Me" },
  },
};
