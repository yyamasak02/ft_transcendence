// src/i18n/locale/en.ts
export const en = {
  // navbar
  home: "Home",
  pingpong: "PingPong",
  pingpong3d: "PingPong 3D Play",
  pingpong3d_config: "Setting PingPong 3D",
  login: "Login",
  websocket: "WebSocket",
  home_return: "Return to Home",

  // setting
  score_to_win: "Score to Win:",
  ball_speed: "Ball Speed:",
  count_speed: "Count Speed:",
  fast: "fast (x2)",
  normal: "normal",
  slow: "slow (x0.5)",
  stage: "Stage:",
  classic: "Classic Court",
  shadow: "Shadow Court",
  warp: "Warp Court",
  color1: "Player 1 Color:",
  color2: "Player 2 Color:",
  blue: "Blue",
  green: "Green",
  red: "Red",
  yellow: "Yellow",
  white: "White",
  black: "Black",
  pink: "Pink",
  length: "Paddle Length",
  start: "Start Game",

  settings: "Settings",
  pause: "Pause",
  resume: "Resume",
  reset: "Reset",
  camera_reset: "Camera Reset",

  // login, register
  username: "Username",
  password: "Password",
  password_confirm: "Confirm Password",
  keep_login: "Keep Login",
  enter: "Enter",

  // finish
  wins: "Wins!",
  player1: "Player1",
  player2: "Player2",

  // setting
  press_enter: "Press 'Enter' to Start",
  local: "LOCAL BATTLE",
  online: "ONLINE BATTLE",
  select_game_mode: "SELECT GAME MODE",
  select_method: "Use w/s or ↑/↓ to select",

  // login, reginser
  confirm: "Press Enter to confirm",
  signup: "Sign Up",
  register: "Create an account",
  email: "Email",
  to_signup: "Create an account",
  to_login: "to Login page",
  other_login_methods: "Other login methods",

  // google
  google_signup: "Google Signup",
  google_signup_desc: "Google authentication is complete. Choose a username.",
  google_signup_missing: "Google sign-in not found. Please log in again.",
  login_failed: "Login failed",
  register_failed: "Register failed",
  google_login_failed: "Google login failed",
  google_signup_failed: "Google signup failed",
  google_login_processing: "Processing Google login...",
  google_login_success: "Google login successful.",
  google_login_error: "Google login error",
  google_client_id_missing: "VITE_GOOGLE_CLIENT_ID is not set.",
  google_script_load_failed: "Failed to load Google script",

  // login
  login_required: "Please enter email and password.",
  email_required: "Please enter an email address.",
  email_invalid: "Please enter a valid email address.",
  email_taken: "That email address is already in use.",
  login_success: "Login successful.",
  login_error: "Login error",
  register_required: "Please fill in all fields.",
  username_required: "Please enter a username.",
  username_min_length: "Username must be at least 5 characters.",
  username_roman_only: "Username must use alphanumeric characters only.",
  username_taken: "That username is already taken.",
  
  // profile
  current_username: "Current username",
  username_change: "Change Username",
  username_change_desc: "Set a new username for your account.",
  username_change_action: "Change username",
  username_change_submit: "Update",
  username_change_success: "Username updated.",
  username_change_failed: "Failed to update username.",
  username_change_required: "Please enter a new username.",
  username_change_back: "Back to User Menu",
  login_required_for_change: "Please log in to change your username.",
  
  // password
  password_min_length: "Password must be at least 8 characters.",
  password_mismatch: "Passwords do not match.",
  register_success: "Registration complete. Please log in.",
  register_error: "Registration error",
  
  other_signup_methods: "Other sign-up methods",
  
  // profile
  recent_matches: "Recent Matches",
  no_matches: "No matches yet.",
  ai_opponent: "AI",
  result_win: "Win",
  result_lose: "Lose",
  result_draw: "Draw",
  match_results: "Match Results",
  match_results_fetch_failed: "Failed to load match results.",
  
  match_summary: "Summary",
  user_search_placeholder: "Search by username",
  user_search_button: "Search",
  user_profile_status: "Status",
  user_profile_online: "Online",
  user_profile_offline: "Offline",
  user_profile_not_found: "User not found.",
  user_search_failed: "Failed to search user.",
  user_search_self: "You cannot search your own profile.",
  
  my_profile: "My Profile",
  profile_image_change: "Change",
  profile_image_upload: "Upload PNG",
  profile_image_alt: "Profile image",
  profile_image_invalid_type: "PNG files only.",
  profile_image_too_large: "Image must be 1MB or smaller.",
  
  friends: "Friends",
  friends_empty: "No friends yet.",
  friend_request_button: "Send friend request",
  friend_request_sent: "Friend request sent.",
  friend_request_failed: "Failed to send friend request.",
  friend_remove_button: "Remove friend",
  friend_remove_done: "Friend removed.",
  friend_remove_failed: "Failed to remove friend.",
  friend_status_pending_incoming: "Pending request",
  friend_status_pending_outgoing: "Request sent",
  friend_accept: "Yes",
  friend_decline: "No",
  
  user_menu: "User",
  
  // 2FA
  two_factor: "Two-Factor Authentication",
  two_factor_desc: "Enable 2FA to secure your account.",
  two_factor_enable: "Enable 2FA",
  two_factor_enabled: "2FA enabled. Register the displayed token in your authenticator app.",
  two_factor_failed: "Failed to enable 2FA",
  two_factor_missing_login: "Login is required to enable 2FA.",
  two_factor_title: "Two-Factor Verification",
  two_factor_prompt: "Enter the 6-digit code from your authenticator.",
  two_factor_code: "Verification Code",
  two_factor_verify: "Verify",
  two_factor_missing: "2FA session not found. Please log in again.",
  two_factor_code_required: "Please enter the verification code.",
  two_factor_verify_failed: "2FA verification failed",
  two_factor_already_enabled: "2FA is already enabled.",
  
  // setting
  player2Type: "Opponent",
  easyLv: "Easy",
  normalLv: "Normal",
  hardLv: "Hard",
  how_to_play: "How to play",
  collapse_mode: "Collapse mode:",
  collapse_explanation: "A stage collapses every 10 rallies",
  further: "further forward!!!",
  
  // profile
  logout: "Logout",
  
  // setting
  remote: "Remote",
  guest: "Guest",
  host: "Host",
  connection_mode: "Connection Mode",
  room_id: "Room ID",
  remote_wait_for: "Waiting for opponent",
  remote_status: "Status",
  remote_ready_message: "Match found. Press READY when you're ready.",
  remote_ready: "READY",
  remote_start: "START!",
  remote_no_room_id_message: "Room ID is missing.",
  remote_ready_done_waiting_message: "Ready. Waiting for opponent…",
  remote_connecting_and_send_ready_message: "Connecting… Sending READY",
  remote_game_starting_in: "Starting in",
  seconds_unit: "seconds",
  remote_game_started: "Game started!",
  
  unknown_user: "Unknown user",
  
  mode_local: "LOCAL MATCH",
  mode_local_desc: "1 PC, 2 Players or CPU",
  mode_host: "CREATE ROOM",
  mode_host_desc: "Be the Host",
  mode_guest: "JOIN ROOM",
  mode_guest_desc: "Join a Friend",
  
  room_id_placeholder_host: "Auto Generated...",
  room_id_placeholder_guest: "Enter Room ID",
  click_to_copy: "Click to Copy",
  copied: "Copied!",
  failed: "Copy failed!",
	
  htp_page1: '<span class="highlight">AVOID MISSING BALL FOR HIGH SCORE</span>',
  htp_page2: 'Use <span class="key">W</span> <span class="key">S</span> or <span class="key">↑</span> <span class="key">↓</span> to move your paddle.',
  htp_page3: "Drag the screen with your mouse/finger to rotate the camera.",
  htp_page4: "Use the orange buttons to Pause, Reset Camera, or adjust Settings.",
	
  // terms
  terms: "Terms of Service",
	update: "Last updated:",
	terms1: "This application is a student project developed as part of an educational program.",
	terms2: "By accessing or using this application, you agree to the following terms:",
	
  terms_l1: "This application is provided \"as is\", without warranties of any kind, express or implied.",
	terms_l2: "The developers assume no responsibility for any damages, data loss, or issues resulting from use of this application.",
	terms_l3: "The service may be modified, suspended, or discontinued at any time without prior notice.",
	terms_l4: "You agree not to use this application for any unlawful, harmful, or malicious activities.",
	terms3: "If you do not agree to these terms, please discontinue use of this application.",
	
  // privacy
  privacy: "Privacy Policy",
	privacy_s: "This Privacy Policy explains how this application collects, uses, and protects user information. This project was developed as part of an educational program and is not intended for commercial use.",
	
  privacy_1_t: "1. Information We Collect",
	privacy_1_s: "Depending on how you use the application, we may collect:",
	privacy_1_l1: "Username",
	privacy_1_l2: "Email address",
	privacy_1_l3: "Authentication information via OAuth providers (Google, GitHub, 42, etc.)",
	privacy_1_l4: "Game-related data (scores, match history, settings)",
	privacy_1_l5: "Two-Factor Authentication status",
	
  privacy_2: "2. How We Use Information",
	privacy_2_l1: "To authenticate users",
	privacy_2_l2: "To provide multiplayer and game features",
	privacy_2_l3: "To manage user accounts and profiles",
	privacy_2_l4: "To improve application functionality",
	
  privacy_3: "3. Data Storage",
	privacy_3_s1: "User data is stored in a database (e.g., SQLite) within a containerized development environment. Access is limited to project members.",
	privacy_3_s2: "This project does not intentionally share user data with third parties.",
	
  privacy_4: "4. OAuth Authentication",
	privacy_4_s1: "When using external authentication providers (Google, GitHub, 42), the application receives basic profile information according to the provider’s authorization policies.",
	privacy_4_s2: "Please refer to each provider’s privacy policy for details:",
	privacy_4_l1: "Google Privacy Policy",
	privacy_4_l2: "GitHub Privacy Policy",
	privacy_4_l3: "42 Intranet Policies",
	
  privacy_5: "5. Data Retention",
	privacy_5_s1: "User data may be retained for the duration of the project.",
	privacy_5_s2: "Accounts may be deleted upon request where technically feasible.",
	privacy_5_s3: "Users may request deletion of their account and associated data by contacting the project team.",
	privacy_5_s4: "Deletion requests will be processed where technically feasible.",
	
  privacy_6: "6. Security",
	privacy_6_s: "Reasonable security measures are implemented, including:",
	privacy_6_l1: "JWT-based authentication",
	privacy_6_l2: "Two-Factor Authentication support",
	privacy_6_l3: "Secure containerized backend services",
	
  privacy_7: "7. Limitation",
	privacy_7_s: "As this is a student project, the application is provided 'as is' without guarantees of production-level security.",
	
  privacy_8: "8. Contact",
	privacy_8_s: "For privacy-related questions, please contact the project team through the repository or official communication channel.",
  
  // not found
  notfound: "Not Found",
} as const;
