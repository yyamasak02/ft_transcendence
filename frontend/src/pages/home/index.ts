import type { Route } from "@/types/routes";
import { word } from "@/i18n";

class HomeComponent {
  render = () => {
    return "<h1>ft_transcendence</h1>";
  };
}

export const HomeRoute: Record<string, Route> = {
  "/": {
    linkLabel: word("home"),
    content: new HomeComponent().render(),
  },
};
