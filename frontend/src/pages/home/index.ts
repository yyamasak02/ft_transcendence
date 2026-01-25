// src/pages/home/index.ts
import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import type { Component } from "@/models/component";
import { BannerSlider, type BannerSlide } from "@/components/banner-slider";
import "@/components/banner-slider/style.css"; // コンポーネントのCSSを読み込み

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

class HomeComponent implements Component {
  // コンポーネントのインスタンスを保持
  private slider: BannerSlider;

  constructor() {
    // ID "home-banner" と、表示したいスライドデータを渡して初期化
    this.slider = new BannerSlider("home-banner", SLIDES);
  }

  render = () => {
    return `
      <div class="home-container">
        <h1>ft_transcendence</h1>
        ${this.slider.render()}
      </div>
    `;
  };

  mount = () => {
    this.slider.mount();
  };

  unmount = () => {
    this.slider.unmount();
  };
}

const homeComponent = new HomeComponent();

export const HomeRoute: Route = {
  linkLabel: () => word("home"),
  content: () => homeComponent.render(),
  onMount: () => homeComponent.mount(),
  onUnmount: () => homeComponent.unmount(),
};
