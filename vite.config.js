import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps the production build portable, so the dist/ folder can be
// dropped into any subfolder or static host without rewriting asset paths.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2019',
    assetsInlineLimit: 0,
  },
});
