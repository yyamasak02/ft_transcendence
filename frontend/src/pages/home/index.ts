// src/pages/home/index.ts
import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import "./style.css";

interface BannerSlide {
  id: number;
  src: string;
  alt: string;
  link: string; // リンクが必要ない場合は "#"
}

// ここで設定
const SLIDES: BannerSlide[] = [
  {
    id: 1,
    src: "../../public/banner/event1.png",
    alt: "event1",
    link: "#",
  },
  {
    id: 2,
    src: "../../public/banner/event2.png",
    alt: "event2",
    link: "https://42tokyo.jp/",
  },
  {
    id: 3,
    src: "../../public/banner/event3.png",
    alt: "event3",
    link: "https://42tokyo.jp/",
  },
  {
    id: 4,
    src: "../../public/banner/event4.png",
    alt: "event4",
    link: "https://42tokyo.jp/",
  },
];

class HomeComponent {
  private currentSlideIndex: number = 0;
  private autoSlideInterval: number | null = null;
  private readonly INTERVAL_MS = 5000;

  //   画像の見た目を作るメソッド
  render = () => {
    const slidesHtml = SLIDES.map(
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
    ).join("");

    const indicatorsHtml = SLIDES.map(
      (_, index) => `
      <div 
        class="indicator ${index === 0 ? "active" : ""}" 
        data-index="${index}"
      ></div>
    `,
    ).join("");

    return `
      <div class="home-container">
        <h1>ft_transcendence</h1>
        
        <div class="banner-wrapper">
          <div class="banner-container" id="home-banner">
            ${slidesHtml}
            
            <button class="banner-nav prev-btn" id="banner-prev">&#10094;</button>
            <button class="banner-nav next-btn" id="banner-next">&#10095;</button>
            
            <div class="banner-indicators">
              ${indicatorsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  //   表示時
  mount = () => {
    this.startAutoSlide();
    this.addEventListeners();
  };

  //   非表示時
  unmount = () => {
    this.stopAutoSlide();
    this.removeEventListeners();
  };

  //   イベントの登録
  private addEventListeners = () => {
    const prevBtn = document.getElementById("banner-prev");
    const nextBtn = document.getElementById("banner-next");
    const indicators = document.querySelectorAll(".indicator");

    prevBtn?.addEventListener("click", this.handlePrev);
    nextBtn?.addEventListener("click", this.handleNext);

    indicators.forEach((ind) => {
      ind.addEventListener("click", (e: Event) => {
        const target = e.currentTarget;

        if (!(target instanceof HTMLElement)) {
          return;
        }

        const dataIndex = target.getAttribute("data-index");
        if (dataIndex === null) {
          return;
        }

        const index = Number(dataIndex);
        if (Number.isNaN(index)) {
          return;
        }

        this.handleManualSwitch(index);
      });
    });
  };

  //   イベントの解除
  private removeEventListeners = () => {
    const prevBtn = document.getElementById("banner-prev");
    const nextBtn = document.getElementById("banner-next");
    prevBtn?.removeEventListener("click", this.handlePrev);
    nextBtn?.removeEventListener("click", this.handleNext);
  };

  //   右矢印
  private handleNext = () => {
    this.resetTimer();
    this.goToSlide(this.currentSlideIndex + 1);
  };

  //   左矢印
  private handlePrev = () => {
    this.resetTimer();
    this.goToSlide(this.currentSlideIndex - 1);
  };

  private handleManualSwitch = (index: number) => {
    this.resetTimer();
    this.goToSlide(index);
  };

  //   スライド切り替え
  private goToSlide = (index: number) => {
    if (index >= SLIDES.length) {
      this.currentSlideIndex = 0;
    } else if (index < 0) {
      this.currentSlideIndex = SLIDES.length - 1;
    } else {
      this.currentSlideIndex = index;
    }
    this.updateDOM();
  };

  //   DOM更新
  private updateDOM = () => {
    const slides = document.querySelectorAll(".banner-slide");
    const indicators = document.querySelectorAll(".indicator");

    slides.forEach((slide, idx) => {
      if (idx === this.currentSlideIndex) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });

    indicators.forEach((ind, idx) => {
      if (idx === this.currentSlideIndex) {
        ind.classList.add("active");
      } else {
        ind.classList.remove("active");
      }
    });
  };

  //   自動スライド開始
  private startAutoSlide = () => {
    if (this.autoSlideInterval) return;
    this.autoSlideInterval = window.setInterval(() => {
      this.goToSlide(this.currentSlideIndex + 1);
    }, this.INTERVAL_MS);
  };

  //   自動スライド停止
  private stopAutoSlide = () => {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  };

  //   タイマーの再起動
  private resetTimer = () => {
    this.stopAutoSlide();
    this.startAutoSlide();
  };
}

const homeComponent = new HomeComponent();

export const HomeRoute: Record<string, Route> = {
  "/": {
    linkLabel: () => word("home"),
    content: () => homeComponent.render(),
    onMount: () => homeComponent.mount(),
    onUnmount: () => homeComponent.unmount(),
  },
};
