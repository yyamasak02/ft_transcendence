// src/api/components/banner-slider/index.ts
import type { Component } from "@/models/component";

export interface BannerSlide {
  id: number;
  src: string;
  alt: string;
  link: string; // リンクが必要ない場合は "#"
}

export class BannerSlider implements Component {
  private currentSlideIndex: number = 0;
  private autoSlideInterval: number | null = null;
  private readonly INTERVAL_MS = 5000;
  private targetId: string;
  private slides: BannerSlide[];

  constructor(targetId: string, slides: BannerSlide[]) {
    this.targetId = targetId;
    this.slides = slides;
  }

  // HTMLの生成
  render = () => {
    const slidesHtml = this.slides
      .map(
        (slide, index) => `
      <a 
        href="${slide.link}" 
        class="banner-slide ${index === 0 ? "active" : ""}" 
        data-index="${index}"
        ${slide.link.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}
      >
        <img src="${slide.src}" alt="${slide.alt}">
      </a>
    `,
      )
      .join("");

    const indicatorsHtml = this.slides
      .map(
        (_, index) => `
      <div 
        class="indicator ${index === 0 ? "active" : ""}" 
        data-index="${index}"
      ></div>
    `,
      )
      .join("");

    return `
      <div class="banner-wrapper">
        <div class="banner-container" id="${this.targetId}-container">
          ${slidesHtml}
          
          <button class="banner-nav prev-btn" id="${this.targetId}-prev">&#10094;</button>
          <button class="banner-nav next-btn" id="${this.targetId}-next">&#10095;</button>
          
          <div class="banner-indicators">
            ${indicatorsHtml}
          </div>
        </div>
      </div>
    `;
  };

  // 表示時の初期化
  mount = () => {
    this.startAutoSlide();
    this.addEventListeners();
  };

  // 非表示時のクリーンアップ
  unmount = () => {
    this.stopAutoSlide();
    this.removeEventListeners();
  };

  private addEventListeners = () => {
    const container = document.getElementById(`${this.targetId}-container`);
    if (!container) return;

    const prevBtn = container.querySelector(`#${this.targetId}-prev`);
    const nextBtn = container.querySelector(`#${this.targetId}-next`);
    const indicators = container.querySelectorAll(".indicator");

    prevBtn?.addEventListener("click", this.handlePrev);
    nextBtn?.addEventListener("click", this.handleNext);

    indicators.forEach((ind) => {
      ind.addEventListener("click", (e: Event) => {
        const target = e.currentTarget as HTMLElement;
        const index = Number(target.getAttribute("data-index"));
        if (!Number.isNaN(index)) {
          this.handleManualSwitch(index);
        }
      });
    });
  };

  private removeEventListeners = () => {
    const container = document.getElementById(`${this.targetId}-container`);
    if (!container) return;

    const prevBtn = container.querySelector(`#${this.targetId}-prev`);
    const nextBtn = container.querySelector(`#${this.targetId}-next`);
    prevBtn?.removeEventListener("click", this.handlePrev);
    nextBtn?.removeEventListener("click", this.handleNext);
  };

  private handleNext = () => {
    this.resetTimer();
    this.goToSlide(this.currentSlideIndex + 1);
  };

  private handlePrev = () => {
    this.resetTimer();
    this.goToSlide(this.currentSlideIndex - 1);
  };

  private handleManualSwitch = (index: number) => {
    this.resetTimer();
    this.goToSlide(index);
  };

  private goToSlide = (index: number) => {
    if (index >= this.slides.length) {
      this.currentSlideIndex = 0;
    } else if (index < 0) {
      this.currentSlideIndex = this.slides.length - 1;
    } else {
      this.currentSlideIndex = index;
    }
    this.updateDOM();
  };

  private updateDOM = () => {
    const container = document.getElementById(`${this.targetId}-container`);
    if (!container) return;

    const slides = container.querySelectorAll(".banner-slide");
    const indicators = container.querySelectorAll(".indicator");

    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === this.currentSlideIndex);
    });

    indicators.forEach((ind, idx) => {
      ind.classList.toggle("active", idx === this.currentSlideIndex);
    });
  };

  private startAutoSlide = () => {
    if (this.autoSlideInterval) return;
    this.autoSlideInterval = window.setInterval(() => {
      this.goToSlide(this.currentSlideIndex + 1);
    }, this.INTERVAL_MS);
  };

  private stopAutoSlide = () => {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  };

  private resetTimer = () => {
    this.stopAutoSlide();
    this.startAutoSlide();
  };
}
