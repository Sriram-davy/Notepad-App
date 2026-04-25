# SlashPad Project Context

## Overview
SlashPad is a highly private, ephemeral yet permanent digital ledger and notepad application. It utilizes a zero-knowledge architecture, path-based routing, and a clean Obsidian/Gold aesthetic to provide users with a secure and refined writing experience.

---

## Frontend Architecture

**Technology Stack:**
- **Framework:** Angular 19 (using Standalone Components)
- **Language:** TypeScript
- **Styling:** SCSS (Fully configured for global compilation)
- **Package Manager:** NPM

**Design System & Aesthetics:**
- **Theme:** Premium Obsidian/Gold dark theme (`#141414` deep background, `#c9a84c` gold accents).
- **Typography:** 
  - `Newsreader` (Heading elegance)
  - `Inter` (UI elements, buttons)
  - `JetBrains Mono` (Input fields, raw notepad text)
- **Responsiveness:** Fluid grid layouts tailored for mobile, tablet, and desktop viewing.

**Key Features & Logic:**
- **Path-Based Routing:** Users enter a unique path (e.g., `/sriramdavy`) to instantly access or dynamically instantiate a private notepad instance.
- **Smart Auto-Save:** Incorporates RxJS Subjects and `debounceTime(2500)` to silently auto-save content 2.5 seconds *after* the user stops typing.
- **Security Mechanics:** 
  - Password setup is **optional** — all notepads are public by default.
  - If a password is set, the user must enter it on every fresh page load.
  - Upon successful password verification, the backend issues a **JWT token** stored in Angular's ephemeral memory (not localStorage/cookies — wiped on page refresh).
  - All subsequent operations (auto-saves, password changes) ride the JWT via an `HttpInterceptor` — **no raw passwords are ever transmitted during auto-save**.
- **5-Minute Idle Timeout:** Inactive sessions are ejected back to the home page.
- **Component Map:**
  - `HomeComponent`: The landing page "Sanctuary"
  - `NotepadComponent`: The core editor ledger
  - `PasswordSetupComponent`: End-to-end security key management
  - `PasswordPromptComponent`: Security challenge overlay
  - `NotFoundComponent`: Standardized 404 handler

**Security Flow (Frontend):**
1. User navigates to `/:username` → `GET /api/notepad/{username}`
2. If notepad is protected and no JWT → backend returns `401` → UI shows password prompt
3. User enters password → `POST /api/notepad/{username}/verify` → backend returns JWT
4. JWT stored in `NotepadService.tokens` (in-memory `Map`) → `auth.interceptor.ts` injects `Authorization: Bearer <token>` into all subsequent requests
5. Auto-saves send `{ content: "..." }` only — no password in payload

---

## Backend Architecture

**Technology Stack:**
- **Framework:** Spring Boot 3.2.0
- **Language:** Java 17
- **Database:** PostgreSQL (via `postgresql` runtime scope in Maven)
- **ORM Context:** Spring Data JPA
- **Build Tool:** Maven

**Security & Flow:**
- **Auth Layer:** Spring Boot Security + JSON Web Tokens (JJWT API `0.11.5`) for stateless authentication.
- **JWT Lifecycle:** Tokens are generated upon successful password verification with a 24h expiration. The `JwtAuthenticationFilter` intercepts all requests, extracts the Bearer token, validates it, and populates the `SecurityContext`.
- **Centralized Access Control:** A `verifyJwtAccess(Notepad notepad)` method is called by `getNotepad`, `saveNotepad`, `setPassword`, and `removePassword`. If the notepad is unprotected, access is granted freely. If protected, the JWT must match the notepad's username.
- **CORS Policy:** Explicitly configured for `http://localhost:4200` and `https://slashpad.netlify.app` with `GET, POST, PUT, DELETE, OPTIONS`.
- **CSRF:** Disabled (standard for stateless JWT REST APIs).
- **Validation:** Utilizes `spring-boot-starter-validation` for clean, secure incoming request handling.
- **Boilerplate Optimization:** Project relies heavily on Lombok (`1.18.44`) to auto-generate getters, setters, and constructors.

**Data Model:**
- **Entity:** `Notepad` — Primary Key is `username` (String, max 100 chars). No auto-incrementing ID.
- **Fields:** `content` (TEXT), `passwordHash`, `passwordHint`, `isProtected`, `createdAt`, `updatedAt`, `expiresAt`.

**API Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notepad/{username}` | JWT if protected | Load or create notepad |
| POST | `/api/notepad/{username}/save` | JWT if protected | Save content |
| POST | `/api/notepad/{username}/verify` | None (issues JWT) | Verify password |
| PUT | `/api/notepad/{username}/password` | JWT if protected | Set/change password |
| DELETE | `/api/notepad/{username}/password` | JWT required | Remove password |
| GET | `/api/notepad/health` | None | Health check |
