import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import type { Plugin } from 'vite';

function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '/';
        // Let Vite handle internals, API proxy, files, and /demo-site/ MPA entry
        if (
          url.startsWith('/api/') ||
          url.startsWith('/demo-site/') ||
          url.startsWith('/@') ||
          url.startsWith('/__') ||
          url.includes('.')
        ) return next();
        req.url = '/';
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        demo: resolve(__dirname, 'demo-site/index.html'),
      },
    },
  },
});
