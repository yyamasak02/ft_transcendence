// src/api/components/banner-slider/index.ts
import type { Component } from "@/models/component";

export interface BannerSlide {
  id: number;
  src: string;
  alt: string;
  link: string; // リンクが必要ない場合は "#"
}

// オプション
export interface SliderOptions {
  autoPlay?: boolean;
  loop?: boolean;
  interval?: number;
  onFinish?: () => void;
  onChange?: (index: number) => void;
}

export class SliderLogic {
  private currentIndex: number = 0;
  private timer: number | null = null;
  private count: number;
  private options: Required<SliderOptions>;

  constructor(count: number, options?: SliderOptions) {
    this.count = count;
    this.options = {
      autoPlay: true,
      loop: true,
      interval: 5000,
      onFinish: () => {},
      onChange: () => {},
      ...options,
    };
  }

  // 現在のインデックスを取得
  get current() {
    return this.currentIndex;
  }

  // 自動再生の開始
  start() {
    if (this.options.autoPlay) {
      this.stop();
      this.timer = window.setInterval(() => this.next(), this.options.interval);
    }
  }

  // 自動再生の停止
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // 指定スライドへ移動
  goTo(index: number) {
    if (index < 0 || index >= this.count) return;

    this.currentIndex = index;
    this.options.onChange(this.currentIndex);
    if (this.options.autoPlay) {
      this.start();
    }
  }

  // 次へ
  next() {
    const nextIndex = this.currentIndex + 1;

    if (nextIndex >= this.count) {
      if (this.options.loop) {
        this.goTo(0);
      } else {
        this.stop();
        this.options.onFinish();
      }
    } else {
      this.goTo(nextIndex);
    }
  }

  // 前へ
  prev() {
    const prevIndex = this.currentIndex - 1;

    if (prevIndex < 0) {
      if (this.options.loop) {
        this.goTo(this.count - 1);
      }
    } else {
      this.goTo(prevIndex);
    }
  }

  // UI制御用ヘルパー(最初)
  isFirst() {
    return this.currentIndex === 0;
  }

  // UI制御用ヘルパー(最後)
  isLast() {
    return this.currentIndex === this.count - 1;
  }
}

export class BannerSlider implements Component {
  private targetId: string;
  private slides: BannerSlide[];
  private logic: SliderLogic;

  constructor(
    targetId: string,
    slides: BannerSlide[],
    options?: SliderOptions,
  ) {
    this.targetId = targetId;
    this.slides = slides;

    this.logic = new SliderLogic(slides.length, {
      ...options,
      onChange: () => this.updateDOM(),
    });
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
    this.addEventListeners();
    this.logic.start();
    this.updateNavButtons();
  };

  // 非表示時のクリーンアップ
  unmount = () => {
    this.logic.stop();
    this.removeEventListeners();
  };

  private addEventListeners = () => {
    const container = document.getElementById(`${this.targetId}-container`);
    if (!container) return;

    const prevBtn = container.querySelector(`#${this.targetId}-prev`);
    const nextBtn = container.querySelector(`#${this.targetId}-next`);
    const indicators = container.querySelectorAll(".indicator");

    prevBtn?.addEventListener("click", () => this.logic.prev());
    nextBtn?.addEventListener("click", () => this.logic.next());

    indicators.forEach((ind) => {
      ind.addEventListener("click", (e: Event) => {
        const target = e.currentTarget as HTMLElement;
        const index = Number(target.getAttribute("data-index"));
        if (!Number.isNaN(index)) {
          this.logic.goTo(index);
        }
      });
    });
  };

  private removeEventListeners = () => {};

  private updateDOM = () => {
    const container = document.getElementById(`${this.targetId}-container`);
    if (!container) return;

    const slides = container.querySelectorAll(".banner-slide");
    const indicators = container.querySelectorAll(".indicator");
    const current = this.logic.current;

    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === current);
    });

    indicators.forEach((ind, idx) => {
      ind.classList.toggle("active", idx === current);
    });
    this.updateNavButtons();
  };

  private updateNavButtons = () => {};
}
