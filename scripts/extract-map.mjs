// Einmaliges Hilfsskript: extrahiert RAW/PLAY aus dem Legacy-game.js (Git HEAD)
// und generiert src/engine/mapData.ts als kompakte Row-Strings.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const src = execSync('git show HEAD:minesweeper/game.js', { encoding: 'utf8' });

function extract(name) {
  const m = src.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
  if (!m) throw new Error(`${name} not found`);
  const nums = m[1].split(',').map((s) => s.trim()).filter((s) => s.length).map(Number);
  if (nums.length !== 2400) throw new Error(`${name}: expected 2400, got ${nums.length}`);
  const rows = [];
  for (let r = 0; r < 40; r++) rows.push(nums.slice(r * 60, (r + 1) * 60).join(''));
  return rows;
}

const land = extract('RAW');
const play = extract('PLAY');
const fmt = (rows) => rows.map((r) => `  '${r}',`).join('\n');

mkdirSync('src/engine', { recursive: true });
writeFileSync(
  'src/engine/mapData.ts',
  `// Auto-generiert aus v1 game.js (scripts/extract-map.mjs) — nicht von Hand editieren.
// Jede Zeile = 60 Zellen; LAND: '1' = Landmasse, PLAY: '1' = spielbare Wasserzelle.
export const MAP_COLS = 60;
export const MAP_ROWS = 40;

export const LAND_ROWS: readonly string[] = [
${fmt(land)}
];

export const PLAY_ROWS: readonly string[] = [
${fmt(play)}
];
`,
);
console.log('mapData.ts written');
