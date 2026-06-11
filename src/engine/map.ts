import { LAND_ROWS, MAP_COLS, MAP_ROWS, PLAY_ROWS } from './mapData';
import type { Cell } from './types';

export const COLS = MAP_COLS;
export const ROWS = MAP_ROWS;

function parse(rows: readonly string[]): boolean[][] {
  return rows.map((row) => Array.from(row, (ch) => ch === '1'));
}

/** true = Landmasse */
export const isLand: readonly (readonly boolean[])[] = parse(LAND_ROWS);
/** true = spielbare Wasserzelle */
export const isPlayable: readonly (readonly boolean[])[] = parse(PLAY_ROWS);

export const waterCells: readonly Cell[] = (() => {
  const cells: Cell[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (isPlayable[r][c]) cells.push({ r, c });
  return cells;
})();

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

export function cellIndex(r: number, c: number): number {
  return r * COLS + c;
}

/** Ruft cb für alle existierenden Zellen im 3×3-Umfeld auf (inkl. Zentrum). */
export function forEachNeighbor(r: number, c: number, cb: (r: number, c: number) => void): void {
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc)) cb(nr, nc);
    }
}

const minWaterCol = waterCells.reduce((m, w) => Math.min(m, w.c), COLS);
const maxWaterCol = waterCells.reduce((m, w) => Math.max(m, w.c), 0);

/** Start-/Zielspalten des Patrouille-Modus (wie v1: ±4 vom Wasserrand). */
export const PATROL_LEFT_COL = minWaterCol + 4;
export const PATROL_RIGHT_COL = maxWaterCol - 4;
