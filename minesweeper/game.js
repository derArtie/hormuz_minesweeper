(function () {
  const VERSION = '1.0.4';

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
      const card = document.createElement('div');
      card.className = 'hs-entry';
      const label = `<div class="hs-entry-label" style="color:${cfg.color}">${cfg.label}</div>`;
      if (!en.length) {
        card.innerHTML = label + `<div style="color:#556;font-family:'JetBrains Mono',monospace;font-size:13px">—</div>`;
      } else {
        const times = en.slice(0, 5).map((t, i) =>
          `<div style="font-family:'JetBrains Mono',monospace;font-size:${i === 0 ? 16 : 13}px;color:${i === 0 ? '#e8d080' : '#556'}">${t}s</div>`
        ).join('');
        card.innerHTML = label + times;
      }
      list.appendChild(card);
    });
  }
  renderScores();
  document.getElementById('ver').textContent = `v${VERSION}`;

  // ── Changelog ──────────────────────────────────────────
  const CHANGELOG = [
    {
      version: '1.0.4',
      date: 'März 2026',
      items: [
        'Changelog-Übersicht hinzugefügt',
        'Desktop/Mobile-Steuerung in Protocol Instructions nebeneinander',
        'Text-Selektion bei Long Press auf iOS behoben',
        'Startseite neu gestaltet — passt jetzt zum Spieldesign',
      ],
    },
    {
      version: '1.0.3',
      date: 'März 2026',
      items: [
        'Pan & Zoom: Pinch auf Mobile, Scroll auf Desktop',
        'Long Press zum Setzen von Flaggen auf Mobile',
        'Protocol Instructions mit Desktop/Mobile-Sektionen',
        'Schiff-Cursor verkleinert und zentriert',
      ],
    },
    {
      version: '1.0.2',
      date: 'März 2026',
      items: [
        'Katzen-Memes beim Gewinnen und Verlieren',
        'Mehr lustige Sprüche pro Spielausgang',
        'Kein doppeltes Bild oder Caption zweimal hintereinander',
        'Cache Busting via ?v= Parameter eingeführt',
      ],
    },
    {
      version: '1.0.1',
      date: 'März 2026',
      items: [
        'UI-Redesign nach maritimem Designkonzept',
        'Inter + JetBrains Mono Fonts',
        'Pill-Navigation, LCD-Zähler, Tag/Nacht-Modus',
        'Startseite und Spielseite getrennt (minesweeper/)',
      ],
    },
    {
      version: '1.0.0',
      date: 'März 2026',
      items: [
        'Persistente Bestzeiten via localStorage (Top 5)',
        'Versionsnummer im UI',
        'CSS, JS und HTML aufgeteilt',
        'README befüllt',
      ],
    },
  ];

  function renderChangelog() {
    const body = document.getElementById('cl-body');
    body.innerHTML = CHANGELOG.map((entry, i) => `
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

  renderChangelog();

  const clModal = document.getElementById('cl-modal');
  document.getElementById('cl-btn').addEventListener('click', () => clModal.classList.toggle('open'));
  document.getElementById('cl-close').addEventListener('click', () => clModal.classList.remove('open'));
  clModal.addEventListener('click', e => { if (e.target === clModal) clModal.classList.remove('open'); });

  const canvas = document.getElementById('gc');
  const ctx = canvas.getContext('2d');
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;

  let waveT = 0, particles = [], mouseCell = { r: -1, c: -1 };
  let mouseCanvasX = -99, mouseCanvasY = -99;
  let vScale = 1, vPanX = 0, vPanY = 0;
  let board, revealed, flagged, qmark, gs, tv, ti, fc, mineCount;

  function init() {
    mineCount = DIFFS[currentDiff].mines;
    board    = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    revealed = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    flagged  = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    qmark    = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    gs = 'idle'; tv = 0; fc = true; particles = [];
    vScale = 1; vPanX = 0; vPanY = 0;
    clearInterval(ti);
    document.getElementById('tm').textContent = '000';
    document.getElementById('mc').textContent = String(mineCount).padStart(3, '0');
    document.getElementById('sb').textContent = '🙂';
    document.getElementById('ov').classList.remove('show');
    const mi = document.getElementById('meme-img');
    mi.classList.remove('loaded'); mi.src = '';
    const mv = document.getElementById('meme-vid');
    mv.classList.remove('loaded'); mv.pause(); mv.src = '';
    document.getElementById('meme-cap').textContent = '';
  }

  function clampView() {
    const W = canvas.width, H = canvas.height;
    vPanX = Math.max(W * (1 - vScale), Math.min(0, vPanX));
    vPanY = Math.max(H * (1 - vScale), Math.min(0, vPanY));
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
    ctx.save();
    ctx.translate(vPanX, vPanY);
    ctx.scale(vScale, vScale);

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

    ctx.restore(); // end pan/zoom transform

    // Cursor außerhalb des Transforms in Canvas-Pixelkoordinaten zeichnen
    if (showShip()) {
      canvas.style.cursor = 'none';
      ctx.font = `18px serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('🚢', mouseCanvasX - 2, mouseCanvasY - 2);
    } else {
      canvas.style.cursor = 'default';
    }

    waveT += 0.04;
    requestAnimationFrame(drawFrame);
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

  canvas.addEventListener('mousemove', e => {
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
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newScale = Math.max(1, Math.min(5, vScale * factor));
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
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !(gs === 'won' || gs === 'lost') && P[r][c] && !revealed[r][c]) {
            if (!flagged[r][c] && !qmark[r][c])      flagged[r][c] = true;
            else if (flagged[r][c]) { flagged[r][c] = false; qmark[r][c] = true; }
            else qmark[r][c] = false;
            document.getElementById('mc').textContent = String(mineCount - flagCount()).padStart(3, '0');
          }
          touchState = null;
        }
      }, 500);
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
      const newScale = Math.max(1, Math.min(5, vScale * factor));
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
  }, { passive: false });

  const MEME_CAPTIONS = {
    won: [
      'Einer der größten Seekapitäne unserer Zeit. 🫡',
      'Die Straße von Hormuz gehört jetzt dir.',
      'NSA fragt: Wer hat dir geholfen?',
      'Sonar-Meister der ersten Klasse. Respekt.',
      'Kein Platz mehr für Seeminen. Kapitän.',
      'Das Pentagon will deine Nummer.',
      'Strategisch. Präzise. Unaufhaltbar.',
      "Lloyd's of London erhöht deine Prämie nicht. Gut so.",
      'Iran hat Fragen. Du hast Antworten.',
      'Einfach mal alle Minen im Kopf behalten. Kein Problem.',
      'Die Besatzung feiert. Du schwitzt noch.',
      'Häfen weltweit öffnen für dich ihre Tore.',
      'Militärische Präzision. Zivile Tarnung.',
      'Der Suezkanal war Aufwärmtraining.',
      'Minen: 0. Du: alles.',
    ],
    lost: [
      'Das Minenfeld kämpft zurück. 💀',
      'BOOM! Die iranische Marine bedankt sich.',
      'Hätte man die auch flaggen können...',
      'Das Schiff sinkt — und dein Ruf auch.',
      'Kurze Stille. Dann: nichts mehr.',
      'Lehrgeld bezahlt. Teures Lehrgeld.',
      'Nicht jede Reise endet im Hafen.',
      'Die Mine hat dich schon gesehen. Du sie nicht.',
      "Lloyd's of London weint leise.",
      'Ruhm und Ehre: vertagt.',
      'Versicherung ungültig. Grund: Unvorsichtigkeit.',
      'Der Kapitän verlässt das Schiff zuerst. Unfreiwillig.',
      'Nächste Fahrt vielleicht mit Radar.',
      'Irgendwo lacht ein Minenräumer.',
      'Das war kein Fisch.',
    ],
  };

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

  const LOCAL_MEMES = {
    lost: [
      'img/lose/approved_crying_cat.jpg',
      'img/lose/cat_zoning_out.mp4',
      'img/lose/crying_cat.jpg',
      'img/lose/grumpy_cat.jpg',
      'img/lose/salad_cat.webp',
    ],
    won: [
      'img/win/cat_vibing.mp4',
      'img/win/persian_cat.jpg',
      'img/win/scared-cat.jpg',
      'img/win/smiling-cat.jpg',
    ],
  };

  function showMeme(type) {
    const img = document.getElementById('meme-img');
    const vid = document.getElementById('meme-vid');
    const cap = document.getElementById('meme-cap');

    img.classList.remove('loaded');
    vid.classList.remove('loaded');
    vid.pause();

    cap.textContent = pickNoDupe(MEME_CAPTIONS[type], _lastCap[type]);

    const src = pickNoDupe(LOCAL_MEMES[type], _lastMeme[type]);
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
    for (let mr = 0; mr < ROWS; mr++) for (let mc = 0; mc < COLS; mc++) if (board[mr][mc] === -1) revealed[mr][mc] = true;
    document.getElementById('sb').textContent = '😵';
    const ot = document.getElementById('ot');
    ot.textContent = 'BOOM! 💥'; ot.style.color = '#ff5544';
    showMeme('lost');
    setTimeout(() => document.getElementById('ov').classList.add('show'), 900);
  }

  function handleWon() {
    gs = 'won'; clearInterval(ti); saveScore(currentDiff, tv);
    document.getElementById('sb').textContent = '😎';
    const ot = document.getElementById('ot');
    ot.textContent = `GEWONNEN! 🎉 ${tv}s`; ot.style.color = DIFFS[currentDiff].color;
    showMeme('won');
    document.getElementById('ov').classList.add('show');
  }

  canvas.addEventListener('click', e => {
    if (touchPanned) { touchPanned = false; return; }
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

  document.getElementById('gw').addEventListener('selectstart', e => e.preventDefault());

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

  // ── DEBUG MODE ──────────────────────────────────────────────────────────────
  // Aktivierung: URL-Parameter ?debug  (z.B. http://localhost/?debug)
  // Für normale Nutzer vollständig unsichtbar.
  const DEBUG = new URLSearchParams(location.search).has('debug');
  if (DEBUG) {
    // Debug-Panel in die Seite injizieren
    const panel = document.createElement('div');
    panel.id = 'dbg-panel';
    panel.innerHTML = `
      <div style="font-weight:600;margin-bottom:6px;color:#facc15">🔧 Dev-Panel</div>
      <div class="dbg-row"><kbd>W</kbd> Sofort gewinnen</div>
      <div class="dbg-row"><kbd>L</kbd> Sofort verlieren</div>
      <div class="dbg-row"><kbd>S</kbd> Testscores laden</div>
      <div class="dbg-row"><kbd>X</kbd> Scores leeren</div>
      <div class="dbg-row"><kbd>I</kbd> Neu starten</div>
    `;
    Object.assign(panel.style, {
      position: 'fixed', bottom: '16px', right: '16px', zIndex: '9999',
      background: 'rgba(15,23,42,0.95)', border: '1px solid #334155',
      borderRadius: '8px', padding: '12px 16px', fontSize: '12px',
      color: '#94a3b8', fontFamily: 'Inter, sans-serif', lineHeight: '1.8',
      backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    });
    // Inline-Stile für kbd und Rows
    panel.querySelectorAll('.dbg-row').forEach(r => Object.assign(r.style, { display: 'flex', gap: '8px', alignItems: 'center' }));
    document.body.appendChild(panel);
    // KBD-Elemente nach dem Append stylen
    panel.querySelectorAll('kbd').forEach(k => Object.assign(k.style, {
      display: 'inline-block', background: '#1e293b', border: '1px solid #475569',
      borderRadius: '4px', padding: '0 5px', fontFamily: 'JetBrains Mono, monospace',
      color: '#e2e8f0', fontSize: '11px', minWidth: '20px', textAlign: 'center',
    }));

    function dbgEnsurePlaying() {
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

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key.toUpperCase()) {

        case 'W': { // Sofort gewinnen
          dbgEnsurePlaying();
          for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
              if (P[r][c] && board[r][c] !== -1) revealed[r][c] = true;
          handleWon();
          break;
        }

        case 'L': { // Sofort verlieren
          dbgEnsurePlaying();
          const mine = waterCells.find(({ r, c }) => board[r][c] === -1);
          if (mine) { revealed[mine.r][mine.c] = true; spawnExplosion(mine.r, mine.c); handleLost(); }
          break;
        }

        case 'S': { // Testscores für alle Schwierigkeiten laden
          scores.easy   = [42, 67, 91, 110, 134];
          scores.medium = [88, 105, 143];
          scores.hard   = [201, 256];
          persistScores();
          renderScores();
          break;
        }

        case 'X': { // Alle Scores löschen
          scores.easy = []; scores.medium = []; scores.hard = [];
          persistScores();
          renderScores();
          break;
        }

        case 'I': { // Neu starten
          init();
          break;
        }
      }
    });
  }
  // ── END DEBUG ────────────────────────────────────────────────────────────────
})();
