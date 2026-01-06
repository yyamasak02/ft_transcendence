# PR作成手順ガイド: feature/#43 -> dev

このドキュメントは、feature/#43ブランチからdevブランチへのPull Requestを作成する手順を説明します。

## 📋 前提条件

- [x] `PR_DESCRIPTION.md` が作成されている
- [x] `PR_SUMMARY.txt` が作成されている
- [x] すべてのコミットがpushされている

## 🚀 PR作成手順

### 1. GitHubでPRを作成

1. リポジトリページにアクセス
   ```
   https://github.com/yyamasak02/ft_transcendence
   ```

2. "Pull requests" タブをクリック

3. "New pull request" ボタンをクリック

4. ブランチを選択:
   - **base**: `dev`
   - **compare**: `feature/#43` または `copilot/feature43-implement-remote-functionality`

5. "Create pull request" をクリック

### 2. PR情報を入力

#### タイトル
以下のいずれかを使用:
```
リモートプレイヤー対決機能の実装 (#43)
```
または
```
feat: リモート対戦機能とpingpong3D実装の平準化 (#43)
```

#### 本文（Description）
`PR_DESCRIPTION.md` の内容を**すべてコピー&ペースト**してください。

または、以下の簡略版を使用:

```markdown
## 🚀 概要 (Overview)

* **実装内容:** リモート機能の実装とそれにあたりpingpong3D実装の平準化
    * 複数PC間でPongゲームをリアルタイム対戦できるリモートプレイヤー機能の実装
    * WebSocketを用いたリアルタイム通信基盤の構築
    * マイクロサービスアーキテクチャに基づく`be_connect`サービスの新規追加
    * pingpong3D実装の統一と改善（ローカル2P・AI・リモート対戦のサポート）
    * ゲーム状態の同期とマッチングシステムの実装

---

## 💡 主要な変更点

### バックエンド
- **新規サービス `be_connect`** 追加（マイクロサービス）
  - WebSocketベースのリアルタイムゲームエンジン
  - REST API（ルーム作成・参加・ステータス）
  - TypeBoxによる型安全なスキーマ定義

### フロントエンド
- **pingpong_3D_remote** ページ追加
  - リモート対戦待機・マッチング画面
  - WebSocketクライアント実装
- ゲーム設定の統一管理

### インフラ
- docker-compose.local.yml に be_connect 追加
- nginx ルーティング設定

---

## ✅ テスト結果

| 項目 | 結果 |
|:---|:---|
| ローカル対戦（2P） | ✅ OK |
| ローカル対戦（AI） | ✅ OK |
| ローカル対戦（AI・設定変更） | ✅ OK |
| リモート対戦 | ✅ OK |

---

## 残課題

### 高優先度
- 通信速度の改善（クライアント予測、補間処理）
- 切断管理の強化（再接続、ハートビート）
- ユーザーID連携（現在は仮実装）
- 認証統合（JWT）

詳細は [PR_DESCRIPTION.md](./PR_DESCRIPTION.md) を参照してください。

---

Closes #43
```

### 3. ラベル・レビュアー設定

#### ラベル
- `enhancement`
- `機能区分：リモート対戦機能`

#### レビュアー
適切なチームメンバーを指定

#### Assignees
自分を指定

#### Milestone
該当するマイルストーンがあれば設定

### 4. PR作成完了

"Create pull request" をクリックして完了！

## 📝 補足資料

### 関連ファイル
- `PR_DESCRIPTION.md` - 詳細なPR説明（373行）
- `PR_SUMMARY.txt` - サマリー版
- `HOW_TO_CREATE_PR.md` - このファイル

### 関連Issue
- #43 - リモートプレイヤー対決の実装

### 仕様書参照
- `subjects/ja.subject.md` - IV.4 ゲームプレイとユーザー体験

## 🔍 レビュー観点

レビュアーには以下の観点で確認を依頼してください：

1. **アーキテクチャ設計**
   - マイクロサービス分離の妥当性
   - 責務分割の適切さ

2. **型安全性**
   - TypeScript型定義の網羅性
   - anyの使用抑制

3. **WebSocket通信**
   - プロトコル設計
   - エラーハンドリング

4. **ゲームロジック**
   - 物理演算の正確性
   - 同期処理

5. **パフォーマンス**
   - レイテンシ対策
   - スケーラビリティ

6. **セキュリティ**
   - 入力バリデーション
   - 認証統合への対応

## 📞 サポート

質問や問題がある場合は、以下に連絡してください：
- GitHub Issue: https://github.com/yyamasak02/ft_transcendence/issues
- 担当者: @yyamasak02
