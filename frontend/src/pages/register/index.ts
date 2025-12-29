// src/pages/register/index.ts
import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import { navigate } from "@/router/router";
import "./style.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_BASE = "/api/common";
const ACCESS_TOKEN_KEY = "accessToken";
const LONG_TERM_TOKEN_KEY = "longTermToken";
const GOOGLE_ID_TOKEN_KEY = "googleIdToken";
const GOOGLE_LONG_TERM_KEY = "googleLongTerm";

// TODO 新規登録機能を実装する
class RegisterComponent {
  render = () => {
    return `
            <div class="register-screen">
							<div class="register-box">
								<h2 class="register-title">${word("signup")}</h2>

								<form class="register-form" id="register_form">
									<div class="register-field">
											<label for="username">${word("username")}</label>
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
											<label for="password">${word("password")}</label>
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
											<label for="password">${word("password_confirm")}</label>
											<input
											type="password"
											id="password_confirm"
											name="password_confirm"
											placeholder="••••••••"
											required
											class="register-input"
											/>
									</div>

									<button type="submit" class="register-submit">
											${word("register")}
									</button>

									<div class="register-footer">
										<a class="register-link" href="/login">
											${word("to_login")}
										</a>
									</div>

									<div class="register-divider">
										<span>${word("other_signup_methods")}</span>
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

const storeTokens = (accessToken: string, longTermToken?: string) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (longTermToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(LONG_TERM_TOKEN_KEY, longTermToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LONG_TERM_TOKEN_KEY);
  }
};

const storePendingGoogleSignup = (idToken: string, longTerm: boolean) => {
  sessionStorage.setItem(GOOGLE_ID_TOKEN_KEY, idToken);
  sessionStorage.setItem(GOOGLE_LONG_TERM_KEY, longTerm ? "1" : "0");
};

const loadGsi = () =>
  new Promise<typeof globalThis.google | null>((resolve, reject) => {
    if (globalThis.google?.accounts?.id) {
      resolve(globalThis.google);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(globalThis.google ?? null);
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });

const handleGoogleCredential = async (credential: string) => {
  setGoogleMsg("Googleログインを処理中...");
  try {
    const res = await fetch(`${API_BASE}/user/google_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential, longTerm: false }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 404) {
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
    setGoogleMsg("Googleログインに成功しました。");
    navigate("/");
  } catch (error) {
    setGoogleMsg(`Googleログイン中にエラーが発生しました: ${error}`);
  }
};

const setupGoogleRegister = async () => {
  if (!GOOGLE_CLIENT_ID) {
    setGoogleMsg("環境変数 VITE_GOOGLE_CLIENT_ID が設定されていません。");
    return;
  }
  const google = await loadGsi().catch((err) => {
    setGoogleMsg(`Googleスクリプトの読み込みに失敗しました: ${err}`);
    return null;
  });
  if (!google?.accounts?.id) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: ({ credential }) => {
      if (credential) handleGoogleCredential(credential);
    },
  });
  google.accounts.id.renderButton(document.getElementById("google-btn-register"), {
    theme: "outline",
    size: "large",
    type: "standard",
    text: "continue_with",
  });
  google.accounts.id.prompt();
};

const setupRegisterForm = () => {
  const form = document.querySelector<HTMLFormElement>("#register_form");
  const submitButton = form?.querySelector<HTMLButtonElement>(".register-submit");
  const toLoginLink = document.querySelector<HTMLAnchorElement>(
    ".register-link[href='/login']",
  );

  if (toLoginLink) {
    toLoginLink.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("/login");
    });
  }

  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setRegisterMsg("");

    const formData = new FormData(form);
    const name = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("password_confirm") ?? "");

    if (!name || !password || !confirm) {
      setRegisterMsg("すべての項目を入力してください。");
      return;
    }
    if (name.length < 5) {
      setRegisterMsg("ユーザー名は5文字以上で入力してください。");
      return;
    }
    if (password.length < 8) {
      setRegisterMsg("パスワードは8文字以上で入力してください。");
      return;
    }
    if (password !== confirm) {
      setRegisterMsg("パスワードが一致しません。");
      return;
    }

    if (submitButton) submitButton.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRegisterMsg(
          body?.message ?? `${word("register_failed")} (status ${res.status})`,
        );
        return;
      }
      setRegisterMsg("登録が完了しました。ログインしてください。");
      navigate("/login");
    } catch (error) {
      setRegisterMsg(`登録中にエラーが発生しました: ${error}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};

export const RegisterRoute: Record<string, Route> = {
  "/register": {
    linkLabel: () => word("signup"),
    content: () => new RegisterComponent().render(),
    onMount: () => {
      setupRegisterForm();
      setupGoogleRegister();
    },
  },
};
