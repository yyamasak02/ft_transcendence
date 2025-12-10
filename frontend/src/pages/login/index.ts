import type { Route } from "@/types/routes";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_BASE = "/api/common";

class LoginComponent {
  render = () => {
    return `
            <div class="min-h-screen flex items-center justify-center bg-gray-900">
            <div class="bg-gray-800 border-4 border-gray-600 p-6 w-96">
                <h2 class="text-2xl font-extrabold mb-6 text-center text-green-400 tracking-widest">
                LOGIN
                </h2>
                <form action="#" method="POST" class="text-green-300">
                <div class="mb-4">
                    <label for="email" class="block text-sm font-bold uppercase">Username</label>
                    <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@example.com"
                    required
                    class="mt-1 w-full px-3 py-2 bg-black text-green-300 border border-green-400 focus:outline-none"
                    />
                </div>
                <div class="mb-6">
                    <label for="password" class="block text-sm font-bold uppercase">Password</label>
                    <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    class="mt-1 w-full px-3 py-2 bg-black text-green-300 border border-green-400 focus:outline-none"
                    />
                </div>
                <div class="flex items-center mb-4">
                    <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    class="h-4 w-4 text-green-400 border-gray-500 bg-black"
                    />
                    <label for="remember" class="ml-2 text-sm">Keep Login</label>
                </div>
                <button
                    type="submit"
                    class="w-full bg-green-500 text-black py-2 px-4 border-2 border-green-400 hover:bg-green-400 font-bold uppercase tracking-widest"
                >
                    Enter
                </button>
                </form>
                <div class="mt-6 border-t border-gray-600 pt-4">
                  <div id="google-btn" class="flex justify-center"></div>
                  <p id="google-msg" class="text-xs text-green-300 mt-3 whitespace-pre-wrap"></p>
                </div>
            </div>
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
    linkLabel: "Login",
    content: new LoginComponent().render(),
    onMount: setupGoogleLogin,
    head: { title: "Login" },
  },
};
