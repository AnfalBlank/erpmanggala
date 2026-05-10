# ERP Manggala — Project Structure

## Monorepo Layout

```
erpmanggala/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx             # Route definitions with role guards
│   │   ├── main.jsx            # Entry point (BrowserRouter, AuthProvider, I18nProvider)
│   │   ├── index.css           # Tailwind import, dark mode overrides, animations, print styles
│   │   ├── components/         # Shared UI components
│   │   │   ├── Layout.jsx      # App shell: sidebar, header, breadcrumbs, notifications, search
│   │   │   ├── Sidebar.jsx     # Navigation sidebar with grouped menu sections
│   │   │   ├── Modal.jsx       # Reusable modal dialog
│   │   │   ├── StatusBadge.jsx # Color-coded status pill component
│   │   │   ├── CurrencyInput.jsx
│   │   │   ├── ResponsiveTable.jsx
│   │   │   └── ProtectedRoute.jsx  # Auth guard + RoleGuard component
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state (user, token, login/logout) via React Context + localStorage
│   │   ├── lib/
│   │   │   ├── api.js          # Fetch wrapper with JWT auth header injection and 401 redirect
│   │   │   ├── currency.js     # Rupiah formatting/parsing helpers
│   │   │   ├── exportUtils.js  # PDF/CSV export utilities
│   │   │   ├── i18n.jsx        # i18n context with dot-notation key lookup
│   │   │   └── translations/   # Language files (id.js, en.js)
│   │   └── pages/              # Page components, one per route
│   │       ├── Dashboard.jsx
│   │       ├── Login.jsx
│   │       ├── Finance/        # Finance module pages (11 files)
│   │       ├── HRD/            # HRD module pages (6 files)
│   │       ├── Inventory/      # Inventory module pages (5 files)
│   │       ├── Purchasing/     # Purchasing sub-pages (PR, PO)
│   │       └── ...             # Other top-level pages
│   ├── public/                 # Static assets (favicon, icons, PWA manifest, service worker)
│   ├── index.html
│   └── vite.config.js
├── server/                     # Express backend
│   ├── index.js                # App entry: middleware, Swagger, route mounting, notification routes
│   ├── db/
│   │   ├── init.js             # Schema creation + ALTER TABLE migrations, exports db instance
│   │   └── seed.js             # Demo data seeding
│   ├── middleware/
│   │   └── auth.js             # authMiddleware (JWT verify) + roleMiddleware (role check)
│   ├── routes/
│   │   ├── auth.js             # Login/register endpoints
│   │   └── index.js            # All API routes: generic CRUD helper + custom endpoints
│   ├── lib/
│   │   └── email.js            # Email/WhatsApp sending + HTML templates
│   └── swagger.js              # OpenAPI spec generation
├── build.sh                    # Dependency installation script
├── run.sh                      # Dev startup script (server + client)
└── SPEC.md                     # Original feature specification
```

## Architecture Patterns

### Frontend
- **Routing**: All routes defined in `App.jsx`, wrapped with `ProtectedRoute` (auth) and `RoleGuard` (role check)
- **State**: Auth via React Context (`useAuth` hook); no global state library — each page manages its own state with `useState`/`useEffect`
- **API calls**: All go through `client/src/lib/api.js` which auto-attaches JWT and handles 401 redirects
- **Pages are self-contained**: Each page file handles its own data fetching, CRUD modals, search, and pagination
- **i18n**: Context-based with `useTranslation()` hook; translations keyed by dot-notation paths
- **Dark mode**: CSS class toggle on `<html>` with comprehensive overrides in `index.css`

### Backend
- **Generic CRUD**: A `crud()` helper in `routes/index.js` generates standard GET/POST/PUT/DELETE for simple tables with optional role guards
- **Custom routes**: Complex endpoints (payroll generation, inventory with avg cost, banking with running balance) are written as individual route handlers
- **Auth**: JWT token in `Authorization: Bearer <token>` header; middleware extracts `req.user`
- **Audit logging**: `auditLog()` helper records changes to `audit_logs` table
- **Journal entries**: `createJournal()` helper auto-creates double-entry records for financial mutations
- **Notifications**: `notify()` and `notifyRole()` helpers insert into `notifications` table

### Database
- Single SQLite file, accessed synchronously via better-sqlite3
- Schema uses `CREATE TABLE IF NOT EXISTS` for idempotent initialization
- Column additions use try/catch `ALTER TABLE` to skip if already present
- Foreign keys are enabled via pragma
