import { describe, expect, it } from 'vitest';
import { Game } from './game';
import { isPlayable, waterCells } from './map';
import { isAtGoal } from './patrol';
import { mulberry32 } from './rng';
import { DIFFICULTIES, type Cell, type GameStatus } from './types';

const SAFE = waterCells[Math.floor(waterCells.length / 2)];

describe('Game (Klassisch)', () => {
  it('startet idle, erster Klick platziert Minen und startet das Spiel', () => {
    const game = new Game('classic', 'easy', mulberry32(1));
    expect(game.status).toBe('idle');
    expect(game.board.minesPlaced).toBe(false);
    game.revealAt(SAFE.r, SAFE.c);
    expect(game.status).toBe('playing');
    expect(game.board.minesPlaced).toBe(true);
    expect(game.board.revealed[SAFE.r][SAFE.c]).toBe(true);
    expect(game.board.mine[SAFE.r][SAFE.c]).toBe(false);
  });

  it('erster Klick ist nie eine Mine (100 Seeds)', () => {
    for (let seed = 0; seed < 100; seed++) {
      const game = new Game('classic', 'hard', mulberry32(seed));
      const start = waterCells[seed % waterCells.length];
      game.revealAt(start.r, start.c);
      expect(game.status).toBe('playing');
    }
  });

  it('verliert beim Klick auf eine Mine und deckt alle Minen auf', () => {
    const game = new Game('classic', 'easy', mulberry32(2));
    game.revealAt(SAFE.r, SAFE.c);
    const mine = game.allMines()[0];
    const statuses: GameStatus[] = [];
    game.on('status', (s) => statuses.push(s));
    game.revealAt(mine.r, mine.c);
    expect(game.status).toBe('lost');
    for (const { r, c } of game.allMines()) expect(game.board.revealed[r][c]).toBe(true);
    expect(statuses).toContain('lost');
  });

  it('gewinnt, wenn alle sicheren Zellen aufgedeckt sind', () => {
    const game = new Game('classic', 'easy', mulberry32(3));
    game.revealAt(SAFE.r, SAFE.c);
    for (const { r, c } of waterCells)
      if (!game.board.mine[r][c] && !game.board.revealed[r][c]) game.revealAt(r, c);
    expect(game.status).toBe('won');
  });

  it('Counter = Minen − Flaggen', () => {
    const game = new Game('classic', 'easy', mulberry32(4));
    let counter = -1;
    game.on('counter', (v) => (counter = v));
    game.toggleMarkAt(SAFE.r, SAFE.c);
    expect(counter).toBe(DIFFICULTIES.easy.mines - 1);
  });

  it('ignoriert Klicks nach Spielende', () => {
    const game = new Game('classic', 'easy', mulberry32(5));
    game.revealAt(SAFE.r, SAFE.c);
    const mine = game.allMines()[0];
    game.revealAt(mine.r, mine.c);
    expect(game.status).toBe('lost');
    const before = JSON.stringify(game.board.revealed);
    game.revealAt(SAFE.r + 1, SAFE.c);
    game.toggleMarkAt(SAFE.r + 1, SAFE.c);
    expect(JSON.stringify(game.board.revealed)).toBe(before);
  });
});

describe('Game (Patrouille)', () => {
  it('platziert das Schiff auf der Startseite mit garantiert freiem Pfad', () => {
    for (let seed = 0; seed < 20; seed++) {
      const game = new Game('patrol', 'hard', mulberry32(seed));
      expect(game.ship).not.toBeNull();
      const ship = game.ship!;
      expect(isPlayable[ship.r][ship.c]).toBe(true);
      expect(game.board.mine[ship.r][ship.c]).toBe(false);
      expect(game.lives).toBe(DIFFICULTIES.hard.lives);
      expect(game.safePath).not.toBeNull();
      // Pfad endet in der Zielzone und enthält keine Minen
      const path = game.safePath!;
      expect(isAtGoal(path[path.length - 1].c, game.patrolDir, game.patrolEndCol)).toBe(true);
      for (const { r, c } of path.slice(1)) expect(game.board.mine[r][c]).toBe(false);
    }
  });

  it('Mine kostet ein Leben, Schiff bleibt stehen; 0 Leben = verloren', () => {
    const game = new Game('patrol', 'hard', mulberry32(1)); // 1 Leben
    const ship = game.ship!;
    // benachbarte Mine suchen bzw. konstruieren
    const dirs: Cell[] = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 },
    ];
    let mineDir = dirs.find(
      (d) => isPlayable[ship.r + d.r]?.[ship.c + d.c] && game.board.mine[ship.r + d.r][ship.c + d.c],
    );
    if (!mineDir) {
      mineDir = dirs.find((d) => isPlayable[ship.r + d.r]?.[ship.c + d.c])!;
      game.board.mine[ship.r + mineDir.r][ship.c + mineDir.c] = true;
    }
    const exploded: Cell[] = [];
    game.on('exploded', (cell) => exploded.push(cell));
    game.moveShip(mineDir.r, mineDir.c);
    expect(exploded).toHaveLength(1);
    expect(game.ship).toEqual(ship); // nicht bewegt
    expect(game.status).toBe('lost');
  });

  it('gewinnt beim Erreichen der Zielzone', () => {
    const game = new Game('patrol', 'easy', mulberry32(2));
    // Engine-Shortcut: dem sicheren Pfad folgen
    const path = game.safePath!;
    for (let i = 1; i < path.length && game.status !== 'won'; i++) {
      const dr = path[i].r - path[i - 1].r;
      const dc = path[i].c - path[i - 1].c;
      game.moveShip(dr, dc);
    }
    expect(game.status).toBe('won');
  });

  it('bekannte Minen blockieren, unbewegbare Richtungen ändern nichts', () => {
    const game = new Game('patrol', 'easy', mulberry32(3));
    const ship = game.ship!;
    game.moveShip(-99, 0); // out of bounds → ignoriert
    expect(game.ship).toEqual(ship);
  });
});
