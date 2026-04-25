# SlashPad Frontend

Angular 19 frontend for the SlashPad personal notepad application.

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

# SlashPad Backend

Spring Boot backend for the SlashPad personal notepad application.

## Features

- REST API for notepad management
- Password protection with BCrypt hashing
- Automatic expiry after 10 days
- Scheduled cleanup and backup tasks
- H2 in-memory database
- CORS configuration for Angular frontend

## API Endpoints

- `GET /api/notepad/{username}` - Get notepad
- `POST /api/notepad/{username}/save` - Save notepad content
- `POST /api/notepad/{username}/verify` - Verify password
- `PUT /api/notepad/{username}/password` - Set password
- `DELETE /api/notepad/{username}/password` - Remove password
- `GET /api/health` - Health check

## Setup

1. Ensure Java 17 is installed
2. Ensure Maven is installed
3. Run `mvn clean install`
4. Run `mvn spring-boot:run`

The application will start on http://localhost:8080

## Configuration

Edit `src/main/resources/application.properties` for custom settings:
- `notepad.character.limit` - Max characters (default: 50000)
- `notepad.expiry.days` - Expiry days (default: 10)

## Production Deployment

- Update CORS origins in `CorsConfig.java`
- Use a persistent database instead of H2
- Configure backup directory permissions