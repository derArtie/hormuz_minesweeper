export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'patrol';
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
export type Mark = 'none' | 'flag' | 'qmark';

export interface Cell {
  readonly r: number;
  readonly c: number;
}

export interface DifficultyConfig {
  readonly mines: number;
  readonly label: string;
  readonly color: string;
  /** Leben im Patrouille-Modus */
  readonly lives: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { mines: 45, label: 'Leicht', color: '#4ade80', lives: 3 },
  medium: { mines: 99, label: 'Mittel', color: '#fbbf24', lives: 2 },
  hard: { mines: 150, label: 'Schwer', color: '#f87171', lives: 1 },
};

export const DIFFICULTY_ORDER: readonly Difficulty[] = ['easy', 'medium', 'hard'];
