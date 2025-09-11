import type { Route } from "@/types/routes";

class HomeComponent {
  render = () => {
    return "<h1>Home Page</h1>";
  };
}

export const HomeRoute: Record<string, Route> = {
  "/": {
    linkLabel: "Home",
    content: new HomeComponent().render(),
  },
};
