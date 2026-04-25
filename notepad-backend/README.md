# SlashPad Backend

Spring Boot backend for the SlashPad personal notepad application.

## Features

- REST API for notepad management
- Password protection with BCrypt hashing
- Automatic expiry after 10 days
- Scheduled cleanup of expired notepads
- PostgreSQL database
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
3. Create a PostgreSQL database named `slashpad`
4. Set environment variables:
	- `DATABASE_URL` (default: jdbc:postgresql://localhost:5432/slashpad)
	- `DB_USERNAME` (default: postgres)
	- `DB_PASSWORD` (default: postgres)
5. Run `mvn clean install`
6. Run `mvn spring-boot:run`

The application will start on http://localhost:8080

## Configuration

Edit `src/main/resources/application.properties` for custom settings:
- `notepad.character.limit` - Max characters (default: 50000)
- `notepad.expiry.days` - Expiry days (default: 10)

## Production Deployment

- Set `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD` as environment variables
- Set `spring.jpa.hibernate.ddl-auto=validate` once schema is stable
- Update CORS origins in `CorsConfig.java`
- Tables are auto-created on first run via `ddl-auto=update`