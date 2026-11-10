# AGENTS.md

## Environment & Toolchain
- **Runtime:** Node.js >= 22.5.0 strictly required (uses built-in `node:sqlite` via `DatabaseSync`).
- **Zero external dependencies:** No `node_modules` needed. Do not install npm packages (`express`, `better-sqlite3`, etc.). Use `node:*` built-ins.
- **Module format:** Pure ESM (`"type": "module"` in `package.json`).

## Commands
- **Start server:** `npm start` (port 3000) or `node backend/server.js [port]`
- **Dev server:** `npm run dev` (port 3002)
- **Run tests:** `npm test` or `node test.js` (starts backend on port 3001, asserts endpoints, exits)
- **Build/lint:** None. No bundler, transpiler, or external test runner.

## Architecture & Entry Points
- **Backend & Static Host:** `backend/server.js` handles both REST API (`/api/*`) and static files from `frontend/`. Do not use root `start.js` for app logic (it is only a static fallback stub).
- **Database:** SQLite file at `database/clinic.db`. Initialized automatically on server start via `database/schema.sql` (schema alterations and `INSERT OR IGNORE` seed rows run inline in `backend/server.js`).
- **Frontend:** Vanilla JS SPA in `frontend/index.html` and `frontend/script.js`.
  - Points to `http://localhost:3002` when served from external ports (e.g., Live Server).
  - Falls back transparently to `localStorage` (`klinik-polinela-v1` key) if the backend is unreachable.

## Seed Credentials
- **Admin:** identifier `admin` or `adminklinik@polinela.ac.id`, password `klinik123`.
- **Patient:** dynamic; register via `/api/auth/register` or UI.
