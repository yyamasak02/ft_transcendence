// src/i18n/ja.ts
export const ja = {
  // navbar
  home: "ホーム",
  pingpong: "ピンポン",
  pingpong3d: "3Dピンポン",
  pingpong3d_config: "3Dピンポン設定",
  login: "ログイン",
  websocket: "ウェブソケット",
  home_return: "ホームに戻る",
  
  // setting
  score_to_win: "勝利に必要な得点:",
  ball_speed: "ボールスピード:",
  count_speed: "カウントダウンの速さ:",
  fast: "速い (x2)",
  normal: "普通",
  slow: "遅い (x0.5)",
  stage: "ステージ:",
  classic: "クラッシック",
  shadow: "シャドー",
  warp: "ワープ",
  color1: "プレイヤー1の色:",
  color2: "プレイヤー2の色:",
  blue: "青",
  green: "緑",
  red: "赤",
  yellow: "黄",
  white: "白",
  black: "黒",
  pink: "ピンク",
  length: "パドルの長さ",
  start: "ゲームスタート",
  
  settings: "設定",
  pause: "一時停止",
  resume: "続行",
  reset: "リセット",
  camera_reset: "カメラ リセット",
  
  // login, register
  username: "ユーザー名",
  password: "パスワード",
  password_confirm: "パスワード再入力",
  keep_login: "ログイン保持",
  enter: "決定",
  
  // finish
  wins: "勝利!",
  player1: "プレイヤー１",
  player2: "プレイヤー２",
  
  // setting
  press_enter: "'Enter'を押すとスタートします",
  local: "ローカルバトル",
  online: "オンラインバトル",
  select_game_mode: "ゲームモード選択",
  select_method: "w/s 又は ↑/↓ キーで選べます",
  
  // login, register
  confirm: "Enterを押すと決定します",
  signup: "新規登録",
  register: "登録",
  email: "メールアドレス",
  to_signup: "新規登録へ",
  to_login: "ログインページへ",
  other_login_methods: "その他のログイン方法",
  
  // google
  google_signup: "Google登録",
  google_signup_desc: "Google認証が完了しました。ユーザー名を入力してください。",
  google_signup_missing: "Google認証が見つかりません。ログインし直してください。",
  login_failed: "ログインに失敗しました",
  register_failed: "登録に失敗しました",
  google_login_failed: "Googleログインに失敗しました",
  google_signup_failed: "Google登録に失敗しました",
  google_login_processing: "Googleログインを処理中...",
  google_login_success: "Googleログインに成功しました。",
  google_login_error: "Googleログイン中にエラーが発生しました",
  google_client_id_missing: "環境変数 VITE_GOOGLE_CLIENT_ID が設定されていません。",
  google_script_load_failed: "Googleスクリプトの読み込みに失敗しました",
  
  // login
  login_required: "メールアドレスとパスワードを入力してください。",
  email_required: "メールアドレスを入力してください。",
  email_invalid: "メールアドレスの形式が正しくありません。",
  email_taken: "そのメールアドレスは既に使われています。",
  login_success: "ログインに成功しました。",
  login_error: "ログイン中にエラーが発生しました",
  register_required: "すべての項目を入力してください。",
  username_required: "ユーザー名を入力してください。",
  username_min_length: "ユーザー名は5文字以上で入力してください。",
  username_roman_only: "ユーザー名は英数字のみで入力してください。",
  username_taken: "そのユーザー名は既に使われています。",
  
  // profile
  current_username: "現在のユーザー名",
  username_change: "ユーザー名変更",
  username_change_desc: "新しいユーザー名を設定します。",
  username_change_action: "ユーザー名を変更",
  username_change_submit: "変更する",
  username_change_success: "ユーザー名を変更しました。",
  username_change_failed: "ユーザー名の変更に失敗しました。",
  username_change_required: "新しいユーザー名を入力してください。",
  username_change_back: "ユーザーメニューへ戻る",
  login_required_for_change: "ユーザー名の変更にはログインが必要です。",
  
  // password
  password_min_length: "パスワードは8文字以上で入力してください。",
  password_mismatch: "パスワードが一致しません。",
  register_success: "登録が完了しました。ログインしてください。",
  register_error: "登録中にエラーが発生しました",
  
  other_signup_methods: "その他の登録方法",
  
  // profile
  recent_matches: "直近10試合",
  no_matches: "試合結果がありません。",
  ai_opponent: "AI",
  result_win: "勝ち",
  result_lose: "負け",
  result_draw: "引き分け",
  match_results: "試合結果",
  match_results_fetch_failed: "試合結果の取得に失敗しました。",
  
  match_summary: "勝敗",
  user_search_placeholder: "ユーザー名で検索",
  user_search_button: "検索",
  user_profile_status: "オンライン状況",
  user_profile_online: "オンライン",
  user_profile_offline: "オフライン",
  user_profile_not_found: "ユーザーが見つかりません。",
  user_search_failed: "ユーザーの検索に失敗しました。",
  user_search_self: "自分自身は検索できません。",
  
  my_profile: "マイプロフィール",
  profile_image_change: "変更",
  profile_image_upload: "PNGをアップロード",
  profile_image_alt: "プロフィール画像",
  profile_image_invalid_type: "PNGのみアップロードできます。",
  profile_image_too_large: "画像サイズは1MB以下にしてください。",
  
  friends: "フレンド",
  friends_empty: "フレンドがいません。",
  friend_request_button: "フレンド申請",
  friend_request_sent: "フレンド申請を送信しました。",
  friend_request_failed: "フレンド申請の送信に失敗しました。",
  friend_remove_button: "フレンド解除",
  friend_remove_done: "フレンドを解除しました。",
  friend_remove_failed: "フレンド解除に失敗しました。",
  friend_status_pending_incoming: "フレンド申請中",
  friend_status_pending_outgoing: "申請送信済み",
  friend_accept: "はい",
  friend_decline: "いいえ",
  
  user_menu: "ユーザー",
  
  // 2FA
  two_factor: "2段階認証",
  two_factor_desc: "アカウント保護のため2段階認証を有効化します。",
  two_factor_enable: "2段階認証を有効化",
  two_factor_enabled: "2段階認証を有効化しました。表示されたトークンを認証アプリに登録してください。",
  two_factor_failed: "2段階認証の有効化に失敗しました",
  two_factor_missing_login: "ログインが必要です。",
  two_factor_title: "2段階認証",
  two_factor_prompt: "認証アプリの6桁コードを入力してください。",
  two_factor_code: "認証コード",
  two_factor_verify: "認証する",
  two_factor_missing: "2段階認証の情報がありません。再ログインしてください。",
  two_factor_code_required: "認証コードを入力してください。",
  two_factor_verify_failed: "2段階認証に失敗しました",
  two_factor_already_enabled: "2段階認証は有効済みです。",
  
  // setting
  player2Type: "対戦相手",
  easyLv: "AI(弱い)",
  normalLv: "AI(普通)",
  hardLv: "AI(強い)",
  how_to_play: "遊び方",
  collapse_mode: "崩落モード:",
  collapse_explanation: "10ラリー毎にステージが崩落する",
  further: "もっと前へ!!!",
  
  // profile
  logout: "ログアウト",
  
  // setting
  remote: "リモート",
  guest: "ゲスト",
  host: "ホスト",
  connection_mode: "接続モード",
  room_id: "ルームID",
  remote_wait_for: "リモート 対戦 待機中",
  remote_status: "ステータス",
  remote_ready_message: "マッチ成立。READYを押してください。",
  remote_ready: "READY",
  remote_start: "スタート!",
  remote_no_room_id_message: "RoomID がありません。",
  remote_ready_done_waiting_message: "READY 済み。相手を待っています…",
  remote_connecting_and_send_ready_message: "接続中… READY を送信します",
  remote_game_starting_in: "開始まで",
  seconds_unit: "秒",
  remote_game_started: "ゲーム開始！",
  
  unknown_user: "不明なユーザー",
  
  mode_local: "ローカル対戦",
  mode_local_desc: "1台で対戦",
  mode_host: "ルーム作成",
  mode_host_desc: "ホストになる",
  mode_guest: "ルーム参加",
  mode_guest_desc: "IDを入力して参加",
  
  room_id_placeholder_host: "自動生成されます...",
  room_id_placeholder_guest: "ルームIDを入力",
  click_to_copy: "クリックしてコピー",
  copied: "コピーしました！",
  failed: "失敗しました！",
  
  htp_page1: '<span class="highlight">高得点のためにボールを逃すな</span>',
  htp_page2: '<span class="key">W</span> <span class="key">S</span> または <span class="key">↑</span> <span class="key">↓</span> キーでパドルを動かします。',
  htp_page3: "画面をドラッグ（スワイプ）してカメラを回転させます。",
  htp_page4: "画面右上のボタンで、一時停止、カメラリセット、設定変更ができます。",
	
  // terms
  terms: "利用規約",
	update: "最終更新日:",
	terms1: "本アプリケーションは、教育プログラムの一環として開発された学生プロジェクトです。",
	terms2: "本アプリケーションにアクセスまたは利用することにより、以下の利用規約に同意したものとみなされます。",
	
  terms_l1: "本アプリケーションは、明示的または黙示的を問わず、いかなる保証もなく「現状のまま」提供されます。",
	terms_l2: "本アプリケーションの利用により生じたいかなる損害、データ損失、その他の問題についても、開発者は一切の責任を負いません。",
	terms_l3: "本サービスは、事前の通知なく、変更・停止・終了される場合があります。",
	terms_l4: "本アプリケーションを違法、有害、または悪意のある目的で利用しないことに同意するものとします。",
	terms3: "これらの利用規約に同意いただけない場合は、本アプリケーションの利用を中止してください。",

  // privacy
	privacy: "プライバシーポリシー",
	privacy_s: "本プライバシーポリシーは、本アプリケーションがどのようにユーザー情報を収集、利用、保護するかについて説明するものです。本プロジェクトは教育目的で開発されており、商業利用を目的としたものではありません。",

	privacy_1_t: "1. 収集する情報",
	privacy_1_s: "本アプリケーションの利用方法に応じて、以下の情報を収集する場合があります。",
	privacy_1_l1: "ユーザー名",
	privacy_1_l2: "メールアドレス",
	privacy_1_l3: "OAuthプロバイダー（Google、GitHub、42など）を通じた認証情報",
	privacy_1_l4: "ゲーム関連データ（スコア、対戦履歴、設定など）",
	privacy_1_l5: "二要素認証（2FA）の設定状況",

	privacy_2: "2. 情報の利用目的",
	privacy_2_l1: "ユーザー認証のため",
	privacy_2_l2: "マルチプレイヤー機能およびゲーム機能の提供のため",
	privacy_2_l3: "ユーザーアカウントおよびプロフィールの管理のため",
	privacy_2_l4: "アプリケーション機能の改善のため",

	privacy_3: "3. データの保存",
	privacy_3_s1: "ユーザーデータは、コンテナ化された開発環境内のデータベース（例：SQLite）に保存されます。アクセスはプロジェクトメンバーに限定されています。",
	privacy_3_s2: "本プロジェクトは、ユーザーデータを意図的に第三者へ共有することはありません。",

	privacy_4: "4. OAuth認証",
	privacy_4_s1: "Google、GitHub、42などの外部認証プロバイダーを利用する場合、それぞれの認可ポリシーに従い、基本的なプロフィール情報を取得します。",
	privacy_4_s2: "詳細については、各プロバイダーのプライバシーポリシーをご参照ください。",
	privacy_4_l1: "Google プライバシーポリシー",
	privacy_4_l2: "GitHub プライバシーポリシー",
	privacy_4_l3: "42 Intranet ポリシー",

	privacy_5: "5. データ保持期間",
	privacy_5_s1: "ユーザーデータは、プロジェクト期間中保持される場合があります。",
	privacy_5_s2: "技術的に可能な範囲で、ユーザーからの要請に応じてアカウントを削除することができます。",
	privacy_5_s3: "アカウントおよび関連データの削除をご希望の場合は、プロジェクトチームまでご連絡ください。",
	privacy_5_s4: "削除のご依頼には、技術的に可能な範囲で対応いたします。",

	privacy_6: "6. セキュリティ",
	privacy_6_s: "以下を含む合理的なセキュリティ対策を実施しています。",
	privacy_6_l1: "JWTベースの認証",
	privacy_6_l2: "二要素認証（2FA）対応",
	privacy_6_l3: "安全なコンテナ化バックエンドサービス",

	privacy_7: "7. 免責事項",
	privacy_7_s: "本アプリケーションは学生プロジェクトであるため、本番環境レベルのセキュリティや完全性を保証するものではありません。",

	privacy_8: "8. お問い合わせ",
	privacy_8_s: "プライバシーに関するご質問は、リポジトリまたは公式の連絡手段を通じてプロジェクトチームまでお問い合わせください。",

  // not found
  notfound: "ページが見つかりません",
} as const;
