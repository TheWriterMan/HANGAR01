import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/**
 * Serves /content/ directory as static assets in dev,
 * and copies content/checklists/ into dist/ during build.
 */
function serveContentDir(): Plugin {
  return {
    name: 'serve-content-dir',
    configureServer(server) {
      server.middlewares.use('/content', (req, res, next) => {
        const filePath = path.resolve(__dirname, 'content', req.url?.slice(1) || '');
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Content-Type', 'application/json');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
    writeBundle() {
      // Copy content/checklists into dist/content/checklists for production
      const src = path.resolve(__dirname, 'content/checklists');
      const dest = path.resolve(__dirname, 'dist/content/checklists');
      if (fs.existsSync(src)) {
        fs.mkdirSync(dest, { recursive: true });
        for (const file of fs.readdirSync(src)) {
          fs.copyFileSync(path.join(src, file), path.join(dest, file));
        }
      }
    },
  };
}

/** Vendor chunks change less often than app code, so they stay cached across deploys. */
const VENDOR_CHUNKS: Record<string, string> = {
  'framer-motion': 'vendor-motion',
  'motion-dom': 'vendor-motion',
  'motion-utils': 'vendor-motion',
  'react-router': 'vendor-router',
  'react-router-dom': 'vendor-router',
  react: 'vendor-react',
  'react-dom': 'vendor-react',
  scheduler: 'vendor-react',
};

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), serveContentDir()],
  // Draft posts show on Vercel preview builds (the dev branch), never in production.
  define: { __SHOW_DRAFTS__: JSON.stringify(process.env.VERCEL_ENV === 'preview') },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: isSsrBuild
    ? {}
    : {
        rollupOptions: {
          output: {
            manualChunks(id) {
              const pkg = id.match(/node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/)?.[1];
              return pkg ? VENDOR_CHUNKS[pkg] : undefined;
            },
          },
        },
      },
}));
