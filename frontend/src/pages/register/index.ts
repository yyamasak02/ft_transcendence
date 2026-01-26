// src/pages/register/index.ts
import type { Route } from "@/types/routes";
import type { Component } from "@/types/component";
import { word, t } from "@/i18n";
import { navigate } from "@/router";
import { GOOGLE_ID_TOKEN_KEY, GOOGLE_LONG_TERM_KEY } from "@/constants/auth";
import {
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  EMAIL_PATTERN,
  USERNAME_ROMAN_PATTERN,
} from "@/constants/validation";
import { storeTokens } from "@/utils/token-storage";
import { loadGsi } from "@/utils/google-auth";
import { clearReturnTo, getReturnTo } from "@/router";
import "./style.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_BASE = "/api/common";

// TODO 新規登録機能を実装する
class RegisterComponent implements Component {
  render = () => {
    return `
            <div class="register-screen">
							<div class="register-box">
								<h2 class="register-title">${t("signup")}</h2>

								<form class="register-form" id="register_form">
									<div class="register-field">
											<label for="email">${t("email")}</label>
											<input
											type="email"
											id="email"
											name="email"
											placeholder="you@example.com"
											required
											class="register-input"
											/>
									</div>

									<div class="register-field">
											<label for="username">${t("username")}</label>
											<input
											type="text"
											id="username"
											name="username"
											placeholder="yourname"
											required
											class="register-input"
											/>
									</div>

									<div class="register-field">
											<label for="password">${t("password")}</label>
											<input
											type="password"
											id="password"
											name="password"
											placeholder="••••••••"
											required
											class="register-input"
											/>
									</div>

									<div class="register-field">
											<label for="password">${t("password_confirm")}</label>
											<input
											type="password"
											id="password_confirm"
											name="password_confirm"
											placeholder="••••••••"
											required
											class="register-input"
											/>
									</div>

									<button type="submit" class="register-submit">${t("register")}</button>

									<div class="register-footer">
										<a class="register-link" href="/login">${t("to_login")}</a>
									</div>

									<div class="register-footer">
										<a class="register-link" href="/">${t("home_return")}</a>
									</div>

									<div class="register-divider">
										<span>${t("other_signup_methods")}</span>
									</div>

									<div class="register-alt">
										<div id="google-btn-register" class="register-google-btn"></div>
										<p id="google-msg" class="register-google-msg"></p>
									</div>

									<p id="register-msg" class="register-msg"></p>
								</form>
							</div>
            </div>
        `;
  };
}

const setRegisterMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#register-msg");
  if (el) el.textContent = message;
};

const setGoogleMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#google-msg");
  if (el) el.textContent = message;
};

const storePendingGoogleSignup = (idToken: string, longTerm: boolean) => {
  sessionStorage.setItem(GOOGLE_ID_TOKEN_KEY, idToken);
  sessionStorage.setItem(GOOGLE_LONG_TERM_KEY, longTerm ? "1" : "0");
};

const handleGoogleCredential = async (credential: string) => {
  setGoogleMsg(word("google_login_processing"));
  try {
    const returnTo = getReturnTo();
    const res = await fetch(`${API_BASE}/user/google_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential, longTerm: false }),
    });
    const body = await res.json().catch(() => ({}));
    if (body?.requiresSignup || res.status === 404) {
      storePendingGoogleSignup(credential, false);
      navigate("/google-signup");
      return;
    }
    if (!res.ok) {
      setGoogleMsg(
        body?.message ??
          `${word("google_login_failed")} (status ${res.status})`,
      );
      return;
    }
    storeTokens(body.accessToken, body.longTermToken);
    setGoogleMsg(word("google_login_success"));
    clearReturnTo();
    navigate(returnTo);
  } catch (error) {
    setGoogleMsg(`${word("google_login_error")}: ${error}`);
  }
};

const setupGoogleRegister = async () => {
  if (!GOOGLE_CLIENT_ID) {
    setGoogleMsg(word("google_client_id_missing"));
    return;
  }
  const google = await loadGsi().catch((err) => {
    setGoogleMsg(`${word("google_script_load_failed")}: ${err}`);
    return null;
  });
  if (!google?.accounts?.id) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: ({ credential }) => {
      if (credential) handleGoogleCredential(credential);
    },
  });
  google.accounts.id.renderButton(
    document.getElementById("google-btn-register"),
    {
      theme: "outline",
      size: "large",
      type: "standard",
      text: "continue_with",
    },
  );
};

const setupRegisterForm = () => {
  const form = document.querySelector<HTMLFormElement>("#register_form");
  const submitButton =
    form?.querySelector<HTMLButtonElement>(".register-submit");
  const toLoginLink = document.querySelector<HTMLAnchorElement>(
    ".register-link[href='/login']",
  );
  const toHomeLink = document.querySelector<HTMLAnchorElement>(
    ".register-link[href='/']",
  );

  if (toLoginLink) {
    toLoginLink.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("/login");
    });
  }

  if (toHomeLink) {
    toHomeLink.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("/");
    });
  }

  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setRegisterMsg("");

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("password_confirm") ?? "");

    if (!email || !name || !password || !confirm) {
      setRegisterMsg(word("register_required"));
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setRegisterMsg(word("email_invalid"));
      return;
    }
    if (name.length < MIN_USERNAME_LENGTH) {
      setRegisterMsg(word("username_min_length"));
      return;
    }
    if (!USERNAME_ROMAN_PATTERN.test(name)) {
      setRegisterMsg(word("username_roman_only"));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setRegisterMsg(word("password_min_length"));
      return;
    }
    if (password !== confirm) {
      setRegisterMsg(word("password_mismatch"));
      return;
    }

    if (submitButton) submitButton.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setRegisterMsg(word("username_taken"));
        return;
      }
      if (!res.ok) {
        setRegisterMsg(
          body?.message ?? `${word("register_failed")} (status ${res.status})`,
        );
        return;
      }
      setRegisterMsg(word("register_success"));
      navigate("/login");
    } catch (error) {
      setRegisterMsg(`${word("register_error")}: ${error}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};

export const RegisterRoute: Route = {
  linkLabel: () => word("signup"),
  content: () => new RegisterComponent().render(),
  onMount: () => {
    setupRegisterForm();
    setupGoogleRegister();
  },
};
