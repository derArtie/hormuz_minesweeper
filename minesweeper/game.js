(function () {
  const VERSION = '1.1.1';

  const COLS = 60, ROWS = 40, CELL = 12;
  const DIFFS = {
    easy:   { mines: 45,  label: 'Leicht', color: '#44bb66', lives: 2 },
    medium: { mines: 99,  label: 'Mittel', color: '#e8c040', lives: 4 },
    hard:   { mines: 150, label: 'Schwer', color: '#ee4444', lives: 6 },
  };
  let currentDiff = 'easy', dayMode = false, cursorMode = 'default', gameMode = 'classic';

  // ── Konfigurationskonstanten ────────────────────────────
  const LONG_PRESS_MS    = 500;
  const ZOOM_FACTOR      = 1.15;
  const ZOOM_MIN         = 1;
  const ZOOM_MAX         = 5;
  const WAVE_STEP        = 0.04;
  const OVERLAY_DELAY_MS = 900;

  // 1 = Land, 0 = Wasser/Spielfeld
  const RAW = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  // 1 = spielbare Wasserzelle
  const PLAY = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
  ];

  const L = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => RAW[r * COLS + c] === 1));
  const P = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => PLAY[r * COLS + c] === 1));
  const waterCells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (P[r][c]) waterCells.push({ r, c });

  const PATROL_LEFT_COL  = waterCells.reduce((m, w) => Math.min(m, w.c), COLS) + 4;
  const PATROL_RIGHT_COL = waterCells.reduce((m, w) => Math.max(m, w.c), 0)   - 4;

  const SCORES_KEY = 'hormuz_scores';

  function loadScores() {
    try {
      const saved = localStorage.getItem(SCORES_KEY);
      return saved ? JSON.parse(saved) : { easy: [], medium: [], hard: [] };
    } catch {
      return { easy: [], medium: [], hard: [] };
    }
  }

  function persistScores() {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  }

  const scores = loadScores();

  // ── Hilfsfunktionen ─────────────────────────────────────
  function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

  function forEachNeighbor(r, c, cb) {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc)) cb(nr, nc);
      }
  }

  function updateMineDisplay() {
    if (gameMode === 'patrol') {
      document.getElementById('mc').textContent = String(lives).padStart(3, '0');
      return;
    }
    document.getElementById('mc').textContent = String(mineCount - flagCount()).padStart(3, '0');
  }

  function toggleFlag(r, c) {
    if (!inBounds(r, c) || !P[r][c] || revealed[r][c]) return;
    if (!flagged[r][c] && !qmark[r][c])     flagged[r][c] = true;
    else if (flagged[r][c]) { flagged[r][c] = false; qmark[r][c] = true; }
    else                      qmark[r][c] = false;
    updateMineDisplay();
  }

  function tryPatrolMove(dr, dc) {
    if (gs !== 'idle' && gs !== 'playing') return;
    const nr = playerPos.r + dr, nc = playerPos.c + dc;
    if (!inBounds(nr, nc) || !P[nr][nc]) return;

    if (gs === 'idle') {
      gs = 'playing';
      ti = setInterval(() => {
        tv = Math.min(999, tv + 1);
        document.getElementById('tm').textContent = String(tv).padStart(3, '0');
      }, 1000);
    }

    if (revealed[nr][nc]) {
      if (board[nr][nc] === -1) return;
      playerPos = { r: nr, c: nc };
      if (patrolDir === 1 ? nc >= patrolEndCol : nc <= patrolEndCol) handleWon();
      return;
    }

    if (board[nr][nc] === -1) {
      revealed[nr][nc] = true;
      spawnExplosion(nr, nc);
      lives--;
      updateMineDisplay();
      if (lives <= 0) handleLost();
      return;
    }

    revealed[nr][nc] = true;
    playerPos = { r: nr, c: nc };
    if (patrolDir === 1 ? nc >= patrolEndCol : nc <= patrolEndCol) handleWon();
  }

  function saveScore(d, t) {
    scores[d].push(t);
    scores[d].sort((a, b) => a - b);
    if (scores[d].length > 5) scores[d] = scores[d].slice(0, 5);
    persistScores();
    renderScores();
  }

  function renderScores() {
    const list = document.getElementById('hs-list');
    list.innerHTML = '';
    ['easy', 'medium', 'hard'].forEach(d => {
      const cfg = DIFFS[d], en = scores[d];
      const card = document.createElement('div');
      card.className = 'hs-entry';
      const label = `<div class="hs-entry-label ${d}-color">${cfg.label}</div>`;
      if (!en.length) {
        card.innerHTML = label + `<div class="hs-entry-time hs-entry-empty">—</div>`;
      } else {
        const times = en.slice(0, 5).map((t, i) =>
          `<div class="hs-entry-time${i === 0 ? ' hs-entry-best' : ' hs-entry-rest'}">${t}s</div>`
        ).join('');
        card.innerHTML = label + times;
      }
      list.appendChild(card);
    });
  }
  renderScores();
  document.getElementById('ver').textContent = `v${VERSION}`;

  // ── Changelog ──────────────────────────────────────────
  function renderChangelog(entries) {
    const body = document.getElementById('cl-body');
    body.innerHTML = entries.map((entry, i) => `
      <div>
        <div class="cl-version">
          <span class="cl-ver-tag ${i === 0 ? 'latest' : 'old'}">${entry.version}</span>
          <span class="cl-ver-date">${entry.date}</span>
        </div>
        <ul class="cl-items">
          ${entry.items.map(it => `<li>${it}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }

  fetch('changelog.json')
    .then(r => r.json())
    .then(entries => renderChangelog(entries))
    .catch(() => {
      document.getElementById('cl-body').textContent = 'Changelog konnte nicht geladen werden.';
    });

  const clModal = document.getElementById('cl-modal');
  document.getElementById('cl-btn').addEventListener('click', () => clModal.classList.toggle('open'));
  document.getElementById('cl-close').addEventListener('click', () => clModal.classList.remove('open'));
  clModal.addEventListener('click', e => { if (e.target === clModal) clModal.classList.remove('open'); });

  const canvas = document.getElementById('gc');
  const ctx = canvas.getContext('2d');
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;

  let waveT = 0, particles = [], mouseCell = { r: -1, c: -1 };
  let lastRenderTs = 0;
  let mouseCanvasX = -99, mouseCanvasY = -99;
  let vScale = 1, vPanX = 0, vPanY = 0;
  let board, revealed, flagged, qmark, gs, tv, ti, fc, mineCount;
  let playerPos = null, lives = 0, patrolDir = 1, patrolStartCol = 0, patrolEndCol = 0, patrolZoomAnim = null;
  let patrolSafePath = null, _dbg_sm = false, _dbg_sp = false;

  const INSTRUCTIONS = {
    classic: {
      Desktop: [['Left-Click','Scan Sector'],['Right-Click','Place Flag'],['Chord','Click Number'],['Scroll','Zoom In/Out'],['Middle Click','Pan Map']],
      Mobile:  [['Tap','Scan Sector'],['Long Press','Place Flag'],['Pinch','Zoom In/Out'],['Drag (zoomed)','Pan Map']],
    },
    patrol: {
      Desktop: [['W / A / S / D','Move Ship'],['Arrow Keys','Move Ship'],['Scroll','Zoom In/Out'],['Middle Click','Pan Map']],
      Mobile:  [['D-Pad','Move Ship'],['Pinch','Zoom In/Out'],['Drag (zoomed)','Pan Map']],
    },
  };

  function updateInstructions() {
    const groups = INSTRUCTIONS[gameMode];
    document.getElementById('st-body').innerHTML = Object.entries(groups).map(([label, rows]) =>
      `<div class="inst-group"><div class="inst-group-label">${label}</div><ul class="inst-list">${
        rows.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('')
      }</ul></div>`
    ).join('');
  }

  function init() {
    mineCount = DIFFS[currentDiff].mines;
    board    = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    revealed = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    flagged  = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    qmark    = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    gs = 'idle'; tv = 0; fc = true; particles = [];
    vScale = 1; vPanX = 0; vPanY = 0;
    playerPos = null;
    patrolZoomAnim = null;
    clearInterval(ti);
    document.getElementById('tm').textContent = '000';
    if (gameMode === 'patrol') {
      patrolDir = Math.random() < 0.5 ? 1 : -1;
      patrolStartCol = patrolDir === 1 ? PATROL_LEFT_COL : PATROL_RIGHT_COL;
      patrolEndCol   = patrolDir === 1 ? PATROL_RIGHT_COL : PATROL_LEFT_COL;
      const startCells = waterCells.filter(w => patrolDir === 1 ? w.c <= patrolStartCol : w.c >= patrolStartCol);
      const sc = startCells[Math.floor(Math.random() * startCells.length)];
      fc = false;
      let _path = null, _att = 0;
      while (!_path && _att++ < 100) {
        if (_att > 1) for (let _r = 0; _r < ROWS; _r++) board[_r].fill(0);
        placeMines(sc.r, sc.c);
        _path = findPatrolPath(sc.r, sc.c);
      }
      patrolSafePath = _path;
      _dbg_sm = false; _dbg_sp = false;
      playerPos = { r: sc.r, c: sc.c };
      revealed[sc.r][sc.c] = true;
      const W = canvas.width, H = canvas.height, toScale = 3;
      const cx = sc.c * CELL + CELL / 2, cy = sc.r * CELL + CELL / 2;
      patrolZoomAnim = {
        start: performance.now(), duration: 1800, toScale,
        toPanX: Math.max(W * (1 - toScale), Math.min(0, W / 2 - cx * toScale)),
        toPanY: Math.max(H * (1 - toScale), Math.min(0, H / 2 - cy * toScale)),
      };
      lives = DIFFS[currentDiff].lives;
      document.getElementById('mc-label').textContent = 'Lives';
      document.getElementById('mc').textContent = String(lives).padStart(3, '0');
    } else {
      lives = 0;
      document.getElementById('mc-label').textContent = 'Mines Detected';
      document.getElementById('mc').textContent = String(mineCount).padStart(3, '0');
    }
    document.getElementById('sb').textContent = '🙂';
    document.getElementById('dpad').classList.toggle('show', gameMode === 'patrol');
    updateInstructions();
    document.getElementById('ov').classList.remove('show');
    const mi = document.getElementById('meme-img');
    mi.classList.remove('loaded'); mi.src = '';
    const mv = document.getElementById('meme-vid');
    mv.classList.remove('loaded'); mv.pause(); mv.src = '';
    document.getElementById('meme-cap').textContent = '';
    _upd();
  }

  function clampView() {
    const W = canvas.width, H = canvas.height;
    vPanX = Math.max(W * (1 - vScale), Math.min(0, vPanX));
    vPanY = Math.max(H * (1 - vScale), Math.min(0, vPanY));
  }

  function placeMines(er, ec) {
    const excl = new Set();
    forEachNeighbor(er, ec, (nr, nc) => excl.add(nr * COLS + nc));
    const pool = waterCells.filter(({ r, c }) => !excl.has(r * COLS + c));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const n = Math.min(mineCount, pool.length);
    for (let i = 0; i < n; i++) board[pool[i].r][pool[i].c] = -1;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] === -1) continue;
        let cnt = 0;
        forEachNeighbor(r, c, (nr, nc) => { if (board[nr][nc] === -1) cnt++; });
        board[r][c] = cnt;
      }
  }

  // BFS: kürzesten Weg vom Start zur Zielzone finden (nur minenfreie Wasserzellen)
  function findPatrolPath(sr, sc) {
    const vis = Array.from({ length: ROWS }, () => new Uint8Array(COLS));
    const par = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
    const q = [{ r: sr, c: sc }];
    vis[sr][sc] = 1;
    let goal = null;
    outer: while (q.length) {
      const { r, c } = q.shift();
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (!inBounds(nr, nc) || !P[nr][nc] || board[nr][nc] === -1 || vis[nr][nc]) continue;
        vis[nr][nc] = 1; par[nr][nc] = { r, c };
        if (patrolDir === 1 ? nc >= patrolEndCol : nc <= patrolEndCol) { goal = { r: nr, c: nc }; break outer; }
        q.push({ r: nr, c: nc });
      }
    }
    if (!goal) return null;
    const path = []; let cur = goal;
    while (cur) { path.push(cur); cur = par[cur.r][cur.c]; }
    return path.reverse();
  }

  function reveal(r, c) {
    if (!inBounds(r, c) || revealed[r][c] || flagged[r][c] || qmark[r][c] || !P[r][c]) return;
    revealed[r][c] = true;
    if (board[r][c] === 0) forEachNeighbor(r, c, reveal);
  }

  function chordReveal(r, c) {
    if (!revealed[r][c] || board[r][c] <= 0) return;
    let f = 0;
    forEachNeighbor(r, c, (nr, nc) => { if (flagged[nr][nc]) f++; });
    if (f !== board[r][c]) return;
    forEachNeighbor(r, c, (nr, nc) => { if (!flagged[nr][nc] && !revealed[nr][nc]) reveal(nr, nc); });
  }

  function flagCount() {
    let f = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (flagged[r][c]) f++;
    return f;
  }

  function checkWin() {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (P[r][c] && board[r][c] !== -1 && !revealed[r][c]) return false;
    return true;
  }

  function spawnExplosion(r, c) {
    const cx = (c + .5) * CELL, cy = (r + .5) * CELL;
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3.5;
      particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .018 + Math.random() * .02, size: 2 + Math.random() * 4, color: Math.random() < .5 ? '#ff6600' : '#ffcc00', type: 'ember' });
    }
    particles.push({ x: cx, y: cy, vx: 0, vy: 0, life: 1, decay: .04, size: 0, color: 'ring', type: 'ring', maxR: CELL * 2.5 });
  }

  function col() {
    return dayMode
      ? { landA: '#c8a46e', landB: '#b8945e', waterA: '#4a9ad8', waterB: '#3a8ac8', isoA: '#2a7ab0', isoB: '#1a6aa0', rev: '#7ac0e8', mineHit: '#e84040' }
      : { landA: '#8a7052', landB: '#7a6042', waterA: '#0d5a96', waterB: '#0a4f88', isoA: '#0a4070', isoB: '#083860', rev: '#3278a0', mineHit: '#7a1010' };
  }

  const NC_N = ['', '#5aabff', '#44cc66', '#ff5555', '#aaaaff', '#ffaaaa', '#55dddd', '#eee', '#aaa'];
  const NC_D = ['', '#1565c0', '#2e7d32', '#c62828', '#283593', '#880e4f', '#00695c', '#333', '#444'];

  function drawSeamine(x, y, sz, exp) {
    const cx = x + sz / 2, cy = y + sz / 2, r = sz * .31;
    const g = ctx.createRadialGradient(cx - r * .3, cy - r * .3, 0, cx, cy, r);
    if (exp) { g.addColorStop(0, '#ff8844'); g.addColorStop(1, '#aa2200'); }
    else { g.addColorStop(0, '#666'); g.addColorStop(1, '#1a1a1a'); }
    ctx.save();
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = exp ? '#cc3300' : '#2a2a2a'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r, ex = cx + Math.cos(a) * (r + sz * .17), ey = cy + Math.sin(a) * (r + sz * .17);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = exp ? '#ff6622' : '#111'; ctx.beginPath(); ctx.arc(ex, ey, 1.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(cx - r * .25, cy - r * .3, r * .2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFlag(x, y, sz) {
    ctx.save();
    const px = x + sz * .35, py = y + sz * .1, ph = sz * .78;
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + ph); ctx.stroke();
    ctx.fillStyle = '#dd1111'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + sz * .38, py + sz * .2); ctx.lineTo(px, py + sz * .4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px, py + sz * .04); ctx.lineTo(px + sz * .26, py + sz * .2); ctx.lineTo(px, py + sz * .17); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px - sz * .14, py + ph); ctx.lineTo(px + sz * .14, py + ph); ctx.stroke();
    ctx.restore();
  }

  function drawQuestion(x, y, sz) {
    ctx.save();
    ctx.fillStyle = '#f0c040'; ctx.font = `bold ${sz - 2}px 'Courier New'`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', x + sz / 2, y + sz / 2 + 1);
    ctx.restore();
  }

  function showShip() {
    const { r, c } = mouseCell;
    return r >= 0 && r < ROWS && c >= 0 && c < COLS && P[r][c] && !revealed[r][c];
  }

  function drawLabel(t, color, s, gx, gy) {
    const px = gx * CELL, py = gy * CELL;
    ctx.font = `bold ${s}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(t, px + 1, py + 1);
    ctx.fillStyle = color; ctx.fillText(t, px, py);
  }

  function drawFrame(ts = 0) {
    requestAnimationFrame(drawFrame);
    if (patrolZoomAnim) {
      const t = Math.min(1, (ts - patrolZoomAnim.start) / patrolZoomAnim.duration);
      const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
      vScale = 1 + (patrolZoomAnim.toScale - 1) * e;
      vPanX  = patrolZoomAnim.toPanX * e;
      vPanY  = patrolZoomAnim.toPanY * e;
      if (t >= 1) patrolZoomAnim = null;
    }

    const overlayUp = (gs === 'won' || gs === 'lost') && particles.length === 0;
    const interval = overlayUp ? 200 : patrolZoomAnim ? 0 : 33;
    if (ts - lastRenderTs < interval) return;
    lastRenderTs = ts;

    if (gameMode === 'patrol' && playerPos && !patrolZoomAnim && vScale > 1) {
      const W = canvas.width, H = canvas.height;
      const tx = Math.max(W * (1 - vScale), Math.min(0, W / 2 - (playerPos.c * CELL + CELL / 2) * vScale));
      const ty = Math.max(H * (1 - vScale), Math.min(0, H / 2 - (playerPos.r * CELL + CELL / 2) * vScale));
      vPanX += (tx - vPanX) * 0.15;
      vPanY += (ty - vPanY) * 0.15;
    }

    const C = col(), NC = dayMode ? NC_D : NC_N;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(vPanX, vPanY);
    ctx.scale(vScale, vScale);

    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = c * CELL, y = r * CELL, isL = L[r][c], isP = P[r][c], isR = revealed[r][c], isIso = !isL && !isP;
      if (isL) {
        ctx.fillStyle = (r + c) % 2 === 0 ? C.landA : C.landB; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x, y, CELL, 2); ctx.fillRect(x, y, 2, CELL);
        ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(x, y + CELL - 2, CELL, 2); ctx.fillRect(x + CELL - 2, y, 2, CELL);
      } else if (isIso) {
        const wave = Math.sin(waveT * .8 + (r + c) * .5) * .04;
        ctx.fillStyle = (r + c) % 2 === 0 ? C.isoA : C.isoB; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = `rgba(255,255,255,${.04 + wave})`; ctx.fillRect(x, y, CELL, CELL);
      } else if (!isR) {
        const wave = Math.sin(waveT + (r * .7 + c * .4)) * .06 + Math.sin(waveT * 1.3 + (c * .6 - r * .3)) * .04;
        ctx.fillStyle = (r + c) % 2 === 0 ? C.waterA : C.waterB; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, wave + .05)})`; ctx.fillRect(x, y, CELL, CELL);
        if (flagged[r][c]) drawFlag(x, y, CELL);
        else if (qmark[r][c]) drawQuestion(x, y, CELL);
      } else {
        if (board[r][c] === -1) {
          ctx.fillStyle = C.mineHit; ctx.fillRect(x, y, CELL, CELL);
          drawSeamine(x, y, CELL, true);
        } else {
          ctx.fillStyle = C.rev; ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeStyle = 'rgba(0,40,70,0.15)'; ctx.lineWidth = 0.3; ctx.strokeRect(x, y, CELL, CELL);
          if (board[r][c] > 0) {
            ctx.fillStyle = NC[board[r][c]];
            ctx.font = `bold ${CELL - 3}px 'Courier New'`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(board[r][c], x + CELL / 2, y + CELL / 2 + 1);
          }
        }
      }
    }

    const lc = dayMode ? 'rgba(50,28,4,0.95)'  : 'rgba(245,215,160,0.95)';
    const wc = dayMode ? 'rgba(8,35,90,0.92)'   : 'rgba(160,220,255,0.92)';
    drawLabel('Iran',            lc, 11,  30,  5);
    drawLabel('Saudi-Arabien',   lc,  9,   2, 26);
    drawLabel('Katar',           lc,  9,   9, 25);
    drawLabel('VAE',             lc, 10,  24, 34);
    drawLabel('Oman',            lc, 10,  38, 37);
    drawLabel('Persischer Golf', wc,  9,  13, 22);
    drawLabel('Str. v. Hormuz',  wc,  8,  35, 20);
    drawLabel('Golf von Oman',   wc,  9,  50, 27);

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      if (p.type === 'ring') {
        const rad = p.maxR * (1 - p.life);
        ctx.save(); ctx.strokeStyle = `rgba(255,180,60,${p.life * .8})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      } else {
        ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.97;
      }
      p.life -= p.decay;
    });

    const { r: cr, c: cc } = mouseCell;
    if (inBounds(cr, cc) && revealed[cr] && revealed[cr][cc] && board[cr] && board[cr][cc] > 0) {
      let f = 0;
      forEachNeighbor(cr, cc, (nr, nc) => { if (flagged[nr][nc]) f++; });
      if (f === board[cr][cc]) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,220,50,0.8)'; ctx.lineWidth = 1.5;
        ctx.strokeRect(cc * CELL + 1, cr * CELL + 1, CELL - 2, CELL - 2); ctx.restore();
      }
    }

    // ── Patrol-Overlays ──────────────────────────────────────────────────────
    if (gameMode === 'patrol') {
      if (_dbg_sm) {
        ctx.save(); ctx.fillStyle = 'rgba(255,60,60,0.38)';
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
          if (P[r][c] && board[r][c] === -1) ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.restore();
      }
      if (_dbg_sp && patrolSafePath) {
        ctx.save(); ctx.fillStyle = 'rgba(80,255,130,0.32)';
        for (const { r, c } of patrolSafePath)
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        ctx.restore();
      }
      // Zielzone: goldene Umrandung der rechten Wasserzellen
      for (const { r: pr, c: pc } of waterCells) {
        if (patrolDir === 1 ? pc >= patrolEndCol : pc <= patrolEndCol) {
          ctx.save(); ctx.strokeStyle = 'rgba(255,200,40,0.65)'; ctx.lineWidth = 1.5;
          ctx.strokeRect(pc * CELL + 0.75, pr * CELL + 0.75, CELL - 1.5, CELL - 1.5); ctx.restore();
        }
      }
      // Spieler-Marker
      if (playerPos) {
        const px = playerPos.c * CELL, py = playerPos.r * CELL;
        ctx.save();
        ctx.font = `${CELL - 1}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🚢', px + CELL / 2, py + CELL / 2 + 1);
        const pv = board[playerPos.r][playerPos.c];
        if (pv > 0) {
          const r = CELL * 0.38, cx = px + CELL / 2, cy = py + CELL / 2;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(20,20,20,0.82)'; ctx.fill();
          ctx.font = `bold ${CELL - 5}px 'Courier New'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = ['', '#5aabff','#44cc66','#ff5555','#aaaaff','#ffaaaa','#55dddd','#eee','#aaa'][pv];
          ctx.fillText(pv, cx, cy + 0.5);
        }
        ctx.restore();
      }
    }

    ctx.restore(); // end pan/zoom transform

    // Cursor außerhalb des Transforms in Canvas-Pixelkoordinaten zeichnen
    if (mmPanning) {
      canvas.style.cursor = 'grabbing';
    } else if (cursorMode === 'ship' && showShip()) {
      canvas.style.cursor = 'none';
      ctx.font = `18px serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('🚢', mouseCanvasX - 2, mouseCanvasY - 2);
    } else {
      canvas.style.cursor = cursorMode === 'crosshair' ? 'crosshair' : 'default';
    }

    waveT += WAVE_STEP;
  }

  function getCell(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * sx;
    const cy = (e.clientY - rect.top)  * sy;
    const gx = (cx - vPanX) / vScale;
    const gy = (cy - vPanY) / vScale;
    return {
      c: Math.floor(gx / CELL),
      r: Math.floor(gy / CELL),
      cx, cy,
    };
  }

  let touchActive = false, touchActiveTimer = null;
  let mmPanning = false, mmLastX = 0, mmLastY = 0;

  canvas.addEventListener('mousedown', e => {
    if (e.button === 1) { e.preventDefault(); mmPanning = true; mmLastX = e.clientX; mmLastY = e.clientY; }
  });
  document.addEventListener('mouseup', e => {
    if (e.button === 1) mmPanning = false;
  });

  canvas.addEventListener('mousemove', e => {
    if (touchActive) return;
    if (mmPanning) {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
      vPanX += (e.clientX - mmLastX) * sx;
      vPanY += (e.clientY - mmLastY) * sy;
      mmLastX = e.clientX; mmLastY = e.clientY;
      clampView();
    }
    const { r, c, cx, cy } = getCell(e);
    mouseCanvasX = cx; mouseCanvasY = cy; mouseCell = { r, c };
  });
  canvas.addEventListener('mouseleave', () => {
    mouseCell = { r: -1, c: -1 };
    mouseCanvasX = -99; mouseCanvasY = -99;
    canvas.style.cursor = 'default';
  });

  // ── Wheel Zoom ──────────────────────────────────────────
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * sx;
    const cy = (e.clientY - rect.top)  * sy;
    const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, vScale * factor));
    vPanX = cx - (cx - vPanX) * (newScale / vScale);
    vPanY = cy - (cy - vPanY) * (newScale / vScale);
    vScale = newScale;
    clampView();
  }, { passive: false });

  // ── Touch Pan & Pinch Zoom ──────────────────────────────
  let touchState = null, touchPanned = false;

  function getTouchDist(a, b) {
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  }

  canvas.addEventListener('touchstart', e => {
    touchActive = true;
    clearTimeout(touchActiveTimer);
    mouseCell = { r: -1, c: -1 }; mouseCanvasX = -99; mouseCanvasY = -99;
    if (e.touches.length === 2) {
      e.preventDefault();
      if (touchState) clearTimeout(touchState.longPress);
      touchState = {
        type: 'pinch',
        dist: getTouchDist(e.touches[0], e.touches[1]),
        cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        cy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchState = { type: 'pan', x: t.clientX, y: t.clientY,
        startX: t.clientX, startY: t.clientY, moved: false };
      // Langer Druck → Flagge setzen (Rechtsklick-Ersatz)
      touchState.longPress = setTimeout(() => {
        if (touchState && !touchState.moved) {
          touchPanned = true;
          const synth = { clientX: touchState.startX, clientY: touchState.startY };
          const { r, c } = getCell(synth);
          if (!(gs === 'won' || gs === 'lost')) {
            toggleFlag(r, c);
          }
          touchState = null;
        }
      }, LONG_PRESS_MS);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!touchState) return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    if (touchState.type === 'pinch' && e.touches.length === 2) {
      const newDist = getTouchDist(e.touches[0], e.touches[1]);
      const newCx   = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const newCy   = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const factor   = newDist / touchState.dist;
      const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, vScale * factor));
      const pivotX   = (newCx - rect.left) * sx;
      const pivotY   = (newCy - rect.top)  * sy;
      vPanX = pivotX - (pivotX - vPanX) * (newScale / vScale) + (newCx - touchState.cx) * sx;
      vPanY = pivotY - (pivotY - vPanY) * (newScale / vScale) + (newCy - touchState.cy) * sy;
      vScale = newScale;
      clampView();
      touchState.dist = newDist; touchState.cx = newCx; touchState.cy = newCy;
    } else if (touchState.type === 'pan' && e.touches.length === 1 && vScale > 1) {
      const dx = (e.touches[0].clientX - touchState.x) * sx;
      const dy = (e.touches[0].clientY - touchState.y) * sy;
      if (Math.hypot(e.touches[0].clientX - touchState.startX, e.touches[0].clientY - touchState.startY) > 8) {
        touchState.moved = true; touchPanned = true;
      }
      vPanX += dx; vPanY += dy; clampView();
      touchState.x = e.touches[0].clientX; touchState.y = e.touches[0].clientY;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    if (touchState) clearTimeout(touchState.longPress);
    if (e.touches.length === 0) touchState = null;
    touchActiveTimer = setTimeout(() => { touchActive = false; }, 500);
  }, { passive: false });

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function pickNoDupe(arr, lastRef) {
    if (arr.length === 1) return arr[0];
    let choice;
    do { choice = pick(arr); } while (choice === lastRef.val);
    lastRef.val = choice;
    return choice;
  }

  const _lastCap  = { won: { val: null }, lost: { val: null } };
  const _lastMeme = { won: { val: null }, lost: { val: null } };
  let _memesData  = null;

  fetch('memes.json')
    .then(r => r.json())
    .then(data => { _memesData = data; })
    .catch(() => {});

  function showMeme(type) {
    const img = document.getElementById('meme-img');
    const vid = document.getElementById('meme-vid');
    const cap = document.getElementById('meme-cap');

    img.classList.remove('loaded');
    vid.classList.remove('loaded');
    vid.pause();

    if (!_memesData) return;

    cap.textContent = pickNoDupe(_memesData.captions[type], _lastCap[type]);

    const src = pickNoDupe(_memesData.files[type], _lastMeme[type]);
    if (src.endsWith('.mp4')) {
      vid.src = src;
      vid.classList.add('loaded');
      vid.play();
    } else {
      img.onload = () => img.classList.add('loaded');
      img.onerror = () => {};
      img.src = src;
    }
  }

  function handleLost() {
    gs = 'lost'; clearInterval(ti);
    if (gameMode === 'classic') {
      for (let mr = 0; mr < ROWS; mr++) for (let mc = 0; mc < COLS; mc++) if (board[mr][mc] === -1) revealed[mr][mc] = true;
    }
    document.getElementById('sb').textContent = '😵';
    const ot = document.getElementById('ot');
    ot.textContent = gameMode === 'patrol' ? 'VERSUNKEN! 🌊' : 'BOOM! 💥';
    ot.style.color = '#ff5544';
    showMeme('lost');
    setTimeout(() => document.getElementById('ov').classList.add('show'), OVERLAY_DELAY_MS);
  }

  function handleWon() {
    gs = 'won'; clearInterval(ti); saveScore(currentDiff, tv);
    document.getElementById('sb').textContent = '😎';
    const ot = document.getElementById('ot');
    ot.textContent = gameMode === 'patrol' ? `DURCHGEBROCHEN! 🚢 ${tv}s` : `GEWONNEN! 🎉 ${tv}s`;
    ot.style.color = DIFFS[currentDiff].color;
    showMeme('won');
    document.getElementById('ov').classList.add('show');
  }

  canvas.addEventListener('click', e => {
    if (touchPanned) { touchPanned = false; return; }
    e.preventDefault();
    if (gs === 'won' || gs === 'lost') { init(); return; }
    const { r, c } = getCell(e);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (gameMode === 'patrol') return;
    if (P[r][c] && revealed[r][c] && board[r] && board[r][c] > 0 && gs === 'playing') {
      chordReveal(r, c);
      let hit = false;
      for (let mr = 0; mr < ROWS; mr++)
        for (let mc = 0; mc < COLS; mc++)
          if (revealed[mr][mc] && board[mr][mc] === -1) { hit = true; spawnExplosion(mr, mc); }
      if (hit) { handleLost(); return; }
      if (checkWin()) handleWon();
      return;
    }
    if (!P[r][c] || flagged[r][c] || qmark[r][c] || revealed[r][c]) return;
    if (fc) {
      fc = false; gs = 'playing'; placeMines(r, c);
      ti = setInterval(() => { tv = Math.min(999, tv + 1); document.getElementById('tm').textContent = String(tv).padStart(3, '0'); }, 1000);
    }
    if (board[r][c] === -1) { revealed[r][c] = true; spawnExplosion(r, c); handleLost(); }
    else { reveal(r, c); if (checkWin()) handleWon(); }
  });

  document.getElementById('gw').addEventListener('selectstart', e => e.preventDefault());

  document.addEventListener('keydown', e => {
    if (gameMode !== 'patrol') return;
    if (gs === 'won' || gs === 'lost') return;
    const dirs = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
    const dir = dirs[e.key] ?? (e.key === 'w' || e.key === 'W' ? [-1,0] : e.key === 's' || e.key === 'S' ? [1,0] : e.key === 'a' || e.key === 'A' ? [0,-1] : e.key === 'd' || e.key === 'D' ? [0,1] : null);
    if (!dir) return;
    e.preventDefault();
    tryPatrolMove(dir[0], dir[1]);
  });

  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (gameMode === 'patrol') return;
    if (gs === 'won' || gs === 'lost') return;
    const { r, c } = getCell(e);
    toggleFlag(r, c);
  });

  document.getElementById('ov').addEventListener('click', init);
  document.getElementById('sb').addEventListener('click', init);
  document.getElementById('dn-btn').addEventListener('click', () => {
    dayMode = !dayMode;
    document.getElementById('gw').classList.toggle('day', dayMode);
    document.getElementById('dn-btn').textContent = dayMode ? '🌙' : '☀️';
  });
  document.querySelectorAll('.dbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentDiff = btn.dataset.d;
      document.querySelectorAll('.dbtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      init();
    });
  });
  document.querySelectorAll('.mbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      gameMode = btn.dataset.m;
      document.querySelectorAll('.mbtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      init();
    });
  });

  let dpadTimer = null;
  document.querySelectorAll('.dp').forEach(btn => {
    const move = () => tryPatrolMove(+btn.dataset.dr, +btn.dataset.dc);
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      move();
      dpadTimer = setInterval(move, 180);
    }, { passive: false });
    btn.addEventListener('touchend',   () => { clearInterval(dpadTimer); dpadTimer = null; });
    btn.addEventListener('touchcancel',() => { clearInterval(dpadTimer); dpadTimer = null; });
  });

  document.getElementById('cur-btn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('cur-panel').classList.toggle('open');
  });
  document.querySelectorAll('.cur-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      cursorMode = btn.dataset.cur;
      document.querySelectorAll('.cur-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('cur-panel').classList.remove('open');
    });
  });
  document.addEventListener('click', () => {
    document.getElementById('cur-panel').classList.remove('open');
  });

  window.addEventListener('resize', () => { /* canvas CSS width:100% handles scaling */ });
  init();
  drawFrame();

  function _ep() {
    if (gs === 'idle' || gs === 'won' || gs === 'lost') {
      init();
      const seed = waterCells[Math.floor(waterCells.length / 2)];
      fc = false; gs = 'playing';
      placeMines(seed.r, seed.c);
      ti = setInterval(() => {
        tv = Math.min(999, tv + 1);
        document.getElementById('tm').textContent = String(tv).padStart(3, '0');
      }, 1000);
    }
  }

  function _upd() {
    const _el = document.getElementById('_p');
    if (!_el) return;
    const _ip = gameMode === 'patrol';
    const _acts = {
      sm: () => { _dbg_sm = !_dbg_sm; _upd(); },
      sp: () => { _dbg_sp = !_dbg_sp; _upd(); },
      w:  () => { _ep(); for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (P[r][c] && board[r][c] !== -1) revealed[r][c] = true; handleWon(); },
      l:  () => { _ep(); const m = waterCells.find(({ r, c }) => board[r][c] === -1); if (m) { revealed[m.r][m.c] = true; spawnExplosion(m.r, m.c); handleLost(); } },
      s:  () => { scores.easy = [42, 67, 91, 110, 134]; scores.medium = [88, 105, 143]; scores.hard = [201, 256]; persistScores(); renderScores(); },
      x:  () => { scores.easy = []; scores.medium = []; scores.hard = []; persistScores(); renderScores(); },
      i:  () => init(),
    };
    const _defs = _ip
      ? [['sm', 'Minen ' + (_dbg_sm ? 'aus' : 'ein') + 'blenden'],
         ['sp', 'Weg ' + (_dbg_sp ? 'aus' : 'an') + 'zeigen'],
         ['s', 'Testscores laden'], ['x', 'Scores leeren'], ['i', 'Neu starten']]
      : [['w', 'Sofort gewinnen'], ['l', 'Sofort verlieren'],
         ['s', 'Testscores laden'], ['x', 'Scores leeren'], ['i', 'Neu starten']];
    _el.innerHTML = `<div style="font-weight:600;margin-bottom:6px;color:#facc15">\u{1F527} Dev-Panel</div>` +
      _defs.map(([a, t]) => `<button data-a="${a}">${t}</button>`).join('');
    _el.querySelectorAll('button').forEach(btn => {
      Object.assign(btn.style, {
        display: 'block', width: '100%', textAlign: 'left', background: 'transparent',
        border: 'none', color: '#94a3b8', fontFamily: 'Inter, sans-serif',
        fontSize: '12px', padding: '2px 0', cursor: 'pointer', lineHeight: '1.8',
      });
      btn.addEventListener('mouseover', () => { btn.style.color = '#e2e8f0'; });
      btn.addEventListener('mouseout',  () => { btn.style.color = '#94a3b8'; });
      btn.addEventListener('click', () => { _acts[btn.dataset.a]?.(); });
    });
  }

  (() => {
    const _loc = location.hostname;
    if (_loc !== '' && _loc !== 'localhost' && _loc !== '127.0.0.1') return;
    let _n = 0, _t;
    document.getElementById('ver').addEventListener('click', () => {
      clearTimeout(_t);
      _t = setTimeout(() => { _n = 0; }, 600);
      if (++_n < 3) return;
      _n = 0;

      if (document.getElementById('_p')) return;

      const p = document.createElement('div');
      p.id = '_p';
      Object.assign(p.style, {
        position: 'fixed', bottom: '16px', right: '16px', zIndex: '9999',
        background: 'rgba(15,23,42,0.95)', border: '1px solid #334155',
        borderRadius: '8px', padding: '12px 16px', fontSize: '12px',
        color: '#94a3b8', fontFamily: 'Inter, sans-serif', lineHeight: '1.8',
        backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      });
      document.body.appendChild(p);
      _upd();
    });
  })();
})();
