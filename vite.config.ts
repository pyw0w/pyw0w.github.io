import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const pagesRepo = process.env.GITHUB_PAGES === 'true' ? repositoryName : undefined;
const base = pagesRepo && pagesRepo !== `${process.env.GITHUB_ACTOR}.github.io` ? `/${pagesRepo}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (id.includes('@tanstack/react-query') || id.includes('zod')) return 'data';
          if (id.includes('react-router') || id.includes('react') || id.includes('scheduler')) return 'react';
          return 'vendor';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
