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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_BASE = "/api/common";

// TODO 新規登録機能を実装する
class RegisterComponent implements Component {
  render = () => {
    return `
            <div class="
                   min-h-[calc(100dvh-64px)]
                   flex justify-center
                   px-1 py-2 md:py-6
                   overflow-y-auto
                   bg-[radial-gradient(circle_at_center,#1c1c1c,#0b0b0b)]
                 ">
              <div class="
                     w-[380px] px-8 pt-8 pb-5
                     my-auto
                     border-2 border-slate-500 rounded-2xl
                     shadow-[0_0_30px_rgba(0,0,0,0.8)]
                   ">
                <h2 class="
                      text-center text-slate-50 text-5xl
                      font-bold tracking-[0.1em]
                      mb-7
                    ">
                  ${t("signup")}
                </h2>

                <form id="register_form" class="accent-slate-800">
								
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

                  <div class="register-field">
                    <label for="username"
                           class="
                            block mb-1 text-sm
                            font-bold tracking-[0.1em]
                            text-slate-200
                           ">
                      ${t("username")}
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="yourname"
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
                        text-slate-200 text-base
                        leading-normal
                      "
                    />
                  </div>

                  <div class="register-field">
                    <label for="password_confirm"
                           class="
                            block mb-1 text-sm
                            font-bold tracking-[0.1em]
                            text-slate-200
                           ">
                      ${t("password_confirm")}
                    </label>

                    <input
                      type="password"
                      id="password_confirm"
                      name="password_confirm"
                      placeholder="••••••••"
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
										
                  <!-- Submit -->
                  <button id="register-submit" 
                          type="submit"
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
                    ${t("register")}
                  </button>
									
                  <!-- Footer -->
                  <div class="mt-5 text-center underline decoration-slate-400">
                    <a class="hover:bg-blue-500" href="/login" data-nav>${t("to_login")}</a>
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
                      ${t("other_signup_methods")}
                    </span>
                  </div>

                  <div class="flex flex-col items-center">
                    <div id="google-btn-register" 
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

                  <p id="register-msg"
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
    callback: ({ credential }: { credential: string }) => {
      if (credential) handleGoogleCredential(credential);
    },
  });
  const googleRegisButton: HTMLElement | null =
    document.body.querySelector<HTMLElement>("#google-btn-register");
  if (!googleRegisButton) return;
  google.accounts.id.renderButton(googleRegisButton, {
    theme: "outline",
    size: "large",
    type: "standard",
    text: "continue_with",
  });
};

const setupRegisterForm = () => {
  const form = document.querySelector<HTMLFormElement>("#register_form");
  const submitButton =
    form?.querySelector<HTMLButtonElement>("#register-submit");
  const toLoginLink = document.querySelector<HTMLAnchorElement>(
    "a[data-nav][href='/login']",
  );
  const toHomeLink = document.querySelector<HTMLAnchorElement>(
    "a[data-nav][href='/']",
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
