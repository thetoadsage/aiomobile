import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: '/mobile/', plugins: [react()],
  server: { proxy: process.env.AIO_DEV_TARGET ? {
    '/api': { target: process.env.AIO_DEV_TARGET, changeOrigin: true },
    '/login': { target: process.env.AIO_DEV_TARGET, changeOrigin: true },
  } : undefined },
});
