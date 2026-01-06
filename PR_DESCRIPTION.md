# Pull Request: feature/#43 -> dev

## 🚀 概要 (Overview)

* **実装内容:** リモート機能の実装とそれにあたりpingpong3D実装の平準化
    * 複数PC間でPongゲームをリアルタイム対戦できるリモートプレイヤー機能の実装
    * WebSocketを用いたリアルタイム通信基盤の構築
    * マイクロサービスアーキテクチャに基づく`be_connect`サービスの新規追加
    * pingpong3D実装の統一と改善（ローカル2P・AI・リモート対戦のサポート）
    * ゲーム状態の同期とマッチングシステムの実装

---

## 💡 変更点 (Changes)

### **バックエンド**

#### **新規サービス: `backends/connect/`**
リモート対戦のマッチング・ルーム管理・ゲーム状態同期を担当する新規マイクロサービス

* `backends/connect/srcs/game/readyEngine.ts` (294行)
  - WebSocketベースのリアルタイムゲームエンジン実装
  - プレイヤー入力の処理・ゲーム状態の管理・ボール物理演算
  - カウントダウン・スコア管理・ゲーム終了判定
  - クライアントへの状態ブロードキャスト機能

* `backends/connect/srcs/routes/api/connect/rooms/index.ts` (92行)
  - ルーム作成・参加・ステータス確認のREST APIエンドポイント
  - `/api/connect/rooms` - ルーム作成
  - `/api/connect/rooms/:roomId/join` - ルーム参加
  - `/api/connect/rooms/:roomId/status` - ルームステータス確認

* `backends/connect/srcs/routes/ws/connect/ready/index.ts`
  - WebSocketエンドポイント `/ws/connect/ready`
  - プレイヤーのREADY状態管理とゲーム開始制御

* `backends/connect/srcs/plugins/app/simpleRooms.ts` (48行)
  - インメモリルーム管理プラグイン
  - ルームの作成・参加・ステータス管理
  - マッチング状態の追跡

* `backends/connect/srcs/game/GameState.ts` (50行)
  - ゲーム状態の型定義とデータ構造

* `backends/connect/srcs/schemas/rooms.ts` (40行)
  - TypeBoxによるルーム関連APIのスキーマ定義
  - バリデーションとSwagger自動生成

* `backends/connect/srcs/types/room_type.ts`
  - ルーム関連の型定義

#### **既存サービス: `backends/game/`**
* `backends/game/srcs/routes/api/game/ws/index.ts`
  - WebSocket対応の追加

### **フロントエンド**

#### **リモート対戦ページ: `frontend/src/pages/pingpong_3D_remote/`**
* `frontend/src/pages/pingpong_3D_remote/index.ts` (235行)
  - リモート対戦待機画面の実装
  - ルーム作成・参加フロー
  - WebSocketによるマッチング状態のポーリング
  - READY状態管理とゲーム開始カウントダウン
  - ゲーム画面への遷移処理

#### **pingpong3D実装の改善**
* `frontend/src/pages/pingpong_3D/` 配下の各種コンポーネント
  - リモート対戦対応のための改修
  - 入力制御の統一化
  - babylon.jsを使用した3D描画

* `frontend/src/pages/pingpong_3D/object/player/RemoteController.ts`
  - リモートプレイヤー用のコントローラー実装
  - WebSocketを通じた入力送信と状態受信

* `frontend/src/utils/pingpong3D/gameSettings.ts` (76行)
  - ゲーム設定の統一管理
  - ローカル・AI・リモート対戦の設定切り替え

#### **ローカル対戦の改善**
* `frontend/src/pages/pingpong/` 配下
  - 2Dバージョンのpingpong実装
  - キーボード操作の改善（WASD/Arrow keys対応）

### **インフラストラクチャ**

* `docker-compose.local.yml`
  - `be_connect` サービスの追加 (port: 8083)
  - マイクロサービス間の依存関係設定

* `nginx/` 配下
  - `/api/connect/*` へのルーティング追加
  - WebSocketプロキシ設定 `/ws/connect/*`

---

## ✅ 確認事項 (Verification Checklist)

