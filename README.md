# Koyote POS (Electron + Next.js)

Local-first POS for a TCG store. Electron shell + Next.js renderer, SQLite as source of truth, IPC-only persistence.

## Prerequisites

- Node.js (use the version you already run in this repo)
- npm
- Windows Build Tools (if native modules are rebuilt)

## Install

```powershell
npm install
```

## Environment

Create a `.env` file in the repo root. Example (replace values as needed):

```env
# SQLite
DB_PATH=C:\Users\<user>\AppData\Roaming\KoyotePOS\koyote.db

# Electron dev
ELECTRON_START_URL=http://localhost:3000

# Google Drive (optional)
DRIVE_CLIENT_ID=your-client-id
DRIVE_CLIENT_SECRET=your-client-secret
DRIVE_SCOPES=https://www.googleapis.com/auth/drive.file
DRIVE_FILE_NAME=productos-inventario.xlsx

# Backups
BACKUP_RETENTION=10
```

## Development

Run the web app:

```powershell
npm run dev -w apps/web
```

Run the Electron app (desktop):

```powershell
npm run dev:desktop
```

## Build

Build the web app:

```powershell
npm run build -w apps/web
```

Build the Electron app:

```powershell
npm run build -w apps/desktop
```

## Common commands

```powershell
# Workspaces overview
npm run -ws

# Rebuild native deps for Electron (if needed)
npx electron-rebuild -f -w better-sqlite3 -v 30.0.9 --module-dir .
```

## IPC usage examples

Renderer (Next.js) uses the preload bridge. Example calls:

```ts
// List products (paged)
const result = await window.api.products.listPaged({ page: 1, pageSize: 20 });

// Create a sale
await window.api.sales.createSale(sale);

// Get dashboard summary
const summary = await window.api.dashboard.getSummary(new Date().toLocaleDateString("en-CA"));
```

## Data safety (backups)

- Backups live under the app data folder in `backups/`.
- Restore is available only on recovery routes.
- If DB cannot be opened, the app routes to `/error/db`.

## Project structure

```
/
  /apps
    /web        Next.js UI
    /desktop    Electron shell
  /packages
    /core       Domain logic (pure)
    /db         SQLite repositories
  /.memory-bank
  /.specs
```

## Notes

- Renderer never touches SQLite directly.
- All persistence goes through IPC.
- Specs are ASCII-only by governance rules.
