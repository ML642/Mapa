# Mapa

Mapa is an event-discovery platform for Warsaw. Visitors can explore events on an interactive map, search and filter the catalogue, save favourites, plan attendance, discuss events, and connect with friends.

> **Demo notice:** This is a demonstration version of a project originally conceived as a startup. All events, profiles, comments, images, and other catalogue content are demo data only. They do not represent real people, current events, businesses, or verified information.

## Applications

| Directory | Purpose | Stack |
| --- | --- | --- |
| [`frontend`](./frontend) | Public responsive web application | React, TypeScript, Vite, Mapbox |
| [`backend`](./backend) | REST API and business logic | Node.js, Express, MongoDB, Redis |
| [`admin-panel`](./admin-panel) | Moderation and administration interface | React, TypeScript, Vite |

Detailed setup, environment variables, architecture notes, and commands are available separately in the [frontend README](./frontend/README.md) and [backend README](./backend/README.md). The [admin-panel README](./admin-panel/README.md) documents the moderation interface.

## Highlights

- Interactive Mapbox map with event markers, clustering, search, categories, and filters.
- Desktop and mobile user interfaces.
- Email/password and Google authentication, email verification, password reset, and refresh-token sessions.
- Event schedules, permanent events, favourites, attendance states, comments, profiles, friends, and recommendations.
- Moderation, audit data, CSV import/export, parser-run endpoints, and Swagger API documentation.

## Local development

1. Start MongoDB and Redis locally.
2. Start the backend:

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

3. In another terminal start the public frontend:

   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

The backend runs on `http://localhost:3442`; the frontend runs on `http://localhost:5173` by default.

## Production deployment

- Deploy [`frontend`](./frontend) to Vercel.
- Deploy [`backend`](./backend) to Render with [`render.yaml`](./render.yaml).
- Use MongoDB Atlas for `MONGO_URI`.
- Configure a public Mapbox token, Google client ID, CORS, and the frontend URL through deployment environment variables.
- Render Free blocks SMTP ports `25`, `465`, and `587`. Use a provider on port `2525`, such as Brevo, or an email HTTP API.

See [`backend/deploy-secrets-checklist.md`](./backend/deploy-secrets-checklist.md) for the deployment checklist.

## Security

- Never commit `.env` files, SMTP keys, database credentials, or JWT secrets.
- `VITE_*` values are public browser configuration. Only public client identifiers and restricted Mapbox tokens belong there.
- Restrict Mapbox tokens to the deployed Vercel origin.

## License

[MIT](./frontend/LICENSE)
