import { Hono } from 'hono';

type Env = {
  Bindings: {
    DB: D1Database;
    ASSETS: Fetcher;
  };
};

const app = new Hono<Env>();

// Valid slugs come from the static site (dist/projects.json, generated at build time).
// Cached per isolate; refreshed every few minutes so a new deploy's projects get picked up.
let slugCache: { at: number; slugs: Set<string> } | null = null;
const SLUG_TTL_MS = 5 * 60 * 1000;

async function validSlugs(env: Env['Bindings'], origin: string): Promise<Set<string>> {
  if (slugCache && Date.now() - slugCache.at < SLUG_TTL_MS) return slugCache.slugs;
  const res = await env.ASSETS.fetch(new URL('/projects.json', origin));
  const { slugs } = (await res.json()) as { slugs: string[] };
  slugCache = { at: Date.now(), slugs: new Set(slugs) };
  return slugCache.slugs;
}

// All counts in one request. Edge-cacheable: counts may lag by up to ~30s, which is fine for hearts.
app.get('/api/loves', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT slug, count FROM loves').all<{ slug: string; count: number }>();
  const loves = Object.fromEntries(results.map((r) => [r.slug, r.count]));
  c.header('Cache-Control', 'public, max-age=15, s-maxage=30');
  return c.json({ loves });
});

// Add one love. The client remembers it has voted; abuse protection is a Cloudflare rate-limit rule on /api/*.
app.post('/api/loves/:slug', async (c) => {
  // Same-site requests only (browsers always send Origin on cross-site and fetch POSTs).
  const origin = c.req.header('Origin');
  if (!origin || new URL(origin).host !== new URL(c.req.url).host) {
    return c.json({ error: 'forbidden' }, 403);
  }

  const slug = c.req.param('slug');
  const slugs = await validSlugs(c.env, new URL(c.req.url).origin);
  if (!slugs.has(slug)) return c.json({ error: 'unknown project' }, 404);

  const row = await c.env.DB.prepare(
    'INSERT INTO loves (slug, count) VALUES (?1, 1) ON CONFLICT(slug) DO UPDATE SET count = count + 1 RETURNING count',
  )
    .bind(slug)
    .first<{ count: number }>();

  c.header('Cache-Control', 'no-store');
  return c.json({ count: row?.count ?? 1 });
});

app.all('/api/*', (c) => c.json({ error: 'not found' }, 404));

// Anything else (shouldn't happen: only /api/* runs the Worker first) falls through to static assets.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
