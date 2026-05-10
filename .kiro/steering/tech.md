# ERP Manggala — Tech Stack & Build

## Frontend

- **React 19** with JSX (not TypeScript)
- **Vite 6** — build tool and dev server
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin, imported as `@import "tailwindcss"` in index.css
- **React Router DOM v7** — client-side routing with `BrowserRouter`
- **Recharts** — charts and graphs
- **Lucide React** — icon library (feather-style)
- **jsPDF + jspdf-autotable** — PDF export
- ESLint with react-hooks and react-refresh plugins

## Backend

- **Express.js** on Node.js (ES modules — `"type": "module"`)
- **better-sqlite3** — embedded SQLite database with WAL mode and foreign keys enabled
- **JWT** (jsonwebtoken) — token-based authentication
- **bcryptjs** — password hashing
- **nodemailer** — email sending
- **cors** — cross-origin support

## Database

- SQLite file at `server/db/erp.db`
- Schema defined in `server/db/init.js` using `CREATE TABLE IF NOT EXISTS`
- Migrations handled via safe `ALTER TABLE` statements that silently skip if column already exists
- Seed data in `server/db/seed.js`

## Infrastructure

- Nginx reverse proxy (port 80 → backend port 3002)
- PM2 process manager
- Ubuntu VPS deployment

## Common Commands

### Frontend (run from `client/`)
```bash
npm run dev        # Start Vite dev server on port 5173 (proxies /api to localhost:3002)
npm run build      # Production build to client/dist/
npm run preview    # Preview production build
```

### Backend (run from `server/`)
```bash
npm start          # Start Express server on port 3002
node db/init.js    # Initialize database tables
node db/seed.js    # Seed demo data
```

### Full Stack (run from project root)
```bash
bash run.sh        # Starts both server and client dev concurrently
bash build.sh      # Installs all dependencies
```

## Dev Server Proxy

Vite proxies `/api` requests to `http://localhost:3002` during development, so the frontend calls `/api/*` without specifying the backend host.

## No Test Framework

There is currently no test runner or test framework configured. If adding tests, pick a standard framework for the ecosystem (e.g., Vitest for the frontend, Vitest or Jest for the backend).
