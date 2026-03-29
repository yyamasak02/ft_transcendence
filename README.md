*This project has been created as part of the 42 curriculum by yyamasak, tashiget, tobaba, rkawahar, totsurud.*

## overview
- [Description](#description)
- [Instructions](#instructions)
- [Resources](#resources)
- [Team Information](#team-information)
- [Project Management](#project-management)
- [Technical Stack](#technical-stack)
- [Database Schema](#database-schema)
- [Features](#features)
- [Modules](#modules)
- [Individual Contributions](#individual-contributions)

## Description

The goal of this project is to [clearly state the main objective, e.g., build a real-time web application, implement a specific system, etc.].

The application provides:
- A brief explanation of the main functionality
- The problem it solves
- The expected users or use cases

Overall, the project demonstrates the use of modern development practices, teamwork, and modular architecture.

---

## Instructions

### Requirements
- **OS: [Linux / macOS / Windows]**
- **Compiler / Runtime: [Node.js v18, Python 3.11, ]**
- **Other dependencies: [Docker, Make, ]**

### Installation
```bash
	git clone <repository of this project>
	cd project-name
```
### Compilation Setup
```bash
	make init
```

### access
```
  https://localhost:8443
```
## Resources
 - **[Project Specificatons](./subjects/en.subject.pdf)**

 - **Frontend**
   - [TypeScript](https://www.typescriptlang.org/docs/)
   - [Tailwind CSS](https://tailwindcss.com/docs)

 - **Backend**
   - [Node.js](https://nodejs.org/en/docs)
   - [Fastify](https://fastify.dev/docs/latest/)

 - **Database**
   - [SQLite](https://www.sqlite.org/docs.html)

 - **Infrastructure**
   - [Docker](https://docs.docker.com/)
   - [Nginx](https://nginx.org/en/docs/)

 - **Authentication**
   - [JWT (RFC 7519)](https://datatracker.ietf.org/doc/html/rfc7519)
   - [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
   - [TOTP (RFC 6238)](https://datatracker.ietf.org/doc/html/rfc6238)
   - [Argon2](https://github.com/P-H-C/phc-winner-argon2)

 - **Use of AI Tools**
		AI tools (Copilot, ChatGPT) were used in the following ways:

		Assisting with architecture design discussions
		Generating boilerplate code and refactoring suggestions
		Debugging and explaining complex technical concepts
		Reviewing documentation and improving clarity

		All AI-generated suggestions were reviewed, tested, and adapted by the team.

---

## Team Information

| Name     | Role(s)            | Responsibilities                                                 |
|----------|--------------------|------------------------------------------------------------------|
| yotsurud | Product Owner      | Schedule management, Communication Promotion                     |
| yyamasak | Project Manager    | Task planning, meeting facilitation, validated features          |
| tobaba   | Tech Lead Frontend | Architecture decisions, code reviews, technical guidance         |
| tashiget | Tech Lead Backend  | Architecture decisions, code reviews, technical guidance         |
| rkawahar | Developer          | Feature implementation, testing, bug fixes                       |

## Project Management

### Work organization
 - **Tasks were divided based on feature ownership and technical complexity**
 - **Weekly planning meetings and were held**
 - **Code reviews were mandatory before merging**
### Tools
 - **Task tracking: GitHub issue**
 - **Version control: GitHub**
### Communication
 - **Discord for daily communication and meeting**
 - **GitHub issue**

---

## Technical Stack

### Frontend
 - **Language & Framework: TypeScript**
 - **Styling: Tailwind CSS**

### Backend
 - **Language & Framework: Node.js + Fastify**
 - **API style: REST / WebSocket**
 - **Authentication: JWT / OAuth**

### Database
 - **Database system: SQLite**
 - **Reason for choice: reliability, performance, ease of integration**

### Other Technologies
 - **Docker for containerization**
 - **Nginx as reverse proxy**
 - **ESLint for code quality management**
 - **Prettier for code formatter**
 - **Pre-commit hooks for automated code quality checking**
 - **GitHub-Actions for automated build check**
 - **GitHub-Copilot for coding assistance**

 ---

## Database Schema

The database uses SQLite and is structured to support user management, authentication, social features, and game history.

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| email | TEXT | NOT NULL, UNIQUE |
| name | TEXT | NOT NULL, UNIQUE |
| password | TEXT | |
| salt | TEXT | |
| puid | TEXT | NOT NULL, UNIQUE |
| two_factor_enabled | INTEGER | NOT NULL DEFAULT 0 |
| two_factor_secret | TEXT | |
| last_accessed_at | TEXT | |
| profile_image | TEXT | DEFAULT 'Robot' |
| profile_image_data | BLOB | |

### google_accounts
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, UNIQUE, FK → users(id) ON DELETE CASCADE |
| google_sub | TEXT | NOT NULL, UNIQUE |
| email | TEXT | |
| email_verified | INTEGER | NOT NULL DEFAULT 0 |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') |

### long_term_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| token_hash | TEXT | PRIMARY KEY |
| user_id | INTEGER | NOT NULL, FK → users(id) ON DELETE CASCADE |
| expires_at | TEXT | |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

### friends
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| requester_puid | TEXT | NOT NULL, FK → users(puid) ON DELETE CASCADE |
| addressee_puid | TEXT | NOT NULL, FK → users(puid) ON DELETE CASCADE |
| status | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') |

### match_sessions
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| owner_puid | TEXT | NOT NULL, FK → users(puid) ON DELETE CASCADE |
| guest_puid | TEXT | FK → users(puid) ON DELETE CASCADE |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') |

### match_results
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| owner_puid | TEXT | NOT NULL, FK → users(puid) ON DELETE CASCADE |
| guest_puid | TEXT | FK → users(puid) ON DELETE CASCADE |
| owner_score | INTEGER | NOT NULL |
| guest_score | INTEGER | NOT NULL |
| match_id | INTEGER | UNIQUE |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') |

### messages
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER | NOT NULL |
| message | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

## Features
Click Link:https://docs.google.com/spreadsheets/d/17Zzqtc-Kt7rOGMgjCKm4IlfExPgKOZ_PsDcWadULh7k/edit?gid=1123937038#gid=1123937038


---

## Modules

 - **Use a framework for both the frontend and backend.**
 - **Implement real-time features using WebSockets or similar technology.**
 - **Support for multiple languages (at least 3 languages).**
 - **Support for additional browsers.**
 - **Standard user management and authentication.**
 - **Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.).**
 - **Implement a complete 2FA (Two-Factor Authentication) system for the users.**
 - **Introduce an AI Opponent for games.**
 - **Implement a complete web-based game where users can play against each other.**
 - **Remote players — Enable two players on separate computers to play the same game in real-time.**
 - **Implement advanced 3D graphics using a library like Three.js or Babylon.js.**
 - **Game customization options.**


### Implementation Details

Each module was implemented following the project architecture and thoroughly tested.

---

## Individual Contributions

## 👤 yyamasak

#### Architecture & Technical Direction
- **Technical Foundations** - Established repository baseline, development workflow, and core engineering conventions.
- **Review Standards** - Defined and maintained code review instructions and quality criteria across feature branches.
- **Integration Strategy** - Led technical integration flow and release readiness from `dev` to `main`.

#### Major Feature Implementation
- **Remote Match Feature** - Implemented and integrated remote match functionality.

#### Documentation & Maintenance
- **Build/Repo Maintenance** - Updated issue templates, Makefile, and related project-level settings.
- **Documentation** - Maintained README and wiki notes for onboarding and team operation.

## 👤 tashiget
#### User Management

##### Authentication
- **Google OAuth** – Sign in with Google account via OAuth 2.0
- **JWT Implementation** – Secure session management using JSON Web Tokens
- **Two-Factor Authentication (2FA)** – Additional login security via one-time passcode
- **Password Hashing with Argon2** – Passwords are securely hashed using the Argon2 algorithm

##### Profile
- **User Avatar** – Upload and display a custom profile picture
- **Friend System** – Add, remove, and manage friends
- **Match History** – View past game results and match records

## 👤 tobaba
#### 3D PingPong Game Engine
- **Advanced AI Controller** – Engineered a sophisticated, human-like AI from scratch, featuring custom trajectory prediction algorithms and dynamic difficulty scaling (Easy/Normal/Hard). Conducted thousands of rigorous, hands-on test plays with relentless stamina to fine-tune parameters, achieving a perfectly balanced, adrenaline-pumping gameplay experience rather than a purely mechanical opponent.
- **Immersive Game Effects** – Integrated high-performance particle systems and visual effects utilizing Three.js. Leveraged sheer perseverance to continuously optimize complex 3D rendering down to the millimeter, creating a deeply immersive and exhilarating gaming environment.

#### Frontend Development & User Interface
- **Emotional Game Flow** – Designed and implemented highly dynamic game introductions and dramatic match result sequences. Relentlessly refined every detail of the animations to maximize the player's emotional engagement, amplifying the thrill of victory and the sting of defeat.
- **Sophisticated Lobby & Settings** – Developed an intuitive and visually striking matchmaking lobby and game settings UI. Transformed the static waiting experience into one that builds anticipation, delivering a seamless, stylish, and highly user-centric frontend architecture.

## 👤 rkawahar

#### 3D PingPong — Gameplay UX & Responsiveness
- **Match Start Flow** – Completed click-to-start handling so players can reliably begin a match from the opening state.
- **Court Layout** – Implemented vertical table orientation and layout adjustments so the 3D court reads clearly across screen sizes.
- **Mobile-First HUD** – Tuned on-screen controls and copy sizing for small viewports, including mobile-only control affordances where appropriate.

#### Rendering & Session Quality
- **Lighting** – Reduced harsh highlights and blow-out in the Three.js scene for more stable, readable visuals during play.
- **Remote / Mobile Play** – Adjusted camera behavior during mobile play to avoid distracting movement and keep focus on the ball and paddles.

#### Integration & Maintenance
- **Internationalization Polish** – Fixed layout overflow when switching languages and aligned related frontend package configuration.
- **Code Quality** – Resolved merge conflicts and applied review and automated tooling feedback to keep the 3D game branch integration-ready.

## 👤 yotsurud

<span style="color:orange"><b>Project Contribution</b></span>
- **Announced team meetings.**
- **Wrote and shared meeting reports to keep all members informed of project progress.**

<span style="color:orange"><b>Implementations</b></span>
##### 🌍 Accessibility and Internationalization
- **Implemented support for multiple languages.**
- **Added localization for English, Italian, and Japanese.**
- **Designed a structure that allows easy extension to additional languages.**
##### 🎮 Gaming and User Experience
- **Contributed to the implementation of the 3D Pong game.**
- **Worked on improving the user interface and overall gameplay experience.**
##### ⚙️ Game Customization Options
- **Implemented customizable gameplay features including:**
  - Power-ups
  - Multiple court colors
  - Adjustable game settings
  - Default configuration options

<span style="color:orange"><b>Challenges and Solutions</b></span>
##### 💬 Remote Communication Challenges
Because the project was conducted in a **fully remote environment**, it was sometimes difficult to maintain smooth communication among team members.
**To address this issue:**
  - Increased the frequency of updates and messages in the team communication channels.
  - Regularly posted progress reports to keep everyone aligned.
This helped maintain collaboration and ensured that development progressed smoothly despite the remote setup.

##### 🧩 Code Readability in the 3D Game Implementation
During the development of the **3D game**, the codebase became difficult to read due to the increasing complexity of the game logic.
**To improve maintainability and readability:**
  - Refactored the code by introducing **component-based structures**.
  - Separated responsibilities into smaller, well-defined modules.
  - Improved the overall organization of the game code.
As a result, the code became easier for team members to understand, maintain, and extend.


