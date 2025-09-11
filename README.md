# ft_transcendence

42 Cursusの最終プロジェクト「ft_transcendence」のリポジトリです。

## ディレクトリ構成

```
ft_transcendence/
├── README.md
├── docker-compose.yml
├── Makefile
├── .pre-commit-config.yaml
├── eslint.config.js
├── package.json
├── subjects/
│   ├── en.subject.pdf
│   └── ja.subject.md
└── frontend/
    ├── README.md
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── eslint.config.js
    ├── tsconfig.json
    ├── index.html
    ├── public/
    └── src/
        ├── main.ts
        ├── style.css
        ├── components/
        ├── pages/
        ├── router/
        └── types/
```

## 環境構築

### 要求

- Docker & Docker Compose
- Make

### 手順

1. リポジトリのクローン

   ```bash
   git clone <repository-url>
   cd ft_transcendence
   ```

2. 開発環境の起動

   ```bash
   make up
   ```

3. アクセス
   ```
   http://localhost:5173
   ```

## 使用ライブラリ・技術スタック

### フロントエンド

- **TypeScript** - 型安全なJavaScript
- **Vite** - 高速ビルドツール
- **Tailwind CSS v4** - ユーティリティファーストCSS

### 開発ツール

- **Docker** - コンテナ化
- **ESLint** - コード品質管理
- **Prettier** - コードフォーマッター
- **Pre-commit hooks** - コード品質の自動チェック

## 📚 参考資料

- [英語版仕様書](./subjects/en.subject.pdf)
- [日本語版仕様書](./subjects/ja.subject.md)
- [フロントエンド詳細](./frontend/README.md)
