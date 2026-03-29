// pingpong_3D/HelpOverlay.ts ヘルプ画面スマホビュー差し込み用
import { HELP_SLIDES } from "./helpSlider";

export function renderHelpOverlay(): string {
  const slidesHtml = HELP_SLIDES.map((slide, index) => {
    return `
      <div class="help-slide ${index === 0 ? "active" : ""}" data-index="${index}">
        <div class="help-slide-image">
          <img
            src="${slide.image}"
            alt="help slide ${index + 1}"
          />
        </div>
        <p class="help-slide-desc px-20 text-[1.6rem] font-semibold leading-[1.5] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.8),0_0_10px_rgba(0,0,0,0.5)] max-sm:text-[14px]">
          ${slide.desc}
        </p>
      </div>
    `;
  }).join("");

  const indicatorsHtml = HELP_SLIDES.map((_, index) => {
    return `
      <button
        type="button"
        class="help-indicator ${index === 0 ? "active" : ""}"
        data-index="${index}"
        aria-label="Go to help slide ${index + 1}"
      ></button>
    `;
  }).join("");

  return `
    <div id="help-overlay" class="fixed inset-0 z-[20000] hidden items-center justify-center bg-black/85 backdrop-blur-md">
      <div class="flex w-[90vw] max-w-[1000px] flex-col rounded-2xl border border-white/10 bg-black p-0 text-center text-white shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <div class="help-slider-block">

          <div class="relative h-[600px] w-full overflow-hidden rounded-2xl">
            ${slidesHtml}
            <button class="help-nav prev-btn" id="help-prev">&#10094;</button>
            <button class="help-nav next-btn" id="help-next">&#10095;</button>
          </div>

          <div class="relative left-1/2 mt-2 flex -translate-x-1/2 justify-center gap-3 max-sm:mt-4 max-sm:mb-[150px]">
            ${indicatorsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}
