import type { Route } from "@/types/routes";
import { HomeRoute } from "@/pages/home";
import { PingPongRoute } from "@/pages/pingpong";

export const routes: Record<string, Route> = {
  "/": HomeRoute["/"],
  "/pingpong": PingPongRoute["/pingpong"],
};
