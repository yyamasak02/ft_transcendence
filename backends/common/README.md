# Common Backend Service

## 概要

共通データベース管理用のバックエンドサービス

## フォルダ構造

```
backends/common/
├── srcs/                   # ソースコード
│   ├── plugins/           # Fastifyプラグイン
│   │   ├── app/           # アプリケーションプラグイン
│   │   └── external/      # 外部プラグイン
│   ├── routes/            # APIルート定義
│   │   └── api/
│   ├── schemas/           # TypeBox スキーマ定義
│   │   └── auth.ts        # 認証関連スキーマ
│   ├── utils/             # ユーティリティ（空）
│   ├── app.ts             # Fastifyアプリケーション設定
│   └── index.ts           # エントリーポイント
├── scripts/               # スクリプトファイル
│   ├── migrate.ts         # マイグレーション処理
│   └── seed.ts            # シード処理
├── init_db/               # データベース初期化
│   ├── migrations/        # マイグレーションファイル
│   │   └── 001_create_users.sql
│   └── seeders/           # シードファイル
│       └── 001_users.csv
├── db/                    # SQLiteデータベース格納
├── dist/                  # ビルド出力ディレクトリ
├── docker/                # Docker設定
│   └── Dockerfile
├── package.json           # 依存関係
└── tsconfig.json          # TypeScript設定
```

## セットアップ

### インストール

```bash
npm install
```

### 開発環境

```bash
npm run dev
```

### データベースセットアップ

```bash
# マイグレーションのみ実行
npm run db:migrate

# シードのみ実行
npm run db:seed

# マイグレーション＋シード実行
npm run db:setup
```

### ビルド

```bash
npm run build
npm start
```

### FAQ

- 1. import文
  - 拡張子：".js"を書くようにする
  - ESMモジュールでは、トランスコンパイル後のjsファイルを想定して書く必要がある
