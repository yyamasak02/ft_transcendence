// src/pages/home/index.ts
import type { Route } from "@/types/routes";
import { word } from "@/i18n";
import type { Component } from "@/models/component";
import {
  BannerSlider,
  type BannerSlide,
  type SliderOptions,
} from "@/components/banner-slider";
import "@/components/banner-slider/style.css"; // コンポーネントのCSSを読み込み

const SLIDES: BannerSlide[] = [
  {
    id: 1,
    src: "/banner/event1.png",
    alt: "event1",
    link: "#",
  },
  {
    id: 2,
    src: "/banner/event2.png",
    alt: "event2",
    link: "https://42tokyo.jp/",
  },
  {
    id: 3,
    src: "/banner/event3.png",
    alt: "event3",
    link: "https://42tokyo.jp/",
  },
  {
    id: 4,
    src: "/banner/event4.png",
    alt: "event4",
    link: "https://42tokyo.jp/",
  },
  {
    id: 5,
    src: "/banner/event5.png",
    alt: "event5",
    link: "https://42tokyo.jp/",
  },
  {
    id: 7,
    src: "/banner/event7.png",
    alt: "event7",
    link: "https://42tokyo.jp/",
  },
];

class HomeComponent implements Component {
  private slider: BannerSlider;

  constructor() {
    const sliderOptions: SliderOptions = {
      autoPlay: true,
      loop: true,
      interval: 5000,
    };
    this.slider = new BannerSlider("home-banner", SLIDES, sliderOptions);
  }

  render = () => {
    return `
      <div class="
				min-h-[calc(100vh-4rem)]
				flex items-start justify-center
        pt-30 sm:pt-10
				px-4
			">
				<div class="flex flex-col items-center gap-8 w-full">
					<h1 class="
						w-full
						text-center
						font-extrabold text-white
						tracking-wide whitespace-nowrap
						text-[clamp(28px,8vw,120px)]
					">
						ft_transcendence
					</h1>
					<div class="w-full max-w-[95vw] sm:max-w-5xl lg:max-w-12xl">
        		${this.slider.render()}
					</div>
				</div>
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
