/// <reference types="vitest/config" />
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Hormuz Strategic ist derzeit offline: heyartur.de zeigt nur die private Zeiterfassungs-App.
 * Auf true setzen, um Spiel und Infoseite wieder mit auszuliefern. Dann braucht die Website
 * aber wieder ein Impressum (siehe README).
 */
const GAME_ONLINE = false;

const gamePages = {
  landing: resolve(__dirname, 'hormuz/index.html'),
  game: resolve(__dirname, 'minesweeper/index.html'),
};

/** Ohne Spiel auch dessen Bilder und Daten aus public/minesweeper nicht ausliefern. */
const dropGameAssets: Plugin = {
  name: 'drop-game-assets',
  apply: 'build',
  closeBundle() {
    rmSync(resolve(__dirname, 'dist/minesweeper'), { recursive: true, force: true });
  },
};

// Custom Domain (heyartur.de) liegt im Root der Pages-Site → base '/'.
export default defineConfig({
  base: '/',
  plugins: GAME_ONLINE ? [] : [dropGameAssets],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'zeiterfassung/index.html'),
        appPrivacy: resolve(__dirname, 'zeiterfassung/datenschutz/index.html'),
        ...(GAME_ONLINE ? gamePages : {}),
      },
      output: {
        manualChunks: GAME_ONLINE ? { three: ['three'] } : undefined,
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
