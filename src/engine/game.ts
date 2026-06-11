import {
  type BoardState,
  chordReveal,
  createBoard,
  cycleMark,
  flagCount,
  isCleared,
  mineCells,
  placeMines,
  reveal,
} from './board';
import { PATROL_LEFT_COL, PATROL_RIGHT_COL, inBounds, isPlayable, waterCells } from './map';
import { findPatrolPath, isAtGoal, type PatrolDir } from './patrol';
import { pick, type Rng } from './rng';
import { DIFFICULTIES, type Cell, type Difficulty, type GameMode, type GameStatus, type Mark } from './types';

export interface GameEvents {
  /** Neu aufgedeckte sichere Zellen (Flood-Fill-Ergebnis). */
  revealed: (cells: Cell[]) => void;
  /** Mine getroffen (aufgedeckt). */
  exploded: (cell: Cell) => void;
  marked: (cell: Cell, mark: Mark) => void;
  /** Restminen-Anzeige (Minen − Flaggen) bzw. Flaggenzahl im Patrouille-Modus. */
  counter: (value: number) => void;
  lives: (lives: number) => void;
  shipMoved: (from: Cell, to: Cell) => void;
  status: (status: GameStatus) => void;
}

type Listeners = { [K in keyof GameEvents]: GameEvents[K][] };

const PATROL_PLACEMENT_ATTEMPTS = 100;

export class Game {
  readonly mode: GameMode;
  readonly difficulty: Difficulty;
  readonly board: BoardState;
  readonly mineTotal: number;

  status: GameStatus = 'idle';
  lives = 0;
  ship: Cell | null = null;
  patrolDir: PatrolDir = 1;
  patrolStartCol = 0;
  patrolEndCol = 0;
  /** Garantiert existierender minenfreier Pfad (nur Patrouille, für Debug/Tests). */
  safePath: Cell[] | null = null;

  private readonly rng: Rng;
  private readonly listeners: Listeners = {
    revealed: [],
    exploded: [],
    marked: [],
    counter: [],
    lives: [],
    shipMoved: [],
    status: [],
  };

