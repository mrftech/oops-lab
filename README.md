# OopsLab

Home for all my projects: a static [Astro](https://astro.build) site served by a Cloudflare Worker (static assets), with a tiny API + D1 database for the "love" button.

```
src/content/projects/*.md   one file per project (the file name is its slug)
src/pages/                  index, 404, projects.json (slug list for the API)
src/components/             ProjectCard, LoveButton, Header, Footer
worker/index.ts             Hono API: GET /api/loves, POST /api/loves/:slug
migrations/                 D1 schema
design/                     original HTML concept (reference only)
```

## Add a project

Create `src/content/projects/my-thing.md`:

```md
---
title: My Thing
tagline: One sentence about it.
status: live            # live | testing | building | archived
tags: [Tool, Web]
order: 7
thumb: dice             # world | bloom | tiny | museum | prompt | dice
code: FUN_007
url: https://my-thing.example.com   # omit for "soon"
---
```

Drop `sample: true` once an entry is real (the placeholder footnote disappears when no samples remain).
Don't rename a file after launch: its name is the key for its love count.

## Develop

This project uses **pnpm only** (`npm install` and `yarn` are blocked by a preinstall check). Enable it with `corepack enable` or `npm i -g pnpm`.

```powershell
pnpm install
pnpm db:migrate:local   # once: creates the local D1 table
pnpm dev                # site on http://localhost:4321
pnpm dev:api            # (second terminal) Worker on :8787; /api is proxied from the site
pnpm preview            # or: build + serve everything exactly like production on :8787
pnpm check              # type-check site + worker
```

Without `dev:api` the site still works; hearts just show no counts.

## Deploy (Cloudflare)

```powershell
pnpm wrangler login
# (done) database `oopslab` already created; its id and the personal account_id are in wrangler.jsonc
pnpm db:migrate                 # apply schema to the remote database
pnpm cf:deploy
```

Then in the Cloudflare dashboard add a **rate limiting rule** for `/api/*` (e.g. 10 POSTs/min per IP). It is the abuse protection for the love button; add Turnstile only if you actually see abuse.

## Scaling notes

- Static pages are served from the edge as free static assets; only `/api/*` runs the Worker.
- `GET /api/loves` is edge-cached for ~30s, so reads barely touch D1.
- If one project gets heavy write traffic, swap D1 for a Durable Object per project behind the same API.
