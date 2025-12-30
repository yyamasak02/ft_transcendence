import type { Route } from "@/types/routes";
import type { Component } from "@/types/component";
import { word } from "@/i18n";

class HomeComponent implements Component {
  render = () => {
    return `<h1>ft_transcendence</h1>`;
  };
}

export const HomeRoute: Route = {
  linkLabel: () => word("home"),
  content: () => new HomeComponent().render(),
};
