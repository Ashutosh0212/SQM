import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages project URL: https://<user>.github.io/SQM/ */
export default defineConfig({
  base: '/SQM/',
  plugins: [react()],
  publicDir: 'public',
});
