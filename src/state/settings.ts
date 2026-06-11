import type { GameMode } from '../engine/types';

const KEY = 'hormuz_settings_v2';

export interface Settings {
  sound: boolean;
  day: boolean;
  /** Welche Erststart-Hints bereits gezeigt wurden. */
  hintSeen: Record<GameMode, boolean>;
}

const DEFAULTS: Settings = {
  sound: true,
  day: false,
  hintSeen: { classic: false, patrol: false },
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULTS.sound,
      day: typeof parsed.day === 'boolean' ? parsed.day : DEFAULTS.day,
      hintSeen: {
        classic: parsed.hintSeen?.classic === true,
        patrol: parsed.hintSeen?.patrol === true,
      },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage nicht verfügbar → Einstellungen gelten nur für die Sitzung
  }
}
