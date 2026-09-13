import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8080,
    strictPort: false,
    host: true,
    proxy: {
      '/predict': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/predict_video': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/predict_fecal': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
