import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Permite ajustar la base para despliegues en GitHub Pages
  base: process.env.BASE_PATH || '/',
  server: {
    port: 5173
  }
});
