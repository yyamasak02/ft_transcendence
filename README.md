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
| all      | Developer          | Feature implementation, testing, bug fixes                       |

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

The database is structured to support xxxxxxxxxx.

### Tables
 - **users**
	- id (INT, PK)
	- username (VARCHAR)
	- email (VARCHAR)

---

## Features



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

 **Selected module list** https://docs.google.com/spreadsheets/d/17Zzqtc-Kt7rOGMgjCKm4IlfExPgKOZ_PsDcWadULh7k/edit?gid=1123937038#gid=1123937038

### Implementation Details

Each module was implemented following the project architecture and thoroughly tested.

---

## Individual Contributions

## 👤 yyamasak

 - **xx**
 - **xx**
 - **xx**

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
 - **xx**
 - **xx**
 - **xx**

## 👤 rkawahar

 - **xx**
 - **xx**
 - **xx**

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


