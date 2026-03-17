(function () {
  const VERSION = '1.0.0';

  const COLS = 60, ROWS = 40, CELL = 12;
  const DIFFS = {
    easy:   { mines: 45,  label: 'Leicht', color: '#44bb66' },
    medium: { mines: 99,  label: 'Mittel', color: '#e8c040' },
    hard:   { mines: 150, label: 'Schwer', color: '#ee4444' },
  };
  let currentDiff = 'easy', dayMode = false;

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
      if (!en.length) {
        const el = document.createElement('div');
        el.className = 'hs-entry';
        el.innerHTML = `<span style="color:${cfg.color};font-size:10px">${cfg.label}</span><span style="color:#556">—</span>`;
        list.appendChild(el);
      } else {
        en.slice(0, 3).forEach((t, i) => {
          const el = document.createElement('div');
          el.className = 'hs-entry';
          el.innerHTML = `<span style="color:${i === 0 ? cfg.color : '#556'};font-size:10px">${i === 0 ? cfg.label : '·'}</span><span style="color:#e8d080">${t}s</span>`;
          list.appendChild(el);
        });
      }
    });
  }
  renderScores();
  document.getElementById('ver').textContent = `v${VERSION}`;

  const canvas = document.getElementById('gc');
  const ctx = canvas.getContext('2d');
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;

  let waveT = 0, particles = [], mouseX = -99, mouseY = -99, mouseCell = { r: -1, c: -1 };
  let board, revealed, flagged, qmark, gs, tv, ti, fc, mineCount;

  function init() {
    mineCount = DIFFS[currentDiff].mines;
    board    = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    revealed = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    flagged  = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    qmark    = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    gs = 'idle'; tv = 0; fc = true; particles = [];
    clearInterval(ti);
    document.getElementById('tm').textContent = '000';
    document.getElementById('mc').textContent = String(mineCount).padStart(3, '0');
    document.getElementById('sb').textContent = '🙂';
    document.getElementById('ov').classList.remove('show');
  }

  function placeMines(er, ec) {
    const excl = new Set();
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = er + dr, nc = ec + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) excl.add(nr * COLS + nc);
      }
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
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === -1) cnt++;
          }
        board[r][c] = cnt;
      }
  }

  function reveal(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || revealed[r][c] || flagged[r][c] || qmark[r][c] || !P[r][c]) return;
    revealed[r][c] = true;
    if (board[r][c] === 0)
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) reveal(r + dr, c + dc);
  }

  function chordReveal(r, c) {
    if (!revealed[r][c] || board[r][c] <= 0) return;
    let f = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && flagged[nr][nc]) f++;
      }
    if (f !== board[r][c]) return;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !flagged[nr][nc] && !revealed[nr][nc]) reveal(nr, nc);
      }
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

  function drawFrame() {
    const C = col(), NC = dayMode ? NC_D : NC_N;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = c * CELL, y = r * CELL, isL = L[r][c], isP = P[r][c], isR = revealed[r][c], isIso = !isL && !isP;
      if (isL) {
        ctx.fillStyle = (r + c) % 2 === 0 ? C.landA : C.landB; ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.3; ctx.strokeRect(x, y, CELL, CELL);
      } else if (isIso) {
        const wave = Math.sin(waveT * .8 + (r + c) * .5) * .04;
        ctx.fillStyle = (r + c) % 2 === 0 ? C.isoA : C.isoB; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = `rgba(255,255,255,${.04 + wave})`; ctx.fillRect(x, y, CELL, CELL);
      } else if (!isR) {
        const wave = Math.sin(waveT + (r * .7 + c * .4)) * .06 + Math.sin(waveT * 1.3 + (c * .6 - r * .3)) * .04;
        ctx.fillStyle = (r + c) % 2 === 0 ? C.waterA : C.waterB; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, wave + .05)})`; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x, y, CELL, 2); ctx.fillRect(x, y, 2, CELL);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x, y + CELL - 2, CELL, 2); ctx.fillRect(x + CELL - 2, y, 2, CELL);
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

    if (showShip()) {
      canvas.style.cursor = 'none';
      ctx.font = `${CELL + 4}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🚢', mouseX, mouseY);
    } else {
      canvas.style.cursor = 'default';
    }

    const { r: cr, c: cc } = mouseCell;
    if (cr >= 0 && cr < ROWS && cc >= 0 && cc < COLS && revealed[cr] && revealed[cr][cc] && board[cr] && board[cr][cc] > 0) {
      let f = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = cr + dr, nc = cc + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && flagged[nr][nc]) f++;
        }
      if (f === board[cr][cc]) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,220,50,0.8)'; ctx.lineWidth = 1.5;
        ctx.strokeRect(cc * CELL + 1, cr * CELL + 1, CELL - 2, CELL - 2); ctx.restore();
      }
    }

    waveT += 0.04;
    requestAnimationFrame(drawFrame);
  }

  function getCell(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    return {
      c:  Math.floor((e.clientX - rect.left) * sx / CELL),
      r:  Math.floor((e.clientY - rect.top)  * sy / CELL),
      px: (e.clientX - rect.left) * sx,
      py: (e.clientY - rect.top)  * sy,
    };
  }

  canvas.addEventListener('mousemove', e => {
    const { r, c, px, py } = getCell(e);
    mouseX = px; mouseY = py; mouseCell = { r, c };
  });
  canvas.addEventListener('mouseleave', () => { mouseCell = { r: -1, c: -1 }; canvas.style.cursor = 'default'; });

  function handleLost() {
    gs = 'lost'; clearInterval(ti);
    for (let mr = 0; mr < ROWS; mr++) for (let mc = 0; mc < COLS; mc++) if (board[mr][mc] === -1) revealed[mr][mc] = true;
    document.getElementById('sb').textContent = '😵';
    const ot = document.getElementById('ot');
    ot.textContent = 'BOOM! 💥'; ot.style.color = '#ff5544';
    setTimeout(() => document.getElementById('ov').classList.add('show'), 900);
  }

  function handleWon() {
    gs = 'won'; clearInterval(ti); saveScore(currentDiff, tv);
    document.getElementById('sb').textContent = '😎';
    const ot = document.getElementById('ot');
    ot.textContent = `GEWONNEN! 🎉 ${tv}s`; ot.style.color = DIFFS[currentDiff].color;
    document.getElementById('ov').classList.add('show');
  }

  canvas.addEventListener('click', e => {
    e.preventDefault();
    if (gs === 'won' || gs === 'lost') { init(); return; }
    const { r, c } = getCell(e);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
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

  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (gs === 'won' || gs === 'lost') return;
    const { r, c } = getCell(e);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || !P[r][c] || revealed[r][c]) return;
    if (!flagged[r][c] && !qmark[r][c])      flagged[r][c] = true;
    else if (flagged[r][c]) { flagged[r][c] = false; qmark[r][c] = true; }
    else qmark[r][c] = false;
    document.getElementById('mc').textContent = String(mineCount - flagCount()).padStart(3, '0');
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

  window.addEventListener('resize', () => { /* canvas CSS width:100% handles scaling */ });
  init();
  drawFrame();
})();
