# Runtime Gate Summary

- Date/time (UTC): 2026-02-20T05:30:12Z
- appEnv: prod
- branchId: c3df9d36-30a4-4ca5-8c5e-6f0a162053f4
- terminalId: cmlt38rvi000312mbawgmt2ve


## Build cloud-api
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && npm run build -w apps/cloud-api
```
- Exit: 0
```text

> @pos/cloud-api@0.0.0 build
> tsc -p tsconfig.json

```

## Build desktop
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && npm run build -w apps/desktop
```
- Exit: 0
```text

> @pos/desktop@0.0.0 build
> echo "Electron packaging not configured yet."

Electron packaging not configured yet.
```

## Build online-store
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && npm run build -w apps/online-store
```
- Exit: 0
```text

> @pos/online-store@0.0.0 build
> next build

  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/60) ...
   Generating static pages (15/60) 
   Generating static pages (30/60) 
   Generating static pages (45/60) 
 ✓ Generating static pages (60/60)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                   Size     First Load JS
┌ ○ /_not-found                               877 B          88.2 kB
├ ● /[locale]                                 1.41 kB         161 kB
├   ├ /es
├   └ /en
├ ● /[locale]/account/orders                  5.33 kB         129 kB
├   ├ /es/account/orders
├   └ /en/account/orders
├ ƒ /[locale]/account/orders/[orderId]        1.67 kB        98.7 kB
├ ● /[locale]/account/profile                 3.7 kB          136 kB
├   ├ /es/account/profile
├   └ /en/account/profile
├ ● /[locale]/admin/blog                      126 kB          276 kB
├   ├ /es/admin/blog
├   └ /en/admin/blog
├ ● /[locale]/admin/branches                  1.21 kB         133 kB
├   ├ /es/admin/branches
├   └ /en/admin/branches
├ ● /[locale]/admin/home                      1.66 kB        98.7 kB
├   ├ /es/admin/home
├   └ /en/admin/home
├ ● /[locale]/admin/inventory                 3.85 kB         108 kB
├   ├ /es/admin/inventory
├   └ /en/admin/inventory
├ ● /[locale]/admin/orders                    5.28 kB         129 kB
├   ├ /es/admin/orders
├   └ /en/admin/orders
├ ƒ /[locale]/admin/orders/[orderId]          3.2 kB          151 kB
├ ● /[locale]/admin/products                  3.07 kB         117 kB
├   ├ /es/admin/products
├   └ /en/admin/products
├ ƒ /[locale]/admin/products/[id]             2.28 kB         134 kB
├ ● /[locale]/admin/products/new              2 kB            134 kB
├   ├ /es/admin/products/new
├   └ /en/admin/products/new
├ ● /[locale]/admin/proofs                    1.67 kB        98.7 kB
├   ├ /es/admin/proofs
├   └ /en/admin/proofs
├ ● /[locale]/admin/taxonomies                5.47 kB         141 kB
├   ├ /es/admin/taxonomies
├   └ /en/admin/taxonomies
├ ● /[locale]/admin/terminals                 12.1 kB         166 kB
├   ├ /es/admin/terminals
├   └ /en/admin/terminals
├ ƒ /[locale]/admin/terminals/[id]            4.13 kB         133 kB
├ ● /[locale]/admin/users                     1.67 kB        98.7 kB
├   ├ /es/admin/users
├   └ /en/admin/users
├ ƒ /[locale]/admin/users/[id]                2.85 kB         117 kB
├ ● /[locale]/auth/login                      2.45 kB        96.7 kB
├   ├ /es/auth/login
├   └ /en/auth/login
├ ƒ /[locale]/auth/logout                     0 B                0 B
├ ƒ /[locale]/auth/verify                     0 B                0 B
├ ● /[locale]/blog                            1.67 kB        98.7 kB
├   ├ /es/blog
├   └ /en/blog
├ ƒ /[locale]/blog/[slug]                     1.66 kB         101 kB
├ ƒ /[locale]/blog/rss.xml                    0 B                0 B
├ ● /[locale]/cart                            5.22 kB         144 kB
├   ├ /es/cart
├   └ /en/cart
├ ƒ /[locale]/catalog/[[...segments]]         6.84 kB         184 kB
├ ● /[locale]/checkout                        5.95 kB         173 kB
├   ├ /es/checkout
├   └ /en/checkout
├ ● /[locale]/faq                             1.66 kB         101 kB
├   ├ /es/faq
├   └ /en/faq
├ ● /[locale]/privacy                         1.67 kB        98.7 kB
├   ├ /es/privacy
├   └ /en/privacy
├ ƒ /[locale]/product/[slug]                  3.66 kB         146 kB
├ ● /[locale]/returns                         1.67 kB        98.7 kB
├   ├ /es/returns
├   └ /en/returns
├ ● /[locale]/terms                           1.67 kB        98.7 kB
├   ├ /es/terms
├   └ /en/terms
├ ƒ /api/admin/blog/posts                     0 B                0 B
├ ƒ /api/admin/blog/posts/[id]                0 B                0 B
├ ƒ /api/admin/blog/posts/[id]/publish        0 B                0 B
├ ƒ /api/admin/blog/posts/[id]/unpublish      0 B                0 B
├ ƒ /api/admin/media                          0 B                0 B
├ ƒ /api/admin/media/[...key]                 0 B                0 B
├ ƒ /api/admin/media/proofs                   0 B                0 B
├ ƒ /api/admin/media/proofs/[id]              0 B                0 B
├ ƒ /api/admin/media/upload                   0 B                0 B
├ ƒ /api/admin/terminals                      0 B                0 B
├ ƒ /api/admin/terminals/[id]/regenerate-key  0 B                0 B
├ ƒ /api/admin/terminals/[id]/revoke          0 B                0 B
├ ƒ /api/checkout/drafts                      0 B                0 B
├ ƒ /api/checkout/drafts/active               0 B                0 B
├ ƒ /api/checkout/orders                      0 B                0 B
├ ƒ /api/checkout/revalidate                  0 B                0 B
├ ƒ /api/cloud/catalog/featured               0 B                0 B
├ ○ /api/env-check                            0 B                0 B
├ ƒ /api/image-proxy                          0 B                0 B
├ ƒ /api/taxonomies/[type]                    0 B                0 B
└ ƒ /sitemap.xml                              0 B                0 B
+ First Load JS shared by all                 87.3 kB
  ├ chunks/2117-a8560d9c979028d0.js           31.7 kB
  ├ chunks/fd9d1056-b2fbeae2bbf6ca90.js       53.6 kB
  └ other shared chunks (total)               1.96 kB


