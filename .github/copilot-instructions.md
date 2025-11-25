下記に、レビュー時のルールを記載します。こちらに従いレビューを実施してください。

# 使用言語
- 日本語

# 言語、フレームワーク、ライブラリ
- backends: fastify(TypeScript), sqlite3
- frontend: vanilla TypeScript, tailwind, babylon.js

# フォルダ構造
- backends: バックエンド, 直下のディレクトリはサービスごとに分けています
- frontend: フロントエンド
- mock
- nginx: リバースプロキシ
- subjects: 今回の要件が記載された資料です

# アーキテクチャ方針
- マイクロサービス

# アンチパターン
- typescriptでの実装のためそれを損なうような実装を抑制したい。
  - 暗黙、強制的な型変換
  - any型の使用
