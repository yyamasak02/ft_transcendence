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
const TWO_FACTOR_TOKEN_KEY = "twoFactorToken";
const TWO_FACTOR_LONG_TERM_KEY = "twoFactorLongTerm";

class LoginComponent {
  render = () => {
    return `
						<div class="login-screen">
							<div class="login-box">

								<h2 class="login-title">
									${word("login")}
								</h2>

								<form class="login-form" id="login-form">

									<!-- Username(Email) -->
									<div class="login-field">
										<label for="username">
											${word("username")}
										</label>
										<input
											type="text"
											id="username"
											name="username"
											placeholder="yourname"
											required
											class="login-input"
										/>
									</div>

									<!-- Password -->
									<div class="login-field">
										<label for="password">
											${word("password")}
										</label>
										<input
											type="password"
											id="password"
											name="password"
											placeholder="••••••••"
											required
											class="login-input"
										/>
									</div>

									<!-- Remember -->
									<div class="login-remember">
										<input
											type="checkbox"
											id="remember"
											name="remember"
										/>
										<label for="remember">${word("keep_login")}</label>
									</div>

									<!-- Submit -->
									<button type="submit" class="login-submit">
										${word("enter")}
									</button>

									<!-- Footer -->
									<div class="login-footer">
										<a class="login-link" href="/register" data-nav>
											${word("to_signup")}
										</a>
									</div>

									<div class="login-footer">
										<div id="google-btn"></div>
										<p id="google-msg" class="login-google-msg"></p>
									</div>

									<p id="login-msg" class="login-msg"></p>
								</form>
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

const storeTwoFactorChallenge = (token: string, longTerm: boolean) => {
  sessionStorage.setItem(TWO_FACTOR_TOKEN_KEY, token);
  sessionStorage.setItem(TWO_FACTOR_LONG_TERM_KEY, longTerm ? "1" : "0");
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

const handleGoogleCredential = async (credential: string, longTerm: boolean) => {
  setGoogleMsg("Googleログインを処理中...");
  try {
    const res = await fetch(`${API_BASE}/user/google_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential, longTerm }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 404) {
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
    setGoogleMsg("Googleログインに成功しました。");
    navigate("/");
  } catch (error) {
    setGoogleMsg(`Googleログイン中にエラーが発生しました: ${error}`);
  }
};

const setupGoogleLogin = async () => {
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
  google.accounts.id.prompt();
};

const setupLoginForm = () => {
  const form = document.querySelector<HTMLFormElement>("#login-form");
  const submitButton = form?.querySelector<HTMLButtonElement>(".login-submit");
  const toSignupLink = document.querySelector<HTMLAnchorElement>(
    ".login-link[href='/register']",
  );

  if (toSignupLink) {
    toSignupLink.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("/register");
    });
  }

  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginMsg("");

    const formData = new FormData(form);
    const name = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const longTerm = Boolean(formData.get("remember"));

    if (!name || !password) {
      setLoginMsg("ユーザー名とパスワードを入力してください。");
      return;
    }
    if (name.length < 5) {
      setLoginMsg("ユーザー名は5文字以上で入力してください。");
      return;
    }

    if (submitButton) submitButton.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, longTerm }),
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
      setLoginMsg("ログインに成功しました。");
      navigate("/");
    } catch (error) {
      setLoginMsg(`ログイン中にエラーが発生しました: ${error}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};

export const LoginRoute: Record<string, Route> = {
  "/login": {
    linkLabel: () => word("login"),
    content: () => new LoginComponent().render(),
    onMount: () => {
      setupLoginForm();
      setupGoogleLogin();
    },
    head: { title: "Login" },
  },
};
