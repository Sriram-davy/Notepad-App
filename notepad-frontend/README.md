# NoteSnap Frontend

Angular 19 frontend for the NoteSnap personal notepad application.

## Features

- Clean, minimalist UI with glassmorphism design
- Path-based routing (/username)
- Auto-save every 30 seconds
- Password protection overlay
- Character count and limit warnings
- Dark/light mode toggle
- Mobile responsive
- Monospace font for notepad

## Setup

1. Ensure Node.js 18+ is installed
2. Run `npm install`
3. Run `npm start` for development

The application will start on http://localhost:4200

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

- `HomeComponent` - Landing page
- `NotepadComponent` - Main notepad interface
- `PasswordSetupComponent` - Password management
- `PasswordPromptComponent` - Password entry overlay
- `NotFoundComponent` - 404 page