// @ts-check
import { defineConfig } from 'astro/config';

// Static output. The Cloudflare Worker in ./worker serves dist/ and the /api/* routes.
export default defineConfig({
  output: 'static',
  server: {
    port: 4321,
  },
  vite: {
    build: {
      // Never inline scripts into the HTML, so the CSP in public/_headers can stay `script-src 'self'`.
      assetsInlineLimit: 0,
    },
    server: {
      // `pnpm dev` + `pnpm dev:api` in two terminals: forward API calls to the Worker.
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
          headers: { Origin: 'http://localhost:8787' },
        },
      },
    },
  },
});
