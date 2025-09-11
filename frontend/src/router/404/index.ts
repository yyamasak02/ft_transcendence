import type { Routes } from "@/models/routes";

const html = '<h1>404 - Not Found</h1><a href="/">Go Home</a>';
const css = "h1 { color: steelblue; }";
const javascript = () => {
  console.log("404");
};

export const NotFoundRoute: Routes = {
  "/404": {
    title: "404",
    component: {
      html,
      css,
      javascript,
    },
  },
};
