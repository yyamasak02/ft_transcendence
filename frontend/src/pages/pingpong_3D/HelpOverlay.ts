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
        <p class="help-slide-desc">
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
    <div id="help-overlay" style="display: none;">
      <div class="help-content">
        <div class="help-slider-block">
          <div class="help-slider-container">
            ${slidesHtml}

            <button class="help-nav prev-btn" id="help-prev">&#10094;</button>
            <button class="help-nav next-btn" id="help-next">&#10095;</button>
          </div>

          <div class="help-indicators">
            ${indicatorsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}
