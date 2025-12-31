import type { Route } from "@/types/routes";
import { word, t } from "@/i18n";
import { navigate } from "@/router";
import {
  MIN_USERNAME_LENGTH,
  USERNAME_ROMAN_PATTERN,
} from "@/constants/validation";
import { LONG_TERM_TOKEN_KEY } from "@/constants/auth";
import { getStoredAccessToken, storeTokens } from "@/utils/token-storage";
import { decodeJwtPayload } from "@/utils/jwt";
import "./style.css";

const API_BASE = "/api/common";

class UsernameChangeComponent {
  render = () => {
    return `
      <div class="username-change-screen">
        <div class="username-change-box">
          <h2 class="username-change-title">${t("username_change")}</h2>
          <p class="username-change-current" id="username-change-current"></p>
          <form class="username-change-form" id="username-change-form">
            <div class="username-change-field">
              <label for="username-change-input">${t("username")}</label>
              <input
                type="text"
                id="username-change-input"
                name="username"
                placeholder="yourname"
                required
                class="username-change-input"
              />
            </div>
            <button type="submit" class="username-change-submit">
              ${t("username_change_submit")}
            </button>
            <p id="username-change-msg" class="username-change-msg"></p>
          </form>
          <div class="username-change-footer">
            <a class="username-change-link" href="/me" data-nav>
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
  el.textContent = name ? `${word("current_username")}: ${name}` : "";
};

const setupBackLink = () => {
  const link = document.querySelector<HTMLAnchorElement>(
    ".username-change-link[href='/me']",
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
    setChangeMsg(word("login_required_for_change"));
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
      setChangeMsg(word("username_change_required"));
      return;
    }
    if (name.length < MIN_USERNAME_LENGTH) {
      setChangeMsg(word("username_min_length"));
      return;
    }
    if (!USERNAME_ROMAN_PATTERN.test(name)) {
      setChangeMsg(word("username_roman_only"));
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
        setChangeMsg(word("login_required_for_change"));
        return;
      }
      if (res.status === 409) {
        setChangeMsg(word("username_taken"));
        return;
      }
      if (!res.ok) {
        setChangeMsg(
          body?.message ??
            `${word("username_change_failed")} (status ${res.status})`,
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
      setChangeMsg(word("username_change_success"));
      form.reset();
    } catch (error) {
      setChangeMsg(`${word("username_change_failed")}: ${error}`);
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
