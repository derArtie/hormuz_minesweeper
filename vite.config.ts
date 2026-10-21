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
        home: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'hormuz/index.html'),
        game: resolve(__dirname, 'minesweeper/index.html'),
        app: resolve(__dirname, 'zeiterfassung/index.html'),
        appPrivacy: resolve(__dirname, 'zeiterfassung/datenschutz/index.html'),
        imprint: resolve(__dirname, 'impressum/index.html'),
        privacy: resolve(__dirname, 'datenschutz/index.html'),
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
