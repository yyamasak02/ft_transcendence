import type { Route } from "@/types/routes";
import { t } from "@/i18n";
import { navigate } from "@/router";
import {
  TWO_FACTOR_LONG_TERM_KEY,
  TWO_FACTOR_TOKEN_KEY,
} from "@/constants/auth";
import { storeTokens } from "@/utils/token-storage";
import { clearReturnTo, getReturnTo } from "@/router";

const API_BASE = "/api/common";

class TwoFactorComponent {
  render = () => {
    return `
      <div class="
            min-h-[calc(100vh-64px)]
            flex items-center justify-center
            bg-radial from-[#1c1c1c] to-[#0b0b0b]">
        <div class="
              w-full max-w-[380px]
              p-8 bg-slate-900
              text-center
              border-2 border-slate-700 rounded-2xl
              shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <h2 class="
                text-slate-100 text-3xl
                tracking-widest mb-3 font-bold
          ">${t("two_factor_title")}</h2>
          <p class="
              text-slate-300 text-sm mb-5.5          
          ">${t("two_factor_prompt")}</p>

          <form id="two-factor-form">
            <div class="mb-4.5">
              <label
                for="code"
                class="
                  block mb-1.5 text-sm font-bold
                  tracking-wider text-slate-400
                "
              >
                ${t("two_factor_code")}
              </label>
              <input
                type="text"
                id="code"
                name="code"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="123456"
                required
                class="
                  w-full py-2.5 px-3
                  bg-slate-900 border border-slate-600
                  text-slate-100 text-base rounded-md
                  tracking-[0.2em]
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
              ${t("two_factor_verify")}
            </button>

            <div class="mt-4.5 text-center">
              <a 
                href="/login"
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
              id="two-factor-msg"
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
    form?.querySelector<HTMLButtonElement>("button[type='submit']");
  const toLoginLink = document.querySelector<HTMLAnchorElement>("a[href='/login']");

  if (toLoginLink) {
    toLoginLink.addEventListener("click", (event) => {
      event.preventDefault();
      clearTwoFactorState();
      navigate("/login");
    });
  }

  const twoFactorToken = getTwoFactorToken();
  if (!form || !twoFactorToken) {
    setTwoFactorMsg(t("two_factor_missing"));
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
      setTwoFactorMsg(t("two_factor_code_required"));
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
            `${t("two_factor_verify_failed")} (status ${res.status})`,
        );
        return;
      }
      if (!body?.accessToken) {
        setTwoFactorMsg(t("two_factor_verify_failed"));
        return;
      }
      storeTokens(body.accessToken, body.longTermToken);
      clearTwoFactorState();
      clearReturnTo();
      navigate(getReturnTo());
    } catch (error) {
      setTwoFactorMsg(`${t("two_factor_verify_failed")}: ${error}`);
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
