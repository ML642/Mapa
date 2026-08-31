# Mapa Frontend

The Mapa frontend is a responsive React application for discovering events on a map and in curated lists. It provides desktop and mobile layouts, authentication, profile and social features, event search, filtering, favorites, attendance, and personalized recommendations.

## Technology

- React 19 and TypeScript
- Vite
- React Router and TanStack Query
- Axios
- Mapbox GL and react-map-gl
- Google OAuth
- Framer Motion and Tailwind CSS

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A running Mapa backend
- A Mapbox access token for the interactive map

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Vite serves the application at `http://localhost:5173` by default.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL of the Mapa backend, for example `http://localhost:3442`. |
| `VITE_MAPBOX_ACCESS_TOKEN` | Yes | Public Mapbox access token. |
| `VITE_MAPBOX_STYLE` | No | Mapbox style URL. |
| `VITE_MAPBOX_DEFAULT_CENTER_LAT` | No | Initial map latitude. |
| `VITE_MAPBOX_DEFAULT_CENTER_LNG` | No | Initial map longitude. |
| `VITE_MAPBOX_DEFAULT_ZOOM` | No | Initial map zoom level. |
| `VITE_MAPBOX_MIN_ZOOM` | No | Minimum allowed zoom level. |
| `VITE_MAPBOX_MAX_ZOOM` | No | Maximum allowed zoom level. |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID. |
| `VITE_GOOGLE_MAPS_EMBED_API_KEY` | No | API key for embedded Google Maps. |
| `VITE_YANDEX_MAPS_API_KEY` | No | API key for the Yandex Maps fallback. |
| `VITE_YANDEX_METRIKA_ID` | No | Yandex Metrika counter ID. |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID. |
| `VITE_SITE_URL` | No | Canonical public site URL. |

All `VITE_*` values are embedded in the browser bundle. Do not place private keys, SMTP credentials, or server secrets in them.

## Features

- Event discovery on an interactive map and in responsive event lists.
- Search and filters for text, category, date, time, price, and friend activity.
- Event details, media, pricing, favorites, attendance, and social sharing.
- Registration, login, email verification, refresh-token sessions, and Google OAuth.
- User profiles, friends, favorites, and attendance lists.
- Separate desktop and mobile navigation and layouts.
- Personalized recommendations from `GET /recommendation/search-history` for authenticated users. If the endpoint returns no recommendations, the UI falls back to the general interesting-events collection.
- Cookie consent controls for analytics integrations.

## Backend integration

The frontend uses the Mapa backend for event data, session handling, profiles, social features, uploads, and recommendations.

Important backend routes include:

- `/events`, `/events/search`, and `/events/map`
- `/auth/*`
- `/user/*`
- `/friends/*`
- `/recommendation/*`

Set `VITE_API_URL` to the backend address. For local development, use `http://localhost:3442`.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Type-checks and creates a production build. |
| `npm run preview` | Serves a local production preview. |
| `npm run lint` | Runs ESLint. |
| `npm test` | Runs all Node test files. |
| `npm run test:price` | Runs price-display tests. |
| `npm run test:phone` | Runs phone-display tests. |
| `npm run test:phone-coverage` | Reports phone-number coverage in event data. |

## Analytics and consent

The application records the user’s cookie-consent choice in `localStorage` under `techCookieConsent`. Essential cookies are always enabled. Analytics integrations load only after analytics consent is granted.

To test consent behavior locally, remove the saved choice in DevTools and reload the page:

```js
localStorage.removeItem('techCookieConsent');
location.reload();
```

## Project layout

- `src/components` — desktop, mobile, authentication, profile, and map UI
- `src/services` — HTTP clients, session management, and domain services
- `src/config` — environment and application configuration
- `src/hooks` — reusable React hooks
- `src/utils` — presentation and domain utilities
- `public` — static assets
- `tests` — Node-based test files

## License

[MIT](./LICENSE)
