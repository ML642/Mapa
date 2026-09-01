# Mapa Backend

The Mapa backend is the HTTP API and business-logic layer for the event-discovery platform. It manages the event catalogue, authentication, user profiles, social features, moderation, media uploads, parser-worker integration, and personalized recommendations.

## Technology

- Node.js, Express 5, and TypeScript/JavaScript
- MongoDB with Mongoose
- Redis and BullMQ
- JWT access tokens and refresh-token cookies
- Zod validation, Nodemailer, Swagger, and Pino

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB
- Redis
- SMTP credentials for email verification and password resets

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

The default port is `3442`. Open `http://localhost:3442/docs` for Swagger UI and `http://localhost:3442/status` for the service status.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port. Defaults to `3442`. |
| `NODE_ENV` | No | Runtime mode, for example `development` or `production`. |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `REDIS_URL` | Production | Full Redis connection URL. Render provides this automatically through `render.yaml`. |
| `REDIS_HOST` | Local development | Redis host. |
| `REDIS_PORT` | Local development | Redis port. |
| `JWT_ACCESS_SECRET` | Yes | Secret used to sign access tokens. |
| `JWT_REFRESH_SECRET` | Yes | Secret used to sign refresh tokens. |
| `ALLOWED_ORIGINS` | Production | Comma-separated public frontend origins, without trailing slashes. |
| `FRONTEND_URL` | Production | Public frontend origin used for Google-registration redirects. |
| `EMAIL_HOST` | Yes | SMTP host. |
| `EMAIL_PORT` | Yes | SMTP port. Use `2525` for Brevo on a free Render web service. |
| `EMAIL_USER` | Yes | SMTP username. |
| `EMAIL_PASS` | Yes | SMTP key or password. |
| `EMAIL_FROM` | Yes | Sender address for service emails. |
| `PARSER_WORKER_TOKEN` | Only for HTTP worker integrations | Token required by `/parser/worker/*` endpoints. |
| `PARSER_SYSTEM_USER_ID` | No | User ID assigned to parser-created events. |
| `GIT_COMMIT_SHA` | No | Build identifier exposed by the status endpoint. |
| `DEBUG` | No | Enables additional debug logging. |

Never commit production secrets. Use the provided `.env.example` only as a local-development template.

### Render Free and email

Render Free blocks outbound SMTP ports `25`, `465`, and `587`. Gmail SMTP therefore cannot be used from the free web service. Use an SMTP provider on port `2525`, such as Brevo:

```text
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=2525
EMAIL_USER=<Brevo SMTP login>
EMAIL_PASS=<Brevo SMTP key>
EMAIL_FROM=<verified sender address>
```

`EMAIL_USER` is the SMTP login shown in Brevo, not the Gmail sender address. Verify `EMAIL_FROM` in the provider before testing registration or password reset.

## Main capabilities

- Event catalogue, map data, full-text search, filters, and event schedules.
- Registration, login, Google OAuth, email verification, refresh tokens, and password reset.
- Redis-backed protection against login and OTP brute-force attempts.
- Profiles, friends, favorites, attendance states, and activity data.
- Search and view history for authenticated users.
- Recommendations based on category interests and recent search history.
- Event submission, moderation, CSV import/export, parser-run management, and worker callbacks.
- Swagger documentation and health/status endpoints.

## Authentication and rate limits

Protected endpoints require an access token:

```http
Authorization: Bearer <accessToken>
```

Some profile, history, and recommendation endpoints additionally require a verified email address. Login, registration, OTP sending, and OTP verification use Redis-backed limits by IP and email/IP pair. Clients should surface `429` responses and respect the returned retry interval.

## User history

All history endpoints require an authenticated and verified user.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/user/history/searches` | Returns recent search phrases. |
| `POST` | `/user/history/searches` | Stores a search phrase: `{ "query": "concert Minsk" }`. |
| `DELETE` | `/user/history/searches` | Clears search history. |
| `GET` | `/user/history/views` | Returns recently viewed active events. |
| `POST` | `/user/history/views/:eventId` | Stores an event view. |
| `DELETE` | `/user/history/views` | Clears view history. |

The backend keeps up to 20 unique search phrases and 100 recently viewed events per user.

## Recommendations

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/recommendation/event?size=20` | Recommendations based on saved category interests. |
| `GET` | `/recommendation/search-history?size=20` | Recommendations based on recent search phrases. |

`/recommendation/search-history` reuses the ordinary event-search ranking. Matches from more recent phrases receive a higher score, and the response contains `basedOn`, `matchedSearches`, and `searchHistoryScore` for transparency.

## Selected endpoints

- `GET /status` and `GET /health`
- `GET /docs` and `GET /docs.json`
- `GET /events`, `GET /events/map`, and `GET /events/search`
- `POST /auth/register`, `POST /auth/login`, and `POST /auth/refresh`
- `GET /user/me` and `PATCH /user/me`
- `GET /friends/overview`
- `GET /moderation/events` and `GET /admin/dashboard`
- `POST /parser/runs` and `POST /parser/runs/:runId/cancel`

Swagger is the source of truth for the complete request and response contracts.

## Event dates and schedules

The API supports legacy `event_dates` as well as structured schedules, date ranges, and permanent events. It maintains `event_date`, `date_display`, and `date_summary` for compatibility with existing clients.

Examples:

```json
{
  "schedule": [{ "date": "2026-07-02", "times": ["10:00", "14:30", "19:00"] }]
}
```

```json
{
  "dateDisplayMode": "range",
  "dateRange": { "from": "2026-07-02", "to": "2026-08-15" }
}
```

Use `npm run backfill:event-dates -- --dry-run` before running the date backfill in production.

## Parser worker integration

The bundled `event-parser` worker consumes the `parser-runs` Redis queue and currently uses the shared MongoDB database for parser runs and event synchronization. It must use the same `MONGO_URI`, Redis instance, and uploads root as the backend.

The backend also exposes protected `/parser/worker/*` endpoints for an HTTP-based worker integration. That optional integration uses `PARSER_WORKER_TOKEN` in either `Authorization: Bearer <token>` or `x-parser-token`.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server with Nodemon. |
| `npm run build` | Compiles TypeScript. |
| `npm start` | Starts the compiled application. |
| `npm run lint` | Runs ESLint. |
| `npm test` | Runs all Vitest tests. |
| `npm run test:unit` | Runs unit tests. |
| `npm run test:integration` | Runs integration tests. |
| `npm run test:coverage` | Runs tests with coverage. |
| `npm run backfill:event-dates -- --dry-run` | Previews event-date migration results. |
| `npm run backfill:event-dates` | Applies the event-date backfill. |

## Project layout

- `routes` — HTTP routes and access rules
- `controllers` — request handlers
- `services` — business logic and integrations
- `models` — Mongoose models
- `middlewares` — authentication, validation, logging, and error handling
- `cron` — scheduled maintenance jobs
- `parsers` — parser-related adapters
- `tests` — unit and integration tests

## License

[MIT](./LICENSE)
