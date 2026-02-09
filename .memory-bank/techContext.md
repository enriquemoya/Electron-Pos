# Tech Context

## Stack
- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS for all styling
- Electron for desktop wrapper
- Node.js runtime
- SQLite for local-first data (implemented)

## Monorepo
- npm workspaces with apps/ and packages/
- Absolute imports using @/ inside apps/web
- Shared packages: @pos/ui, @pos/core, @pos/db

## Tooling Notes
- Next.js configured with output: "export" for Electron static builds.
- UI package is transpiled in Next.js via transpilePackages.
- SQLite uses better-sqlite3 with sync repositories in packages/db.
- Electron main hosts OAuth token storage for Drive sync.
- IPC bridge exposes DB operations to renderer via preload.
- Shadcn UI components are used in the renderer (shadcn/ui + Radix UI + class-variance-authority + lucide-react).
- Business timezone is the operator's local machine timezone (no fixed TZ constant).
