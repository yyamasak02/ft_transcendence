// pingpong_3D/helpSlider.ts データだけを作る
import { t } from "@/i18n";

export type HelpSlide = {
  image: string;
  desc: string;
};

export const HELP_SLIDES: HelpSlide[] = [
  {
    image: "/howToPlay/page1.png",
    desc: t("htp_page1"),
  },
  {
    image: "/howToPlay/page2.png",
    desc: t("htp_page2"),
  },
  {
    image: "/howToPlay/page3.png",
    desc: t("htp_page3"),
  },
  {
    image: "/howToPlay/page4.png",
    desc: t("htp_page4"),
  },
];