* **テスト環境:** ローカル開発環境（Docker Compose）
* **確認手順:**
    1. 開発環境の起動
       ```bash
       make up
       # または
       docker-compose -f docker-compose.local.yml up
       ```
    2. ブラウザで `https://localhost:8443` にアクセス
    3. **ローカル対戦（2P）のテスト**
       - pingpong（2D版）ページにアクセス
       - 2プレイヤーモードを選択
       - Player1: W/S キー、Player2: ↑/↓ キーで操作確認
       - スコアが正常にカウントされることを確認
    4. **ローカル対戦（AI）のテスト**
       - AIモードを選択
       - AIが自動的にパドルを操作することを確認
       - ゲームプレイが正常に進行することを確認
    5. **ローカル対戦（AI・設定変更）のテスト**
       - pingpong_3D_config ページにアクセス
       - パワーアップ・マップ設定を変更
       - 変更した設定でAI対戦を開始
       - カスタマイズが反映されていることを確認
    6. **リモート対戦のテスト**
       - pingpong_3D_remote ページにアクセス
       - 【ルーム作成側】"Create Room" ボタンをクリック
       - Room IDをコピー
       - 【参加側】別のブラウザ/タブで同じページを開き、Room IDを入力して "Join Room"
       - 両者が "READY" ボタンを押す
       - カウントダウン後、ゲームが開始されることを確認
       - 両者のパドル操作がリアルタイムで同期されることを確認
       - ボールの動きとスコアが同期されることを確認
       - ゲーム終了時の処理を確認

* **その他特記事項:**
    - WebSocket通信を使用しているため、nginx経由でのアクセスが必要
    - リモート対戦は現在インメモリで管理されており、サーバー再起動時にルーム情報は消失
    - マイクロサービスアーキテクチャに基づき `be_connect` サービスを新規追加
    - TypeScript型安全性の確保（TypeBox使用）
    - Fastify WebSocketプラグインの利用

---

## テストケース

| No | カテゴリ | フェーズ | 内容 | 想定動作 | 結果 |
|  :--- |  :--- |  :--- |  :--- | :--- | :--- |
| 1 | 正常系 | ローカル対戦（2P） | 2プレイヤーモードでゲーム実行 | 両プレイヤーが操作可能、スコア正常 | ✅ OK |
| 2 | 正常系 | ローカル対戦（AI） | AIモードでゲーム実行 | AIが自動操作、ゲーム進行正常 | ✅ OK |
| 3 | 正常系 | ローカル対戦（AI・設定変更） | カスタム設定でAI対戦実行 | 設定が反映され、ゲーム進行正常 | ✅ OK |
| 4 | 正常系 | リモート対戦 | 別PC/ブラウザで対戦実行 | マッチング成功、リアルタイム同期 | ✅ OK |
| 5 | 準正常系 | リモート対戦・参加失敗 | 存在しないRoom IDで参加試行 | エラーメッセージ表示 | ✅ OK |
| 6 | 準正常系 | リモート対戦・ルーム満員 | 既に2名参加済みのルームへ参加試行 | エラーメッセージ表示 | ✅ OK |
| 7 | 異常系 | リモート対戦・通信切断 | ゲーム中にWebSocket切断 | 接続エラー検知、適切な処理 | ⚠️ 要改善 |
| 8 | 性能 | リモート対戦・レイテンシ | 通常ネットワーク環境での遅延 | 遅延があるが操作可能 | ⚠️ 要改善 |

**凡例:**
- ✅ OK: 正常動作確認済み
- ⚠️ 要改善: 動作するが改善の余地あり
- ❌ NG: 問題あり（修正必要）

---

## 残課題

### 高優先度
- [ ] **通信速度の改善**
  - 現状: ボールの速度が遅く、UXが悪い（TICK_MS = 33ms、BALL_SPEED = 0.02）
  - 考えている対応策:
    - クライアントサイドでの予測レンダリング（Client-side prediction）の実装
    - サーバーからの更新頻度の最適化（現在33ms間隔）
    - 補間処理（Interpolation）の追加
    - 送信データのサイズ最適化
  - 想定工数: 8-12h

- [ ] **切断管理の強化**
  - 現状: WebSocket切断時の処理が不十分
  - 必要な対応:
    - 再接続ロジックの実装
    - タイムアウト検知とハートビート機構
    - 切断時のゲーム状態保存・復元
    - 相手プレイヤーへの通知
  - 想定工数: 6-8h

- [ ] **ユーザーIDの利用**
  - 現状: ローカルストレージでUUID生成（仮実装）
  - 必要な対応:
    - ユーザー管理サービスとの連携
    - 認証済みユーザーIDの利用
    - セッション管理の統合
  - 想定工数: 4-6h

### 中優先度
- [ ] **認証を通す**
  - 現状: 認証なしでリモート対戦が可能
  - 必要な対応:
    - JWTトークンによる認証チェック
    - WebSocket接続時の認証検証
    - セッション管理の統合
  - 想定工数: 6-8h

- [ ] **通信待機画面をリッチにする**
  - 現状: シンプルな待機画面
  - 改善案:
    - アニメーション追加
    - 相手プレイヤー情報の表示
    - チャット機能の追加
    - ルーム設定（難易度・ルール等）
  - 想定工数: 8-10h

