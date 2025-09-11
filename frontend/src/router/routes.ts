import type { Route } from "@/models/routes";
import { HomeRoute } from "./home";
import { PingPongRoute } from "./pingpong";

export const routes: Record<string, Route> = {
  "/": HomeRoute["/"],
  "/pingpong": PingPongRoute["/pingpong"],
};
