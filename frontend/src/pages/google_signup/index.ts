import type { Route } from "@/types/routes";
import { word, t, i18nAttr } from "@/i18n";
import { navigate } from "@/router";
import { GOOGLE_ID_TOKEN_KEY, GOOGLE_LONG_TERM_KEY } from "@/constants/auth";
import {
  MIN_USERNAME_LENGTH,
  USERNAME_ROMAN_PATTERN,
} from "@/constants/validation";
import { storeTokens } from "@/utils/token-storage";
import { clearReturnTo, getReturnTo } from "@/router";

const API_BASE = "/api/common";

class GoogleSignupComponent {
  render = () => {
    return `
      <div class="
            min-h-[calc(100vh-64px)]
            flex items-center justify-center
            bg-[radial-gradient(circle_at_center,#1c1c1c,#0b0b0b)]">
        <div class="
              w-full max-w-[380px]
              p-8 bg-slate-900
              text-center
              border-2 border-slate-700 rounded-2xl
              shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <h2 class="
                text-slate-100 text-3xl
                tracking-widest mb-3 font-bold
              ">${t("google_signup")}</h2>
          <p class="
                text-slate-300 text-sm mb-5.5
             ">${t("google_signup_desc")}</p>

          <form id="google-signup-form">
            <div class="mb-[18px]">
              <label
                for="username"
                class="
                  block mb-1.5 text-sm font-bold
                  tracking-wider text-slate-400
                "
              >
                ${t("username")}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                ${i18nAttr("placeholder", "username")}
                required
                class="
                  w-full py-2.5 px-3
                  bg-slate-900 border border-slate-600
                  text-slate-100 text-base rounded-md
                  placeholder:text-slate-600
                  focus:outline-none focus:border-slate-400
                  focus:bg-slate-900
                "
              />
            </div>

            <button
              type="submit"
              class="
                w-full mt-2 py-2.5
                bg-slate-800 text-slate-100
                border border-slate-600
                text-base font-bold tracking-widest
                cursor-pointer
                transition duration-200 ease-in-out
                hover:bg-slate-700 hover:border-slate-300
                active:translate-y-px
              "
            >
              ${t("register")}
            </button>

            <div class="mt-[18px] text-center">
              <a href="/login"
                 class="
                  text-slate-300 no-underline text-sm
                  tracking-wide
                  hover:text-slate-100 hover:underline
                 "
              >
                ${t("to_login")}
              </a>
            </div>

            <p
              id="google-signup-msg"
              class="
                mt-3 text-sm
                text-slate-100 text-center
                whitespace-pre-wrap
              "
            ></p>
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
  const submitButton = form?.querySelector<HTMLButtonElement>("button[type='submit']");
  // remember checkbox (reserved for future feature)
  const rememberInput = form?.querySelector<HTMLInputElement>("#remember");
  const toLoginLink = form?.querySelector<HTMLAnchorElement>("a[href='/login']");

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
        if (body?.message === "Email already exists.") {
          setGoogleSignupMsg(word("email_taken"));
        } else {
          setGoogleSignupMsg(word("username_taken"));
        }
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
      clearReturnTo();
      navigate(getReturnTo());
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
