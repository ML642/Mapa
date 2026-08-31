# Mapa Admin Panel

The Mapa Admin Panel is a React application for moderators and administrators. It provides operational access to the event catalogue, user registry, moderation queue, CSV import/export, parser runs, and system dashboard.

## Technology

- React 19 and TypeScript
- Vite
- React Router
- Axios
- Mapbox GL and react-map-gl
- Framer Motion

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A running Mapa backend
- An account with moderator, administrator, or superadministrator permissions
- A Mapbox access token for map-based coordinate editing

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Vite starts the panel at `http://localhost:5173` by default. Configure a different port in the Vite configuration when the public frontend is running locally on the same machine.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL of the Mapa backend, for example `http://localhost:3442`. |
| `VITE_MAPBOX_ACCESS_TOKEN` | Recommended | Public Mapbox token for the map and coordinate editor. |
| `VITE_MAPBOX_STYLE` | No | Mapbox style URL. |
| `VITE_MAPBOX_DEFAULT_CENTER_LAT` | No | Initial map latitude. |
| `VITE_MAPBOX_DEFAULT_CENTER_LNG` | No | Initial map longitude. |
| `VITE_MAPBOX_DEFAULT_ZOOM` | No | Initial map zoom level. |
| `VITE_MAPBOX_MIN_ZOOM` | No | Minimum allowed zoom. |
| `VITE_MAPBOX_MAX_ZOOM` | No | Maximum allowed zoom. |
| `VITE_MAPBOX_GEOCODING_COUNTRY` | No | Country filter for Mapbox geocoding. Defaults to `by`. |
| `VITE_MAPBOX_GEOCODING_LANGUAGE` | No | Language requested from Mapbox geocoding. |

Every `VITE_*` value is visible in the browser bundle. Never place server secrets or private API keys in these variables.

## Main capabilities

- Dashboard with health state, counters, recent activity, and parser-run summary.
- Event registry with search, filters, quality checks, pagination, and map editing.
- Event creation, editing, soft deletion, restoration, and permanent deletion when authorized.
- Moderation of user-submitted events and parser-proposed changes.
- CSV import and export for the event catalogue.
- Parser workspace for starting, monitoring, and cancelling Relax parser runs.
- User registry with search, filters, profile details, sessions, and role management.
- Audit log access for authorized roles.

## Authentication and roles

The panel uses the backend authentication flow and sends the user access token to protected API routes. The backend is the source of truth for permissions.

- `moderator` — moderation queue, event management, parser operations, and selected dashboard data.
- `admin` — user registry and administrative operations.
- `superadmin` — privileged role-management operations.

Email verification and backend rate-limit policies also apply to panel sessions.

## Backend API integration

The panel primarily works with these backend route groups:

- `/auth/*` — authentication and session refresh
- `/admin/*` — dashboard, user registry, audit logs, and administrative data
- `/events/*` and `/moderation/events/*` — event catalogue and moderation
- `/parser/runs/*` — parser-run lifecycle

Swagger at `${VITE_API_URL}/docs` is the source of truth for the complete API contract.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Type-checks and creates a production build. |
| `npm run preview` | Serves a local production preview. |
| `npm run lint` | Runs ESLint. |

## Project layout

- `src/app` — application shell, routes, global styles, and providers
- `src/pages` — dashboard, login, event, parser, and user-management pages
- `src/features` — event API integration, CSV tools, and feature modules
- `src/shared` — types, constants, API client, utilities, and environment configuration
- `public` — static assets

## License

[MIT](./LICENSE)
