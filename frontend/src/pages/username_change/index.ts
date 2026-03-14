import type { Route } from "@/types/routes";
import { t, i18nAttr } from "@/i18n";
import { navigate } from "@/router";
import {
  MIN_USERNAME_LENGTH,
  USERNAME_ROMAN_PATTERN,
} from "@/constants/validation";
import { LONG_TERM_TOKEN_KEY } from "@/constants/auth";
import { getStoredAccessToken, storeTokens } from "@/utils/token-storage";
import { getCurrentPath, setReturnTo } from "@/router";
import { decodeJwtPayload } from "@/utils/jwt";

const API_BASE = "/api/common";

class UsernameChangeComponent {
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
              ">${t("username_change")}</h2>
          <p
            id="username-change-current"
            class="
              mx-[18px] text-center text-slate-400
              text-sm tracking-wider
            "></p>

          <form class="username-change-form" id="username-change-form">
            <div class="mb-[18px]">
              <label
                for="username"
                class="
                  block mb-1.5
                  text-sm font-bold tracking-wider
                  text-slate-400
                "
              >
                ${t("username")}
              </label>
              <input
                type="text"
                id="username-change-input"
                name="username"
                ${i18nAttr("placeholder", "username")}
                required
                class="
                  w-full py-2.5 px-3
                  bg-slate-900 border border-slate-600
                  text-slate-100 text-base rounded-md
                  placeholder:text-slate-600
                  focus:outline-none focus:border-slate-400  
                "
              />
            </div>

            <button
              type="submit"
              class="
                username-change-submit
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
              ${t("username_change_submit")}
            </button>

            <p
              id="username-change-msg"
              class="
                mt-3 text-sm
                text-slate-100 text-center
                whitespace-pre-wrap 
              "
            ></p>
          </form>

          <div class="mt-[18px] text-center">
            <a
              href="/me" data-nav
              class="
                  text-slate-300 no-underline text-sm
                  tracking-wide
                  hover:text-slate-100 hover:underline 
              "
            >
              ${t("username_change_back")}
            </a>
          </div>
        </div>
      </div>
    `;
  };
}

const setChangeMsg = (message: string) => {
  const el = document.querySelector<HTMLParagraphElement>(
    "#username-change-msg",
  );
  if (el) el.textContent = message;
};

const setCurrentName = (accessToken: string | null) => {
  const el = document.querySelector<HTMLParagraphElement>(
    "#username-change-current",
  );
  if (!el) return;
  const name = accessToken ? (decodeJwtPayload(accessToken)?.name ?? "") : "";
  el.textContent = name ? `${t("current_username")}: ${name}` : "";
};

const setupBackLink = () => {
  const link = document.querySelector<HTMLAnchorElement>(
    "a[href='/me'][data-nav]",
  );
  if (!link) return;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate("/me");
  });
};

const setupChangeForm = () => {
  const form = document.querySelector<HTMLFormElement>("#username-change-form");
  const submitButton = form?.querySelector<HTMLButtonElement>(
    ".username-change-submit",
  );

  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    setChangeMsg(t("login_required_for_change"));
    setReturnTo(getCurrentPath());
    navigate("/login");
    if (submitButton) submitButton.disabled = true;
    return;
  }

  setCurrentName(accessToken);

  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setChangeMsg("");

    const formData = new FormData(form);
    const name = String(formData.get("username") ?? "").trim();
    if (!name) {
      setChangeMsg(t("username_change_required"));
      return;
    }
    if (name.length < MIN_USERNAME_LENGTH) {
      setChangeMsg(t("username_min_length"));
      return;
    }
    if (!USERNAME_ROMAN_PATTERN.test(name)) {
      setChangeMsg(t("username_roman_only"));
      return;
    }

    if (submitButton) submitButton.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/user/name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 404) {
        setChangeMsg(t("login_required_for_change"));
        setReturnTo(getCurrentPath());
        navigate("/login");
        return;
      }
      if (res.status === 409) {
        setChangeMsg(t("username_taken"));
        return;
      }
      if (!res.ok) {
        setChangeMsg(
          body?.message ??
            `${t("username_change_failed")} (status ${res.status})`,
        );
        return;
      }

      const longTermToken =
        localStorage.getItem(LONG_TERM_TOKEN_KEY) ?? undefined;
      const nextAccessToken = String(body?.accessToken ?? "");
      if (nextAccessToken) {
        storeTokens(nextAccessToken, longTermToken);
        setCurrentName(nextAccessToken);
      }
      setChangeMsg(t("username_change_success"));
      form.reset();
    } catch (error) {
      setChangeMsg(`${t("username_change_failed")}: ${error}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};

export const UsernameChangeRoute: Route = {
  linkLabel: "",
  content: () => new UsernameChangeComponent().render(),
  onMount: () => {
    setupChangeForm();
    setupBackLink();
  },
  head: { title: "Username Change" },
};
