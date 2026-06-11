/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Custom Domain (heyartur.de) liegt im Root der Pages-Site → base '/'.
export default defineConfig({
  base: '/',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'minesweeper/index.html'),
      },
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
