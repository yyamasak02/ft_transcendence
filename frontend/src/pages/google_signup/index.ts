import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import { navigate } from "@/router";
import { GOOGLE_ID_TOKEN_KEY, GOOGLE_LONG_TERM_KEY } from "@/constants/auth";
import {
  MIN_USERNAME_LENGTH,
  USERNAME_ROMAN_PATTERN,
} from "@/constants/validation";
import { storeTokens } from "@/utils/token-storage";
import "./style.css";

const API_BASE = "/api/common";

class GoogleSignupComponent {
  render = () => {
    return `
      <div class="google-signup-screen">
        <div class="google-signup-box">
          <h2 class="google-signup-title">${word("google_signup")}</h2>
          <p class="google-signup-desc">${word("google_signup_desc")}</p>

          <form class="google-signup-form" id="google-signup-form">
            <div class="google-signup-field">
              <label for="username">${word("username")}</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="yourname"
                required
                class="google-signup-input"
              />
            </div>

            <div class="google-signup-remember">
              <input type="checkbox" id="remember" name="remember" />
              <label for="remember">${word("keep_login")}</label>
            </div>

            <button type="submit" class="google-signup-submit">
              ${word("register")}
            </button>

            <div class="google-signup-footer">
              <a class="google-signup-link" href="/login">
                ${word("to_login")}
              </a>
            </div>

            <p id="google-signup-msg" class="google-signup-msg"></p>
          </form>
        </div>
      </div>
    `;
  };
}

const setGoogleSignupMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#google-signup-msg");
  if (el) el.textContent = message;
};

const getPendingGoogleSignup = () => {
  const idToken = sessionStorage.getItem(GOOGLE_ID_TOKEN_KEY);
  if (!idToken) return null;
  const longTerm = sessionStorage.getItem(GOOGLE_LONG_TERM_KEY) === "1";
  return { idToken, longTerm };
};

const clearPendingGoogleSignup = () => {
  sessionStorage.removeItem(GOOGLE_ID_TOKEN_KEY);
  sessionStorage.removeItem(GOOGLE_LONG_TERM_KEY);
};

const setupGoogleSignupForm = () => {
  const form = document.querySelector<HTMLFormElement>("#google-signup-form");
  const submitButton = form?.querySelector<HTMLButtonElement>(
    ".google-signup-submit",
  );
  const rememberInput = form?.querySelector<HTMLInputElement>("#remember");
  const toLoginLink = document.querySelector<HTMLAnchorElement>(
    ".google-signup-link[href='/login']",
  );

  if (toLoginLink) {
    toLoginLink.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("/login");
    });
  }

  if (!form) return;
  const pending = getPendingGoogleSignup();
  if (!pending) {
    setGoogleSignupMsg(word("google_signup_missing"));
    form.querySelectorAll("input, button").forEach((el) => {
      (el as HTMLInputElement | HTMLButtonElement).disabled = true;
    });
    return;
  }

  if (rememberInput) rememberInput.checked = pending.longTerm;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setGoogleSignupMsg("");

    const formData = new FormData(form);
    const name = String(formData.get("username") ?? "").trim();
    const longTerm = Boolean(formData.get("remember"));

    if (!name) {
      setGoogleSignupMsg(word("username_required"));
      return;
    }
    if (name.length < MIN_USERNAME_LENGTH) {
      setGoogleSignupMsg(word("username_min_length"));
      return;
    }
    if (!USERNAME_ROMAN_PATTERN.test(name)) {
      setGoogleSignupMsg(word("username_roman_only"));
      return;
    }

    if (submitButton) submitButton.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/user/google_register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: pending.idToken,
          name,
          longTerm,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setGoogleSignupMsg(word("username_taken"));
        return;
      }
      if (!res.ok) {
        setGoogleSignupMsg(
          body?.message ??
            `${word("google_signup_failed")} (status ${res.status})`,
        );
        return;
      }
      storeTokens(body.accessToken, body.longTermToken);
      clearPendingGoogleSignup();
      navigate("/");
    } catch (error) {
      setGoogleSignupMsg(`${word("register_error")}: ${error}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};

export const GoogleSignupRoute: Route = {
  linkLabel: "",
  content: () => new GoogleSignupComponent().render(),
  onMount: setupGoogleSignupForm,
  head: { title: "Google Signup" },
};
