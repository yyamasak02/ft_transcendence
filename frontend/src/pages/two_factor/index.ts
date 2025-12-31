import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import { navigate } from "@/router";
import {
  TWO_FACTOR_LONG_TERM_KEY,
  TWO_FACTOR_TOKEN_KEY,
} from "@/constants/auth";
import { storeTokens } from "@/utils/token-storage";
import "./style.css";

const API_BASE = "/api/common";

class TwoFactorComponent {
  render = () => {
    return `
      <div class="two-factor-screen">
        <div class="two-factor-box">
          <h2 class="two-factor-title">${word("two_factor_title")}</h2>
          <p class="two-factor-desc">${word("two_factor_prompt")}</p>
          <form class="two-factor-form" id="two-factor-form">
            <div class="two-factor-field">
              <label for="code">${word("two_factor_code")}</label>
              <input
                type="text"
                id="code"
                name="code"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="123456"
                required
                class="two-factor-input"
              />
            </div>
            <button type="submit" class="two-factor-submit">
              ${word("two_factor_verify")}
            </button>
            <div class="two-factor-footer">
              <a class="two-factor-link" href="/login">
                ${word("to_login")}
              </a>
            </div>
            <p id="two-factor-msg" class="two-factor-msg"></p>
          </form>
        </div>
      </div>
    `;
  };
}

const setTwoFactorMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#two-factor-msg");
  if (el) el.textContent = message;
};

const getTwoFactorToken = () => sessionStorage.getItem(TWO_FACTOR_TOKEN_KEY);
const getTwoFactorLongTerm = () =>
  sessionStorage.getItem(TWO_FACTOR_LONG_TERM_KEY) === "1";

const clearTwoFactorState = () => {
  sessionStorage.removeItem(TWO_FACTOR_TOKEN_KEY);
  sessionStorage.removeItem(TWO_FACTOR_LONG_TERM_KEY);
};

const setupTwoFactorForm = () => {
  const form = document.querySelector<HTMLFormElement>("#two-factor-form");
  const submitButton =
    form?.querySelector<HTMLButtonElement>(".two-factor-submit");
  const toLoginLink = document.querySelector<HTMLAnchorElement>(
    ".two-factor-link[href='/login']",
  );

  if (toLoginLink) {
    toLoginLink.addEventListener("click", (event) => {
      event.preventDefault();
      clearTwoFactorState();
      navigate("/login");
    });
  }

  const twoFactorToken = getTwoFactorToken();
  if (!form || !twoFactorToken) {
    setTwoFactorMsg(word("two_factor_missing"));
    form?.querySelectorAll("input, button").forEach((el) => {
      (el as HTMLInputElement | HTMLButtonElement).disabled = true;
    });
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setTwoFactorMsg("");
    const formData = new FormData(form);
    const code = String(formData.get("code") ?? "").trim();
    if (!code) {
      setTwoFactorMsg(word("two_factor_code_required"));
      return;
    }
    if (submitButton) submitButton.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/user/verify_2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twoFactorToken,
          code,
          longTerm: getTwoFactorLongTerm(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTwoFactorMsg(
          body?.message ??
            `${word("two_factor_verify_failed")} (status ${res.status})`,
        );
        return;
      }
      if (!body?.accessToken) {
        setTwoFactorMsg(word("two_factor_verify_failed"));
        return;
      }
      storeTokens(body.accessToken, body.longTermToken);
      clearTwoFactorState();
      navigate("/");
    } catch (error) {
      setTwoFactorMsg(`${word("two_factor_verify_failed")}: ${error}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};

export const TwoFactorRoute: Route = {
  linkLabel: "",
  content: () => new TwoFactorComponent().render(),
  onMount: setupTwoFactorForm,
  head: { title: "Two-Factor" },
};
