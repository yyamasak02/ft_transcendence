// src/pages/terms/index.ts
import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";

export class TermsComponent implements Component {
	render(): string {
		return `
		<div class="min-h-full w-full flex items-center justify-center px-4">
			<div 
				class="
					w-full max-w 3xl
					rounded-xl
					border border-slate-800
					bg-slate-900/80
					backdrop-blur
					shadow-lg
					ps-6 py-8 sm:px-10 sm:py-12
					text-slate-100
				"
			>
				<header class="mb-10 text-center">
					<h1 class="text-3xl sm:text-4xl font-semibold tracking-tkght">
						Terms of Service
					</h1>
					<p class="mt-2 text-sm text-slate-400">
						Last updated: 2026-02-05
					</p>
				</header>

				<section class="space-y-4 text-sm leading-6 text-slate-200 text-left">
					<p>
						This application is a student project developed as part of an educational program.
					</p>
					<p>
						By accessing or using this application, you agree to the following terms:
					</p>

					<ul class="list-disc space-y-2 pl-5">
						<li>
							This application is provided "as is", without warranties of any kind, express or implied.
						</li>
						<li>
							The developers assume no responsibility for any damages, data loss, or issues resulting from the use of this application.
						</li>
						<li>
							The service may be modified, suspended, or discontinued at any time without prior notice.
						</li>
						<li>
							You agree not to use this application for any unlawful, harmful, or malicious activities.
						</li>
					</ul>

					<p class="pt-2">
						If you do not agree to these terms, please discontinue use of this application.
					</p>
				</section>

				<footer class="mt-10 w-full border-t border-slate-800 px-4 py-6 sm:px-6">
					<div class="max-auto w-full max-w-3xl flex flex-col gap-4 sm:flex-row sm:justify-between">
						<a href="/privacy"
							class="text-sm underline decoration-slate-600 underline-offset-4 hover:text-slate-200">
							Privacy Policy
						</a>

						<a href="/"
							class="text-sm underline decoration-slate-600 underline-offset-4 hover:text-slate-200">
							Back to Home
						</a>
					</div>
				</footer>
			</div>
		</div>
		`;
	}
}

export const TermsRoute: Route = {
	linkLabel: () => "Terms",
	content: () => new TermsComponent().render(),
};
