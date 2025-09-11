export type Route = {
  linkLabel: string;
  content: string;
  onMount?: () => void | Promise<void>; // ← ページ初期化処理
  onUnmount?: () => void | Promise<void>; // ← ページ終了処理
  head?: {
    title?: string;
  };
};

export type Routes = Record<string, Route>;
