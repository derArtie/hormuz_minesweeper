import { describe, expect, it } from 'vitest';
import { addScore, emptyScores, loadScores, saveScores, type StorageLike } from './scores';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe('Score-Migration v1 → v2', () => {
  it('übernimmt v1-Zeiten als Klassisch-Tabelle und persistiert v2', () => {
    const storage = memoryStorage({
      hormuz_scores: JSON.stringify({ easy: [42, 67], medium: [88], hard: [] }),
    });
    const scores = loadScores(storage);
    expect(scores.classic.easy).toEqual([42, 67]);
    expect(scores.classic.medium).toEqual([88]);
    expect(scores.patrol.easy).toEqual([]);
    // v2 wurde gespeichert, v1 bleibt unangetastet
    expect(storage.data.hormuz_scores_v2).toBeDefined();
    expect(storage.data.hormuz_scores).toBeDefined();
    const reloaded = loadScores(storage);
    expect(reloaded).toEqual(scores);
  });

  it('sortiert und kappt unsaubere v1-Daten auf Top 5', () => {
    const storage = memoryStorage({
      hormuz_scores: JSON.stringify({ easy: [99, 12, 'x', -5, 30, 44, 80, 7], medium: 'kaputt' }),
    });
    const scores = loadScores(storage);
    expect(scores.classic.easy).toEqual([7, 12, 30, 44, 80]);
    expect(scores.classic.medium).toEqual([]);
  });

  it('liefert leere Tabellen bei korruptem JSON', () => {
    const storage = memoryStorage({ hormuz_scores: '{nicht json' });
    expect(loadScores(storage)).toEqual(emptyScores());
  });

  it('liefert leere Tabellen ohne gespeicherte Daten', () => {
    expect(loadScores(memoryStorage())).toEqual(emptyScores());
  });
});

describe('addScore', () => {
  it('hält die Liste sortiert und auf Top 5 begrenzt, liefert den Rang', () => {
    const scores = emptyScores();
    expect(addScore(scores, 'classic', 'easy', 50)).toBe(0);
    expect(addScore(scores, 'classic', 'easy', 30)).toBe(0);
    expect(addScore(scores, 'classic', 'easy', 70)).toBe(2);
    addScore(scores, 'classic', 'easy', 60);
    addScore(scores, 'classic', 'easy', 40);
    expect(scores.classic.easy).toEqual([30, 40, 50, 60, 70]);
    expect(addScore(scores, 'classic', 'easy', 99)).toBeNull();
    expect(scores.classic.easy).toEqual([30, 40, 50, 60, 70]);
  });

  it('trennt Modi und Schwierigkeitsgrade', () => {
    const scores = emptyScores();
    addScore(scores, 'patrol', 'hard', 12);
    expect(scores.patrol.hard).toEqual([12]);
    expect(scores.classic.hard).toEqual([]);
  });

  it('Roundtrip über Storage', () => {
    const storage = memoryStorage();
    const scores = emptyScores();
    addScore(scores, 'classic', 'medium', 123);
    saveScores(storage, scores);
    expect(loadScores(storage).classic.medium).toEqual([123]);
  });
});
