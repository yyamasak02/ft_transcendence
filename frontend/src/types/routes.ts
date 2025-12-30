export type RouteMeta = {
  showInNavbar?: boolean;
  navbarOrder?: number;
  navbarLabelKey?: string;
};

/**
 * ルーティング情報の型定義
 * @module models/routes
 * @type {Route, Routes}
 * @description 各ページのルーティング情報を定義する型を提供します。
 * @see {@link Route}, {@link Routes}
 * @example
 * // ルーティング情報の例
 * const routes: Routes = {
 *  home: {
 *    linkLabel: "Home",
 *    content: "Welcome to the homepage",
 *    onMount: () => { console.log("Home mounted"); },
 *    onUnmount: () => { console.log("Home unmounted"); },
 *    head: {
 *      title: "Home Page"
 *    }
 *  },
 * }
 */
export type Route = {
  linkLabel?: string | (() => string);
  content: string | (() => string);
  onMount?: () => void | Promise<void>;
  onUnmount?: () => void | Promise<void>;
  head?: {
    title?: string;
  };
};

export type RouteConfig = {
  component: Route;
  show_navbar: boolean;
  layout: string;
};

export type Routes = Record<string, RouteConfig>;
