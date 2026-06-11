import type { Difficulty, GameMode } from './types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type ScoreTable = Record<Difficulty, number[]>;
export type ScoreData = Record<GameMode, ScoreTable>;

const KEY_V2 = 'hormuz_scores_v2';
const KEY_V1 = 'hormuz_scores';
const TOP_N = 5;

function emptyTable(): ScoreTable {
  return { easy: [], medium: [], hard: [] };
}

export function emptyScores(): ScoreData {
  return { classic: emptyTable(), patrol: emptyTable() };
}

function sanitizeTable(value: unknown): ScoreTable {
  const table = emptyTable();
  if (typeof value !== 'object' || value === null) return table;
  for (const diff of ['easy', 'medium', 'hard'] as const) {
    const list = (value as Record<string, unknown>)[diff];
    if (Array.isArray(list)) {
      table[diff] = list
        .filter((t): t is number => typeof t === 'number' && Number.isFinite(t) && t >= 0)
        .sort((a, b) => a - b)
        .slice(0, TOP_N);
    }
  }
  return table;
}

/**
 * Lädt Bestzeiten. Existiert nur das v1-Format (`hormuz_scores`, eine Tabelle
 * für beide Modi), wird es als Klassisch-Tabelle übernommen und im
 * v2-Format gespeichert; der v1-Key bleibt unangetastet.
 */
export function loadScores(storage: StorageLike): ScoreData {
  try {
    const v2 = storage.getItem(KEY_V2);
    if (v2 !== null) {
      const parsed: unknown = JSON.parse(v2);
      const scores = (parsed as { scores?: unknown }).scores;
      return {
        classic: sanitizeTable((scores as Record<string, unknown> | undefined)?.classic),
        patrol: sanitizeTable((scores as Record<string, unknown> | undefined)?.patrol),
      };
    }
    const v1 = storage.getItem(KEY_V1);
    if (v1 !== null) {
      const migrated: ScoreData = { classic: sanitizeTable(JSON.parse(v1)), patrol: emptyTable() };
      saveScores(storage, migrated);
      return migrated;
    }
  } catch {
    // korrupter Storage → frisch starten
  }
  return emptyScores();
}

export function saveScores(storage: StorageLike, data: ScoreData): void {
  try {
    storage.setItem(KEY_V2, JSON.stringify({ version: 2, scores: data }));
  } catch {
    // Storage voll/gesperrt → Bestzeiten gelten nur für die Sitzung
  }
}

/**
 * Trägt eine Zeit ein (Top 5, aufsteigend). Liefert den Rang (0-basiert)
 * oder null, wenn die Zeit nicht in die Top 5 kommt.
 */
export function addScore(
  data: ScoreData,
  mode: GameMode,
  diff: Difficulty,
  seconds: number,
): number | null {
  const list = data[mode][diff];
  list.push(seconds);
  list.sort((a, b) => a - b);
  if (list.length > TOP_N) list.length = TOP_N;
  const rank = list.indexOf(seconds);
  return rank === -1 ? null : rank;
}
