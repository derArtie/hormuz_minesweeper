import type { BoardState } from './board';
import { inBounds, isPlayable } from './map';
import type { Cell } from './types';

export type PatrolDir = 1 | -1;

export function isAtGoal(c: number, dir: PatrolDir, endCol: number): boolean {
  return dir === 1 ? c >= endCol : c <= endCol;
}

/**
 * BFS über die 4er-Nachbarschaft: kürzester minenfreier Weg vom Start in die
 * Zielzone. Liefert null, wenn das Minenfeld die Passage komplett blockiert.
 */
export function findPatrolPath(
  board: BoardState,
  start: Cell,
  dir: PatrolDir,
  endCol: number,
): Cell[] | null {
  const visited = new Set<number>();
  const parent = new Map<number, Cell>();
  const key = (cell: Cell) => cell.r * 1000 + cell.c;
  const queue: Cell[] = [start];
  visited.add(key(start));
  let goal: Cell | null = null;

  outer: while (queue.length > 0) {
    const { r, c } = queue.shift()!;
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const next = { r: r + dr, c: c + dc };
      if (!inBounds(next.r, next.c) || !isPlayable[next.r][next.c]) continue;
      if (board.mine[next.r][next.c] || visited.has(key(next))) continue;
      visited.add(key(next));
      parent.set(key(next), { r, c });
      if (isAtGoal(next.c, dir, endCol)) {
        goal = next;
        break outer;
      }
      queue.push(next);
    }
  }

  if (!goal) return null;
  const path: Cell[] = [];
  let cur: Cell | undefined = goal;
  while (cur) {
    path.push(cur);
    cur = parent.get(key(cur));
  }
  return path.reverse();
}
