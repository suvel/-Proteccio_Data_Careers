/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/process_document': 'http://localhost:3000',
      '/hello': 'http://localhost:3000',
      '/table': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
});
