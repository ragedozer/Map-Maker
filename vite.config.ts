import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

/**
 * Dev-server only: POST /__save-export?name=<file> writes the request body to
 * ./exports so exported files can be verified with `npm run check-png`
 * without going through the browser's download folder. Not part of the build.
 */
function saveExportPlugin(): Plugin {
  return {
    name: 'save-export',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-export', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        const url = new URL(req.url ?? '', 'http://localhost');
        const name = basename(url.searchParams.get('name') ?? 'export.png').replace(/[^\w.-]/g, '_');
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const dir = resolve(server.config.root, 'exports');
          mkdirSync(dir, { recursive: true });
          writeFileSync(resolve(dir, name), Buffer.concat(chunks));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ saved: `exports/${name}` }));
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), saveExportPlugin()],
});
