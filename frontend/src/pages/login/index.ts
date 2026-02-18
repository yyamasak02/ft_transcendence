import type { Route } from "@/types/routes";
import type { Component } from "@/types/component";
import { t, word } from "@/i18n";
import { navigate } from "@/router";
import {
  GOOGLE_ID_TOKEN_KEY,
  GOOGLE_LONG_TERM_KEY,
  TWO_FACTOR_LONG_TERM_KEY,
  TWO_FACTOR_TOKEN_KEY,
} from "@/constants/auth";
import { EMAIL_PATTERN } from "@/constants/validation";
import { storeTokens } from "@/utils/token-storage";
import { loadGsi } from "@/utils/google-auth";
import { clearReturnTo, getReturnTo } from "@/router";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_BASE = "/api/common";

class LoginComponent implements Component {
  render = () => {
    return `
            <div class="
                  min-h-[calc(100vh-64px)]
                  flex items-center justify-center
                  bg-[radial-gradient(circle_at_center,#1c1c1c,#0b0b0b)]
                ">
              <div class="
                    w-[380px]	p-8
                    border-2 border-slate-500 rounded-2xl
                    shadow-[0_0_30px_rgba(0,0,0,0.8)]
                   ">
                <h2 class="
                      text-center text-slate-50 text-5xl
                      font-bold tracking-[0.1em]
                      mb-7
                    ">
                  ${t("login")}
                </h2>

                <form id="login-form" class="accent-slate-800">

                  <!-- Email -->
                  <div class="accent-slate-800">
                    <label for="email"
                           class="
                            block mb-1 text-sm
                            font-bold tracking-[0.1em]
                            text-slate-200
                           ">
                      ${t("email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="you@example.com"
                      required
                      class="
                      w-full px-2 py-3 mb-5
                        bg-slate-700
                        border border-slate-500 rounded-md
                        text-slate-200 text-base
                        leading-normal
                      "
                    />
                  </div>

                  <!-- Password -->
                  <div class="accent-slate-800">
                    <label for="password"
                           class="
                            block mb-1 text-sm
                            font-bold tracking-[0.1em]
                            text-slate-200
                           ">
                      ${t("password")}
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      required
                      class="
                        w-full px-2 py-3 mb-5
                        bg-slate-700
                        border border-slate-500 rounded-md
                        text-white text-base
                        leading-normal
                      "
                    />
                  </div>

                  <!-- Submit -->
                  <button type="submit" 
                          class="
                            w-full mt-4 py-2
                            bg-slate-800
                            text-slate-200 text-base font-bold
                            border border-slate-600
                            tracking-[0.1em]
                            cursor-pointer
                            transition-all ease-in-out duration-200
                            hover:bg-slate-600 hover:border-slate-200
                            hover:translate-y-[1px]
                          ">
                    ${t("enter")}
                  </button>

                  <!-- Footer -->
                  <div class="mt-5 text-center underline decoration-slate-400">
                    <a class="hover:bg-blue-500" href="/register" data-nav>${t("to_signup")}</a>
                  </div>

                  <div class="mt-4 mb-8 text-center underline decoration-slate-400">
                    <a class="hover:bg-blue-500" href="/" data-nav>${t("home_return")}</a>
                  </div>

                  <div class="
                        mb-3
                        border-t border-slate-300
                        relative text-center
                       ">
                    <span class="
                            relative -top-3
                            bg-slate-900
                            px-3
                            text-xs text-slate-200
                            tracking-[0.1em]
                            whitespace-nowrap
                          ">
                      ${t("other_login_methods")}
                    </span>
                  </div>

                  <div class="flex flex-col items-center space-y-2">
                    <div id="google-btn"
                         class="
                          flex justify-center
                          hover:translate-y-[1px]
                         ">
                    </div>
                    <p id="google-msg"
                       class="
                        mt-2.5 text-xs 
                        text-slate-500 text-center 
                        whitespace-pre-wrap
                    "></p>
                  </div>

                  <p id="login-msg" 
                     class="
                      mt-3
                      text-xs text-slate-300 text-center
                      whitespace-pre-wrap
                  "></p>
                </form>
              </div>
            </div>
          `;
  };
}

const setLoginMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#login-msg");
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

const storeTwoFactorChallenge = (token: string, longTerm: boolean) => {
  sessionStorage.setItem(TWO_FACTOR_TOKEN_KEY, token);
  sessionStorage.setItem(TWO_FACTOR_LONG_TERM_KEY, longTerm ? "1" : "0");
};

const handleGoogleCredential = async (
  credential: string,
  longTerm: boolean,
) => {
  setGoogleMsg(word("google_login_processing"));
  try {
    const returnTo = getReturnTo();
    const res = await fetch(`${API_BASE}/user/google_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential, longTerm }),
    });
    const body = await res.json().catch(() => ({}));
    if (body?.requiresSignup || res.status === 404) {
      storePendingGoogleSignup(credential, longTerm);
      navigate("/google-signup");
      return;
    }
    if (body?.twoFactorRequired && body?.twoFactorToken) {
      storeTwoFactorChallenge(body.twoFactorToken, longTerm);
      navigate("/two-factor");
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

const setupGoogleLogin = async () => {
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
    callback: ({ credential }: { credential: string }) => {
      const remember = Boolean(
        document.querySelector<HTMLInputElement>("#remember")?.checked,
      );
      if (credential) handleGoogleCredential(credential, remember);
    },
  });
  google.accounts.id.renderButton(document.getElementById("google-btn"), {
    theme: "outline",
    size: "large",
    type: "standard",
    text: "continue_with",
  });
};

const setupLoginForm = () => {
  const form = document.querySelector<HTMLFormElement>("#login-form");
  const submitButton = form?.querySelector<HTMLButtonElement>("button[type='submit']");
  const toSignupLink = document.querySelector<HTMLAnchorElement>(
    "a[data-nav][href='/register']",
  );
  const toHomeLink = document.querySelector<HTMLAnchorElement>(
    "a[data-nav][href='/']",
  );

  if (toSignupLink) {
    toSignupLink.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("/register");
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
    setLoginMsg("");

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const longTerm = Boolean(formData.get("remember"));

    if (!email || !password) {
      setLoginMsg(word("login_required"));
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setLoginMsg(word("email_invalid"));
      return;
    }

    if (submitButton) submitButton.disabled = true;
    try {
      const returnTo = getReturnTo();
      const res = await fetch(`${API_BASE}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, longTerm }),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.twoFactorRequired && body?.twoFactorToken) {
        storeTwoFactorChallenge(body.twoFactorToken, longTerm);
        navigate("/two-factor");
        return;
      }
      if (!res.ok) {
        setLoginMsg(
          body?.message ?? `${word("login_failed")} (status ${res.status})`,
        );
        return;
      }
      storeTokens(body.accessToken, body.longTermToken);
      setLoginMsg(word("login_success"));
      clearReturnTo();
      navigate(returnTo);
    } catch (error) {
      setLoginMsg(`${word("login_error")}: ${error}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};

export const LoginRoute: Route = {
  linkLabel: () => word("login"),
  content: () => new LoginComponent().render(),
  onMount: () => {
    setupLoginForm();
    setupGoogleLogin();
  },
  head: { title: "Login" },
};
