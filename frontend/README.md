# fe_transcendence

## ディレクトリ構成

```
.
├── index.html              # エントリーポイントHTML
├── package.json            # プロジェクトの依存関係と設定
├── tsconfig.json           # TypeScript設定ファイル
├── vite.config.ts          # Viteビルドツール設定
├── public/                 # 静的ファイル
└── src/                    # ソースコード
    ├── main.ts             # アプリケーションのエントリーポイント
    ├── style.css           # グローバルスタイル
    ├── vite-env.d.ts       # Vite環境の型定義
    ├── components/         # 再利用可能なコンポーネント
    │   ├── navbar.ts       # ナビゲーションバーコンポーネント
    │   └── navbar.css      # ナビゲーションバーのスタイル
    ├── pages/              # ページコンポーネント
    │   ├── 404/
    │   │   └── index.ts    # 404エラーページ
    │   ├── home/
    │   │   └── index.ts    # ホームページ
    │   └── pingpong/       # ピンポンゲームページ
    │       ├── index.ts    # ピンポンメインページ
    │       ├── styles.css  # ピンポンページのスタイル
    │       └── scripts/    # ゲームロジック
    │           ├── data.ts # ゲームデータ管理
    │           ├── draw.ts # 描画処理
    │           ├── game.ts # ゲームメインロジック
    │           ├── play.ts # プレイ制御
    │           ├── state.ts # 状態管理
    │           └── ui.ts   # UI制御
    ├── router/             # ルーティング関連
    │   ├── index.ts        # ルーターエクスポート
    │   ├── router.ts       # ルーター実装
    │   └── routes.ts       # ルート定義
    └── types/              # TypeScript型定義
        ├── component.ts    # コンポーネントの型
        └── routes.ts       # ルーティングの型
```
