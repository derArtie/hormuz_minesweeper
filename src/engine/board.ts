import { COLS, ROWS, cellIndex, forEachNeighbor, isPlayable, waterCells } from './map';
import type { Rng } from './rng';
import type { Cell, Mark } from './types';

export interface BoardState {
  /** true = Mine auf dieser Zelle */
  readonly mine: boolean[][];
  /** Anzahl benachbarter Minen (nur für Nicht-Minen-Zellen relevant) */
  readonly count: number[][];
  readonly revealed: boolean[][];
  readonly mark: Mark[][];
  minesPlaced: boolean;
}

function grid<T>(fill: T): T[][] {
  return Array.from({ length: ROWS }, () => new Array<T>(COLS).fill(fill));
}

export function createBoard(): BoardState {
  return { mine: grid(false), count: grid(0), revealed: grid(false), mark: grid('none'), minesPlaced: false };
}

/**
 * Platziert `mineCount` Minen auf Wasserzellen (Fisher-Yates), das 3×3-Umfeld
 * von `safe` bleibt frei (First-Click-Safety), und berechnet die Nachbarzahlen.
 */
export function placeMines(board: BoardState, safe: Cell, mineCount: number, rng: Rng): void {
  for (let r = 0; r < ROWS; r++) {
    board.mine[r].fill(false);
    board.count[r].fill(0);
  }
  const excluded = new Set<number>();
  forEachNeighbor(safe.r, safe.c, (nr, nc) => excluded.add(cellIndex(nr, nc)));
  const pool = waterCells.filter(({ r, c }) => !excluded.has(cellIndex(r, c)));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = Math.min(mineCount, pool.length);
  for (let i = 0; i < n; i++) board.mine[pool[i].r][pool[i].c] = true;
  for (const { r, c } of waterCells) {
    if (board.mine[r][c]) continue;
    let cnt = 0;
    forEachNeighbor(r, c, (nr, nc) => {
      if (board.mine[nr][nc]) cnt++;
    });
    board.count[r][c] = cnt;
  }
}

/**
 * Deckt eine Zelle auf; bei 0-Zellen Flood-Fill über die 8er-Nachbarschaft.
 * Markierte (Flagge/Fragezeichen) und nicht spielbare Zellen bleiben zu.
 * Liefert alle neu aufgedeckten Zellen (kann eine Mine enthalten, wenn direkt angeklickt).
 */
export function reveal(board: BoardState, r: number, c: number): Cell[] {
  const out: Cell[] = [];
  const stack: Cell[] = [{ r, c }];
  while (stack.length > 0) {
    const cell = stack.pop()!;
    if (!isPlayable[cell.r][cell.c]) continue;
    if (board.revealed[cell.r][cell.c] || board.mark[cell.r][cell.c] !== 'none') continue;
    board.revealed[cell.r][cell.c] = true;
    out.push(cell);
    if (!board.mine[cell.r][cell.c] && board.count[cell.r][cell.c] === 0) {
      forEachNeighbor(cell.r, cell.c, (nr, nc) => {
        if (!board.revealed[nr][nc]) stack.push({ r: nr, c: nc });
      });
    }
  }
  return out;
}

/**
 * Chord-Reveal: Auf einer aufgedeckten Zahl, deren Flaggenzahl der Zahl entspricht,
 * werden alle unmarkierten Nachbarn aufgedeckt. Liefert die neu aufgedeckten Zellen
 * (inkl. evtl. falsch geflaggter Minen!) oder null, wenn kein Chord möglich ist.
 */
export function chordReveal(board: BoardState, r: number, c: number): Cell[] | null {
  if (!board.revealed[r][c] || board.mine[r][c] || board.count[r][c] <= 0) return null;
  let flags = 0;
  forEachNeighbor(r, c, (nr, nc) => {
    if (board.mark[nr][nc] === 'flag') flags++;
  });
  if (flags !== board.count[r][c]) return null;
  const out: Cell[] = [];
  forEachNeighbor(r, c, (nr, nc) => {
    if (board.mark[nr][nc] !== 'flag' && !board.revealed[nr][nc])
      out.push(...reveal(board, nr, nc));
  });
  return out;
}

/** Zyklus Flagge → Fragezeichen → leer. Liefert die neue Markierung oder null. */
export function cycleMark(board: BoardState, r: number, c: number): Mark | null {
  if (!isPlayable[r][c] || board.revealed[r][c]) return null;
  const next: Record<Mark, Mark> = { none: 'flag', flag: 'qmark', qmark: 'none' };
  const mark = next[board.mark[r][c]];
  board.mark[r][c] = mark;
  return mark;
}

export function flagCount(board: BoardState): number {
  let n = 0;
  for (const { r, c } of waterCells) if (board.mark[r][c] === 'flag') n++;
  return n;
}

/** Sieg im Klassisch-Modus: alle minenfreien Wasserzellen aufgedeckt. */
export function isCleared(board: BoardState): boolean {
  for (const { r, c } of waterCells) if (!board.mine[r][c] && !board.revealed[r][c]) return false;
  return true;
}

export function mineCells(board: BoardState): Cell[] {
  return waterCells.filter(({ r, c }) => board.mine[r][c]);
}