ƒ Middleware                                  39.3 kB

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses getStaticProps)
ƒ  (Dynamic)  server-rendered on demand

```

## Build web
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && npm run build -w apps/web
```
- Exit: 0
```text

> @pos/web@0.0.0 build
> next build

  ▲ Next.js 14.2.5

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/25) ...
   Generating static pages (6/25) 
   Generating static pages (12/25) 
   Generating static pages (18/25) 
 ✓ Generating static pages (25/25)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    138 B          87.3 kB
├ ○ /_not-found                          873 B            88 kB
├ ○ /customers                           5.21 kB         138 kB
├ ● /customers/[id]/credit               3.37 kB         126 kB
├   └ /customers/detail/credit
├ ○ /customers/credit                    3.39 kB         126 kB
├ ○ /dashboard                           2.85 kB         105 kB
├ ○ /error/data                          3.15 kB        98.4 kB
├ ○ /error/db                            3.81 kB        99.1 kB
├ ○ /error/generic                       3.15 kB        98.4 kB
├ ○ /error/render                        3.15 kB        98.4 kB
├ ○ /inventory                           4.12 kB         126 kB
├ ○ /new-sale                            5.91 kB        93.1 kB
├ ○ /products                            149 kB          275 kB
├ ○ /reports/daily                       2.37 kB        89.5 kB
├ ○ /sales                               5.32 kB         127 kB
├ ○ /sales/detail                        4.84 kB         100 kB
├ ○ /settings                            756 B          94.7 kB
├ ○ /settings/cash-register              2.31 kB        89.5 kB
├ ○ /settings/expansions                 4.68 kB         130 kB
├ ○ /settings/game-types                 4.01 kB         130 kB
├ ○ /settings/integrations               2.17 kB        96.2 kB
├ ○ /tournaments                         5.9 kB          128 kB
└ ● /tournaments/[id]                    11.9 kB         137 kB
    └ /tournaments/detail
+ First Load JS shared by all            87.2 kB
  ├ chunks/1dd3208c-90f506bcbc815e19.js  53.6 kB
  ├ chunks/842-cf99cc78d595c8cd.js       31.6 kB
  └ other shared chunks (total)          1.9 kB


○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses getStaticProps)

```

## Implementation audit
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && npm run gov:impl:audit -- 'pos-sync-taxonomy-parity-v1'
```
- Exit: 0
```text

> gov:impl:audit
> node ./scripts/governance/impl-audit.js pos-sync-taxonomy-parity-v1

Implementation audit workflow
- Follow .agent/workflows/impl-audit.md
- Target spec: pos-sync-taxonomy-parity-v1
- Output: audit report and verdict
```

## No console runtime logs
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && rg -n 'console\.(log|warn|error)' apps/desktop apps/cloud-api/src -S
```
- Exit: 1
```text
```

## No ProductCategory enum usage
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && rg -n 'enum\s+ProductCategory|ProductCategory\b' apps/web/src apps/desktop -S
```
- Exit: 1
```text
```

## No hardcoded category SelectItem usage
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && rg -n 'SelectItem\s*\{.*category|category.*SelectItem' apps/web/src -S
```
- Exit: 1
```text
```

## No legacy category constants
```bash
cd '/Users/enriquemoya/Documents/GitHub/Electron-Pos' && rg -n 'categoryTCGSealed|categoryTCGSingle|categoryAccessory|categoryCommodity|categoryService' apps/web/src -S
```
- Exit: 1
```text
```
