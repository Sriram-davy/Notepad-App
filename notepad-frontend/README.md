# SlashPad Frontend

Angular 19 frontend for the SlashPad personal notepad application.

## Features

- **Premium UI**: Obsidian and Gold elegant aesthetic design pattern
- **The Sanctuary of Thought**: Path-based private routing (`/username`)
- **Zero-Knowledge Architecture**: End-to-End private notepad structure
- **Auto-save**: Ephemeral yet permanent, saving every 30 seconds
- **Password Protection**: Optional padlock logic for extra security
- **Dynamic Ledger**: Character count statistics, character limits, and line numbering
- **Web App Architecture**: Fully responsive for cross-device mobile/desktop usage
- **Typography Engine**: Features premium fonts including Newsreader, Inter, and JetBrains Mono

## Setup

1. Ensure Node.js 18+ is installed
2. Run `npm install`
3. Run `npm start` for development

The application will start on http://localhost:4200

## Technical Architecture

- Fully migrated to globally compile using SCSS (`styles.scss`)
- Using Angular 19 Standalone Components

## Build

Run `npm run build` for production build.

## Configuration

Edit `src/environments/environment.ts` for API base URL:
- `apiBaseUrl: 'http://localhost:8080'` (dev)
- `apiBaseUrl: 'https://your-backend-url.railway.app'` (prod)

## Deployment

Deploy to Netlify:
1. Build the project
2. Upload `dist/notepad-frontend/browser` folder
3. Configure redirects in `netlify.toml`

## Components

- `HomeComponent` - Landing page sanctuary
- `NotepadComponent` - Main private ledger canvas
- `PasswordSetupComponent` - Protected key management
- `PasswordPromptComponent` - Password entry overlay
- `NotFoundComponent` - 404 page