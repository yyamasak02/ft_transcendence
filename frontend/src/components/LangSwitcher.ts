// src/components/LangSwitcher.ts
import { setLang, getLang, type Lang } from "@/i18n";
import { rerender } from "@/router/router";



export function renderLangSwitcherDOM(): HTMLElement {
	const wrapper = document.createElement("div");
	wrapper.className = "lang-switcher";

	const select = document.createElement("select");
	select.className = "lang-select";

	const langs: { lang: Lang; label: string }[] = [
		{lang: "en", label: "English"},
		{lang: "ja", label: "日本語"},
		{lang: "edo", label: "江戸言葉"},
	];
	const current = getLang();

	langs.forEach(({ lang, label }) => {
		const option = document.createElement("option");
		option.value = lang;
		option.textContent = label;

		if (lang === current) {
			option.selected = true;
		}
		select.appendChild(option);
	});
	select.addEventListener("change", () => {
		const lang = select.value as Lang;
		setLang(lang);
		rerender(); // 再描画
	});
	wrapper.appendChild(select);
	return wrapper;
}
