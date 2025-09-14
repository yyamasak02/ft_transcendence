# Common Backend Service

## 概要

共通データベース管理用のバックエンドサービス

## フォルダ構造

```
backends/common/
├── srcs/                   # ソースコード
│   ├── index.ts           # エントリーポイント
│   └── utils/             # ユーティリティ
│       ├── migrate.ts     # マイグレーション処理
│       └── seed.ts        # シード処理
├── init_db/               # データベース初期化
│   ├── migrations/        # マイグレーションファイル
│   │   └── 001_create_users.sql
│   └── seeders/           # シードファイル
├── db/                    # SQLiteデータベース格納
├── docker/                # Docker設定
│   └── Dockerfile
├── package.json           # 依存関係
├── tsconfig.json          # TypeScript設定
└── nodemon.json           # 開発用設定
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

### ビルド

```bash
npm run build
npm start
```
