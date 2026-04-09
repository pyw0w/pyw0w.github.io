import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const pagesRepo = process.env.GITHUB_PAGES === 'true' ? repositoryName : undefined;
const base = pagesRepo && pagesRepo !== `${process.env.GITHUB_ACTOR}.github.io` ? `/${pagesRepo}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
