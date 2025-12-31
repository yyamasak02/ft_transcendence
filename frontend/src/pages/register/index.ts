// src/pages/register/index.ts
import type { Route } from "@/types/routes";

import { t, word } from "@/i18n";
import type { Component } from "@/types/component";

// TODO 新規登録機能を実装する
class RegisterComponent implements Component {
  render = () => {
    return `
            <div class="register-screen">
							<div class="register-box">
								<h2 class="register-title">${t("signup")}</h2>

								<form class="register-form" id="register_form">
									<div class="register-field">
											<label for="email">${t("username")}</label>
											<input
											type="email"
											id="email"
											name="email"
											placeholder="your@example.com"
											required
											class="register-input"
											/>
									</div>

									<div class="register-field">
											<label for="password">${t("password")}</label>
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
											<label for="password">${t("password_confirm")}</label>
											<input
											type="password"
											id="password_confirm"
											name="password_confirm"
											placeholder="••••••••"
											required
											class="register-input"
											/>
									</div>

									<button type="submit" class="register-submit">${t("register")}</button>

									<div class="register-footer">
										<a class="register-link" href="/login">${t("to_login")}</a>
									</div>
								</form>
							</div>
            </div>
        `;
  };
}

export const RegisterRoute: Route = {
  linkLabel: () => word("signup"),
  content: () => new RegisterComponent().render(),
};