  constructor(mode: GameMode, difficulty: Difficulty, rng: Rng = Math.random) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.rng = rng;
    this.board = createBoard();
    this.mineTotal = DIFFICULTIES[difficulty].mines;
    if (mode === 'patrol') this.setupPatrol();
  }

  on<K extends keyof GameEvents>(event: K, fn: GameEvents[K]): void {
    this.listeners[event].push(fn);
  }

  private emit<K extends keyof GameEvents>(event: K, ...args: Parameters<GameEvents[K]>): void {
    for (const fn of this.listeners[event]) (fn as (...a: Parameters<GameEvents[K]>) => void)(...args);
  }

  get counterValue(): number {
    return this.mode === 'patrol' ? flagCount(this.board) : this.mineTotal - flagCount(this.board);
  }

  private setStatus(status: GameStatus): void {
    this.status = status;
    this.emit('status', status);
  }

  private get active(): boolean {
    return this.status === 'idle' || this.status === 'playing';
  }

  // ── Klassisch ──────────────────────────────────────────────────────────

  /** Linksklick/Enter: Zelle aufdecken (erster Klick platziert die Minen). */
  revealAt(r: number, c: number): void {
    if (this.mode !== 'classic' || !this.active) return;
    if (!inBounds(r, c) || !isPlayable[r][c]) return;
    if (this.board.revealed[r][c] || this.board.mark[r][c] !== 'none') return;

    if (!this.board.minesPlaced) {
      placeMines(this.board, { r, c }, this.mineTotal, this.rng);
      this.board.minesPlaced = true;
      this.setStatus('playing');
    }

    if (this.board.mine[r][c]) {
      this.board.revealed[r][c] = true;
      this.emit('exploded', { r, c });
      this.lose();
      return;
    }
    this.emit('revealed', reveal(this.board, r, c));
    if (isCleared(this.board)) this.win();
  }

  /** Chord-Klick auf eine aufgedeckte Zahl. */
  chordAt(r: number, c: number): void {
    if (this.mode !== 'classic' || this.status !== 'playing' || !inBounds(r, c)) return;
    const cells = chordReveal(this.board, r, c);
    if (cells === null || cells.length === 0) return;
    const hits = cells.filter(({ r: mr, c: mc }) => this.board.mine[mr][mc]);
    this.emit('revealed', cells.filter(({ r: mr, c: mc }) => !this.board.mine[mr][mc]));
    if (hits.length > 0) {
      for (const hit of hits) this.emit('exploded', hit);
      this.lose();
      return;
    }
    if (isCleared(this.board)) this.win();
  }

  /** Rechtsklick/Space/Long-Press: Flagge ↔ Fragezeichen ↔ leer. */
  toggleMarkAt(r: number, c: number): void {
    if (!this.active || !inBounds(r, c)) return;
    const mark = cycleMark(this.board, r, c);
    if (mark === null) return;
    this.emit('marked', { r, c }, mark);
    this.emit('counter', this.counterValue);
  }

  // ── Patrouille ─────────────────────────────────────────────────────────

  private setupPatrol(): void {
    this.patrolDir = this.rng() < 0.5 ? 1 : -1;
    this.patrolStartCol = this.patrolDir === 1 ? PATROL_LEFT_COL : PATROL_RIGHT_COL;
    this.patrolEndCol = this.patrolDir === 1 ? PATROL_RIGHT_COL : PATROL_LEFT_COL;
    const startCells = waterCells.filter((w) =>
      this.patrolDir === 1 ? w.c <= this.patrolStartCol : w.c >= this.patrolStartCol,
    );
    const start = pick(startCells, this.rng);

    let path: Cell[] | null = null;
    for (let attempt = 0; attempt < PATROL_PLACEMENT_ATTEMPTS && path === null; attempt++) {
      placeMines(this.board, start, this.mineTotal, this.rng);
      path = findPatrolPath(this.board, start, this.patrolDir, this.patrolEndCol);
    }
    this.safePath = path;
    this.board.minesPlaced = true;
    this.ship = start;
    this.board.revealed[start.r][start.c] = true;
    this.lives = DIFFICULTIES[this.difficulty].lives;
  }

  /** Schiff um eine Zelle bewegen; deckt das Ziel auf bzw. trifft eine Mine. */
  moveShip(dr: number, dc: number): void {
    if (this.mode !== 'patrol' || !this.active || !this.ship) return;
    const r = this.ship.r + dr;
    const c = this.ship.c + dc;
    if (!inBounds(r, c) || !isPlayable[r][c]) return;
    if (this.status === 'idle') this.setStatus('playing');

    if (this.board.revealed[r][c]) {
      if (this.board.mine[r][c]) return; // bekannte Mine blockiert den Weg
    } else if (this.board.mine[r][c]) {
      this.board.revealed[r][c] = true;
      this.lives--;
      this.emit('exploded', { r, c });
      this.emit('lives', this.lives);
      if (this.lives <= 0) this.lose();
      return; // Schiff bleibt stehen
    } else {
      this.board.revealed[r][c] = true;
      this.emit('revealed', [{ r, c }]);
    }

    const from = this.ship;
    this.ship = { r, c };
    this.emit('shipMoved', from, this.ship);
    if (isAtGoal(c, this.patrolDir, this.patrolEndCol)) this.win();
  }

  /** Zielzonen-Zellen (goldene Markierung). */
  goalCells(): Cell[] {
    return waterCells.filter(({ c }) => isAtGoal(c, this.patrolDir, this.patrolEndCol));
  }

  // ── Gemeinsam ──────────────────────────────────────────────────────────

  private win(): void {
    this.setStatus('won');
  }

  private lose(): void {
    if (this.mode === 'classic') {
      const mines = mineCells(this.board);
      for (const { r, c } of mines) this.board.revealed[r][c] = true;
    }
    this.setStatus('lost');
  }

  /** Für den Verlust-Screen: alle Minenpositionen. */
  allMines(): Cell[] {
    return mineCells(this.board);
  }
}
