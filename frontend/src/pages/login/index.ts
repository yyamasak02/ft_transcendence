import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import "./style.css";


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_BASE = "/api/common";

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
										<label for="email">
											${word("username")}
										</label>
										<input
											type="email"
											id="email"
											name="email"
											placeholder="your@example.com"
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
								</form>
						</div>
        	`;
  };
}

const setGoogleMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>("#google-msg");
  if (el) el.textContent = message;
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
      body: JSON.stringify({ idToken: credential, longTerm: true }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setGoogleMsg(body?.message ?? `Google login failed (status ${res.status})`);
      return;
    }
    setGoogleMsg("Googleログインに成功しました。");
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
      if (credential) handleGoogleCredential(credential);
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

export const LoginRoute: Record<string, Route> = {
  "/login": {
    linkLabel: () => word("login"),
    content: () => new LoginComponent().render(),
    onMount: setupGoogleLogin,
    head: { title: "Login" },
  },
};
