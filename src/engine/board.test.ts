import { describe, expect, it } from 'vitest';
import {
  chordReveal,
  createBoard,
  cycleMark,
  flagCount,
  isCleared,
  placeMines,
  reveal,
} from './board';
import { COLS, ROWS, forEachNeighbor, isPlayable, waterCells } from './map';
import { mulberry32 } from './rng';

const SAFE = waterCells[Math.floor(waterCells.length / 2)];

function countMines(board: ReturnType<typeof createBoard>): number {
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board.mine[r][c]) n++;
  return n;
}

describe('placeMines', () => {
  it('platziert exakt die gewünschte Minenzahl, nur auf Wasserzellen', () => {
    const board = createBoard();
    placeMines(board, SAFE, 99, mulberry32(1));
    expect(countMines(board)).toBe(99);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (board.mine[r][c]) expect(isPlayable[r][c]).toBe(true);
  });

  it('hält das 3×3-Umfeld des ersten Klicks frei (First-Click-Safety)', () => {
    for (let seed = 0; seed < 25; seed++) {
      const board = createBoard();
      placeMines(board, SAFE, 150, mulberry32(seed));
      forEachNeighbor(SAFE.r, SAFE.c, (r, c) => expect(board.mine[r][c]).toBe(false));
    }
  });

  it('berechnet korrekte Nachbarzahlen', () => {
    const board = createBoard();
    placeMines(board, SAFE, 150, mulberry32(7));
    for (const { r, c } of waterCells) {
      if (board.mine[r][c]) continue;
      let expected = 0;
      forEachNeighbor(r, c, (nr, nc) => {
        if (board.mine[nr][nc]) expected++;
      });
      expect(board.count[r][c]).toBe(expected);
    }
  });
});

describe('reveal (Flood-Fill)', () => {
  it('deckt bei einer 0-Zelle den zusammenhängenden Bereich samt Rand auf', () => {
    const board = createBoard();
    placeMines(board, SAFE, 45, mulberry32(2));
    const zero = waterCells.find(({ r, c }) => !board.mine[r][c] && board.count[r][c] === 0)!;
    const cells = reveal(board, zero.r, zero.c);
    expect(cells.length).toBeGreaterThan(1);
    // Rand des Bereichs: jede aufgedeckte 0-Zelle hat nur aufgedeckte/markierte Nachbarn
    for (const { r, c } of cells) {
      if (board.count[r][c] !== 0) continue;
      forEachNeighbor(r, c, (nr, nc) => {
        if (isPlayable[nr][nc])
          expect(board.revealed[nr][nc] || board.mark[nr][nc] !== 'none').toBe(true);
      });
    }
  });

  it('deckt markierte Zellen nicht auf', () => {
    const board = createBoard();
    placeMines(board, SAFE, 45, mulberry32(3));
    const target = waterCells.find(({ r, c }) => !board.mine[r][c])!;
    cycleMark(board, target.r, target.c); // Flagge
    expect(reveal(board, target.r, target.c)).toHaveLength(0);
    expect(board.revealed[target.r][target.c]).toBe(false);
  });

  it('deckt eine direkt angeklickte Zahlzelle ohne Flood-Fill auf', () => {
    const board = createBoard();
    placeMines(board, SAFE, 150, mulberry32(4));
    const numbered = waterCells.find(({ r, c }) => !board.mine[r][c] && board.count[r][c] > 0)!;
    const cells = reveal(board, numbered.r, numbered.c);
    expect(cells).toEqual([{ r: numbered.r, c: numbered.c }]);
  });
});

describe('chordReveal', () => {
  function findChordable(board: ReturnType<typeof createBoard>) {
    // Zahlzelle aufdecken und alle Minen-Nachbarn korrekt flaggen
    const cell = waterCells.find(({ r, c }) => !board.mine[r][c] && board.count[r][c] > 0)!;
    board.revealed[cell.r][cell.c] = true;
    forEachNeighbor(cell.r, cell.c, (nr, nc) => {
      if (board.mine[nr][nc]) board.mark[nr][nc] = 'flag';
    });
    return cell;
  }

  it('deckt bei passender Flaggenzahl die restlichen Nachbarn auf', () => {
    const board = createBoard();
    placeMines(board, SAFE, 150, mulberry32(5));
    const cell = findChordable(board);
    const cells = chordReveal(board, cell.r, cell.c)!;
    expect(cells).not.toBeNull();
    forEachNeighbor(cell.r, cell.c, (nr, nc) => {
      if (!isPlayable[nr][nc]) return;
      if (board.mark[nr][nc] === 'flag') expect(board.revealed[nr][nc]).toBe(false);
      else expect(board.revealed[nr][nc]).toBe(true);
    });
    for (const { r, c } of cells) expect(board.mine[r][c]).toBe(false);
  });

  it('tut nichts, wenn die Flaggenzahl nicht stimmt', () => {
    const board = createBoard();
    placeMines(board, SAFE, 150, mulberry32(6));
    const cell = waterCells.find(({ r, c }) => !board.mine[r][c] && board.count[r][c] > 0)!;
    board.revealed[cell.r][cell.c] = true;
    expect(chordReveal(board, cell.r, cell.c)).toBeNull();
  });

  it('deckt bei falsch gesetzter Flagge die Mine mit auf (Verlust-Fall)', () => {
    const board = createBoard();
    placeMines(board, SAFE, 150, mulberry32(8));
    // Zelle mit Zahl n: flagge n sichere Nachbarn statt der Minen
    const cell = waterCells.find(({ r, c }) => {
      if (board.mine[r][c] || board.count[r][c] === 0) return false;
      let safeNeighbors = 0;
      forEachNeighbor(r, c, (nr, nc) => {
        if (isPlayable[nr][nc] && !board.mine[nr][nc] && !(nr === r && nc === c)) safeNeighbors++;
      });
      return safeNeighbors >= board.count[r][c];
    })!;
    board.revealed[cell.r][cell.c] = true;
    let toFlag = board.count[cell.r][cell.c];
    forEachNeighbor(cell.r, cell.c, (nr, nc) => {
      if (toFlag > 0 && isPlayable[nr][nc] && !board.mine[nr][nc] && !(nr === cell.r && nc === cell.c)) {
        board.mark[nr][nc] = 'flag';
        toFlag--;
      }
    });
    const cells = chordReveal(board, cell.r, cell.c)!;
    expect(cells.some(({ r, c }) => board.mine[r][c])).toBe(true);
  });
});

describe('Markierungen & Sieg', () => {
  it('zykliert Flagge → Fragezeichen → leer', () => {
    const board = createBoard();
    const { r, c } = waterCells[0];
    expect(cycleMark(board, r, c)).toBe('flag');
    expect(flagCount(board)).toBe(1);
    expect(cycleMark(board, r, c)).toBe('qmark');
    expect(flagCount(board)).toBe(0);
    expect(cycleMark(board, r, c)).toBe('none');
  });

  it('markiert keine aufgedeckten oder Land-Zellen', () => {
    const board = createBoard();
    const { r, c } = waterCells[0];
    board.revealed[r][c] = true;
    expect(cycleMark(board, r, c)).toBeNull();
    expect(cycleMark(board, 0, 0)).toBeNull(); // Land
  });

  it('isCleared: true genau dann, wenn alle sicheren Zellen aufgedeckt sind', () => {
    const board = createBoard();
    placeMines(board, SAFE, 45, mulberry32(9));
    expect(isCleared(board)).toBe(false);
    for (const { r, c } of waterCells) if (!board.mine[r][c]) board.revealed[r][c] = true;
    expect(isCleared(board)).toBe(true);
  });
});