- [ ] **ラリー数をカウント**
  - 現状: スコアのみ表示
  - 追加機能:
    - 連続ラリー数の記録・表示
    - 最長ラリー記録
    - 統計情報の保存
  - 想定工数: 3-4h

### 低優先度
- [ ] **ゲーム終了時のエフェクト**
  - 勝敗アニメーション
  - リザルト画面の充実
  - リプレイ機能
  - 想定工数: 4-6h

- [ ] **データベース永続化**
  - 現状: インメモリ管理（サーバー再起動で消失）
  - 改善案:
    - SQLiteを使用したルーム情報の永続化
    - ゲーム履歴の保存
    - マッチング履歴の記録
  - 想定工数: 6-8h

- [ ] **観戦機能**
  - 進行中のゲームを第三者が観戦できる機能
  - 想定工数: 8-10h

---

## 技術的な詳細

### **アーキテクチャ**
- マイクロサービスアーキテクチャの採用
- サービス分離:
  - `be_common`: 共通ユーザー管理
  - `be_game`: ゲーム履歴・統計
  - `be_text_chat`: チャット機能
  - `be_connect`: リモート対戦マッチング・状態同期（新規）

### **通信プロトコル**
- REST API: ルーム作成・参加・ステータス確認
- WebSocket: リアルタイムゲーム状態同期
- メッセージフォーマット: JSON

```typescript
// クライアント → サーバー
{
  type: "connect" | "ready" | "input",
  roomId?: string,
  userId?: string,
  payload?: { action: "up" | "down" | "stop" }
}

// サーバー → クライアント
{
  type: "game:start" | "game:state" | "game:end",
  payload: {
    startAt?: number,
    state?: GameState,
    winner?: "p1" | "p2"
  }
}
```

### **ゲームループ**
- サーバーサイドで33ms間隔のティック処理
- 物理演算・衝突判定をサーバーで実行
- クライアントは描画のみ（現在）
- 将来的にクライアント予測の追加を検討

### **型安全性**
- TypeScript + TypeBox によるエンドツーエンドの型安全性
- Fastify Type Provider による自動型推論
- Swagger自動生成

---

## 依存関係の変更

### 新規追加パッケージ
- `@fastify/websocket`: WebSocket サポート
- `uuid`: ルームID生成
- `ws`: WebSocket実装（@fastify/websocket の依存）

### 既存パッケージ（変更なし）
- `fastify`: バックエンドフレームワーク
- `@fastify/type-provider-typebox`: 型安全なスキーマ
- `babylon.js`: 3Dグラフィックス
- `tailwindcss`: CSSフレームワーク

---

## セキュリティ考慮事項

### 現状の実装
- ✅ TypeBoxによる入力バリデーション
- ✅ WebSocketメッセージの型チェック
- ⚠️ 認証なし（将来的に実装予定）
- ⚠️ レート制限なし

### 今後の対策
- JWT認証の統合
- WebSocket接続時の認証チェック
- メッセージレート制限
- 不正な入力値の検証強化

---

## パフォーマンス

### 現在の性能
- ティックレート: 30 FPS (33ms間隔)
- WebSocketメッセージサイズ: ~200-300バイト/tick
- 同時接続: テスト環境で2-4ルーム（4-8接続）

### 改善計画
- クライアント予測による体感レスポンス向上
- 差分送信によるデータ量削減
- 接続プーリングの最適化

---

## 関連Issue・PR

- Close #43 (リモートプレイヤー対決の実装)
- 関連: IV.4 ゲームプレイとユーザー体験 - メジャーモジュール：リモートプレイヤー対応

---

## レビュー観点

以下の観点で特にレビューをお願いします：

1. **アーキテクチャ設計**
   - マイクロサービス分離の妥当性
   - 責務分割の適切さ

2. **型安全性**
   - TypeScript型定義の網羅性
   - anyの使用箇所（現在なし）

3. **WebSocket通信**
   - プロトコル設計の妥当性
   - エラーハンドリングの充実度

4. **ゲームロジック**
   - 物理演算の正確性
   - 同期処理の実装

5. **パフォーマンス**
   - レイテンシ対策
   - スケーラビリティ

6. **セキュリティ**
   - 入力バリデーション
   - 将来の認証統合への対応

---

## 補足資料

- [ft_transcendence 仕様書（日本語）](./subjects/ja.subject.md)
- [Issue #43: リモートプレイヤー対決の実装](https://github.com/yyamasak02/ft_transcendence/issues/43)
- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Fastify WebSocket Plugin](https://github.com/fastify/fastify-websocket)
