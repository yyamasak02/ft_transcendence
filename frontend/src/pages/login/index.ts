import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import "./style.css";


// TODO ログイン機能を実装する
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
								</form>
						</div>
        	`;
  };
}

export const LoginRoute: Record<string, Route> = {
  "/login": {
    linkLabel: () => word("login"),
    content: () => new LoginComponent().render(),
  },
};
