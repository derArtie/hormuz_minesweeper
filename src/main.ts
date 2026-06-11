import './ui/styles.css';
import { Sfx } from './audio/sfx';
import { Game } from './engine/game';
import { inBounds, isPlayable, waterCells } from './engine/map';
import { addScore, loadScores, saveScores } from './engine/scores';
import { DIFFICULTIES, type Cell, type Difficulty, type GameMode, type GameStatus } from './engine/types';
import { cellToWorld } from './render/cameraRig';
import { isWebGLAvailable, SceneRenderer } from './render/sceneRenderer';
import { loadSettings, saveSettings } from './state/settings';
import { h } from './ui/dom';
import { Dpad } from './ui/dpad';
import { Hud } from './ui/hud';
import { InputController } from './ui/input';
import { Overlays } from './ui/overlays';

const LOSS_OVERLAY_DELAY_MS = 1100;
const PATROL_INTRO_ZOOM = 2.6;

interface MemeData {
  captions: { won: string[]; lost: string[] };
  files: { won: string[]; lost: string[] };
}

function pickNoDupe(arr: string[], last: { value: string | null }): string {
  if (arr.length === 0) return '';
  let choice = arr[Math.floor(Math.random() * arr.length)];
  while (arr.length > 1 && choice === last.value)
    choice = arr[Math.floor(Math.random() * arr.length)];
  last.value = choice;
  return choice;
}

function boot(): void {
  const app = document.getElementById('app')!;
  app.replaceChildren();

  const settings = loadSettings();
  document.documentElement.classList.toggle('day', settings.day);

  // ARIA-Live-Region für Spielstatus-Ansagen
  const live = h('div', 'visually-hidden');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('role', 'status');
  app.append(live);
  const announce = (text: string) => {
    live.textContent = text;
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sfx = new Sfx(settings.sound);
  const scores = loadScores(localStorage);

  let mode: GameMode = 'classic';
  let diff: Difficulty = 'easy';
  let game: Game;
  let seconds = 0;
  let timer = 0;
  let focusCell: Cell | null = null;
  let keyboardActive = false;
  let lossOverlayTimer = 0;

  let memes: MemeData | null = null;
  const lastMeme = { won: { value: null as string | null }, lost: { value: null as string | null } };
  const lastCaption = { won: { value: null as string | null }, lost: { value: null as string | null } };
  void fetch('memes.json')
    .then((r) => r.json())
    .then((data: MemeData) => (memes = data))
    .catch(() => undefined);

  if (!isWebGLAvailable()) {
    const overlays = new Overlays(app, { onRestart: () => undefined, onDiff: () => undefined, onMode: () => undefined });
    overlays.showFatal(
      'WebGL nicht verfügbar',
      'Hormuz Strategic 2.0 benötigt WebGL für die 3D-Darstellung. Bitte aktiviere Hardware-Beschleunigung oder nutze einen aktuellen Browser (Chrome, Firefox, Edge, Safari).',
    );
    return;
  }

  const scene = new SceneRenderer(app, settings.day);

  const hud = new Hud(app, {
    onMode: (m) => {
      if (m !== mode) {
        mode = m;
        newGame();
      }
    },
    onDiff: (d) => {
      if (d !== diff) {
        diff = d;
        newGame();
      }
    },
    onReset: () => newGame(),
    onToggleSound: () => {
      settings.sound = sfx.toggle();
      hud.setSoundOn(settings.sound);
      saveSettings(settings);
    },
    onToggleDay: () => {
      settings.day = scene.dayNight.toggle();
      hud.setDayMode(settings.day);
      saveSettings(settings);
    },
    onHelp: () => overlays.toggleHelp(mode),
    onChangelog: () => void overlays.showChangelog(),
  });
  hud.setSoundOn(settings.sound);
  hud.setDayMode(settings.day);

  const overlays = new Overlays(app, {
    onRestart: () => newGame(),
    onDiff: (d) => {
      diff = d;
      hud.setDiff(d);
      newGame();
    },
    onMode: (m) => {
      mode = m;
      hud.setMode(m);
      newGame();
    },
  });

  const dpad = new Dpad(app, (dr, dc) => {
    if (mode === 'patrol') game.moveShip(dr, dc);
  });

  // ── Timer ────────────────────────────────────────────────────────────

  const stopTimer = () => window.clearInterval(timer);
  const startTimer = () => {
    stopTimer();
    timer = window.setInterval(() => {
      seconds = Math.min(999, seconds + 1);
      hud.setClock(seconds);
    }, 1000);
  };

  // ── Spielende ────────────────────────────────────────────────────────

  const memeFor = (won: boolean): { src: string; caption: string } | null => {
    if (!memes) return null;
    const key = won ? 'won' : 'lost';
    return {
      src: pickNoDupe(memes.files[key], lastMeme[key]),
      caption: pickNoDupe(memes.captions[key], lastCaption[key]),
    };
  };

  const handleStatus = (status: GameStatus) => {
    if (status === 'playing') {
      startTimer();
      return;
    }
    if (status === 'won') {
      stopTimer();
      hud.setSmiley('won');
      sfx.fanfare();
      const rank = addScore(scores, mode, diff, seconds);
      saveScores(localStorage, scores);
      if (mode === 'classic') scene.celebrate();
      announce(`Gewonnen in ${seconds} Sekunden!`);
      overlays.showEnd({ won: true, mode, diff, seconds, rank, scores, meme: memeFor(true) });
    }
    if (status === 'lost') {
      stopTimer();
      hud.setSmiley('lost');
      announce(mode === 'patrol' ? 'Schiff versunken. Mission gescheitert.' : 'Mine getroffen. Mission gescheitert.');
      if (mode === 'classic') {
        // restliche Minen sichtbar machen (die getroffene ist bereits rot markiert)
        for (const cell of game.allMines()) scene.board.showMine(cell, false);
      }
      lossOverlayTimer = window.setTimeout(
        () => overlays.showEnd({ won: false, mode, diff, seconds, rank: null, scores, meme: memeFor(false) }),
        LOSS_OVERLAY_DELAY_MS,
      );
    }
  };

  // ── Neues Spiel ──────────────────────────────────────────────────────

  function newGame(): void {
    window.clearTimeout(lossOverlayTimer);
    stopTimer();
    seconds = 0;
    focusCell = null;
    keyboardActive = false;

    game = new Game(mode, diff);
    scene.board.pendingCounts = game.board.count;
    scene.board.reset(game);
    scene.board.setFocus(null);
    scene.confetti.clear();
    scene.rig.resetView();
    scene.ship.setVisible(mode === 'patrol');

    hud.setMode(mode);
    hud.setDiff(diff);
    hud.setClock(0);
    hud.setSmiley('idle');
    hud.setCounter(mode === 'patrol' ? 0 : game.mineTotal);
    if (mode === 'patrol') hud.setLives(game.lives, DIFFICULTIES[diff].lives);
    overlays.hideEnd();
    dpad.setVisible(mode === 'patrol');

    game.on('revealed', (cells) => {
      scene.board.revealCells(cells, game.board.count, true);
      if (cells.length > 0)
        announce(cells.length === 1 ? 'Sektor aufgedeckt' : `${cells.length} Sektoren aufgedeckt`);
    });
    game.on('exploded', (cell) => {
      scene.board.showMine(cell, true);
      scene.effects.spawnExplosion(cellToWorld(cell));
      scene.shake(0.55);
      sfx.explosion();
    });
    game.on('marked', (cell, mark) => {
      scene.board.setMark(cell, mark);
      sfx.plop();
      announce(mark === 'flag' ? 'Flagge gesetzt' : mark === 'qmark' ? 'Fragezeichen gesetzt' : 'Markierung entfernt');
    });
    game.on('counter', (value) => hud.setCounter(value));
    game.on('lives', (lives) => {
      hud.setLives(lives, DIFFICULTIES[diff].lives);
      if (lives > 0) announce(`Mine getroffen! Noch ${lives} Leben.`);
    });
    game.on('shipMoved', (_from, to) => {
      scene.ship.setCell(to, true);
      scene.rig.follow(to);
    });
    game.on('status', handleStatus);

    if (mode === 'patrol' && game.ship) {
      scene.ship.setCell(game.ship, false);
      scene.rig.flyTo(game.ship, PATROL_INTRO_ZOOM, reducedMotion ? 0.01 : 1.8);
      scene.rig.follow(game.ship);
      announce('Patrouille gestartet. Navigiere das Schiff durch das Minenfeld zur anderen Seite.');
    } else {
      announce(`Klassische Mission gestartet, ${DIFFICULTIES[diff].label}: ${game.mineTotal} Minen.`);
    }

    if (!settings.hintSeen[mode]) {
      settings.hintSeen[mode] = true;
      saveSettings(settings);
      overlays.showHint(
        mode === 'patrol'
          ? 'Steuere mit WASD / Pfeiltasten (Mobile: D-Pad). Erreiche die goldene Zielzone — bekannte Minen blockieren den Kurs.'
          : 'Linksklick: Sektor scannen · Rechtsklick: Flagge · Drücke ? für alle Befehle.',
        9,
      );
    }
  }

  // ── Eingaben ─────────────────────────────────────────────────────────

  new InputController(scene.canvas, scene.rig, {
    onPrimary: (cell) => {
      if (game.status === 'won' || game.status === 'lost') return;
      if (mode !== 'classic') return;
      const { r, c } = cell;
      if (game.board.revealed[r][c]) {
        game.chordAt(r, c);
      } else if (isPlayable[r][c] && game.board.mark[r][c] === 'none') {
        sfx.click();
        game.revealAt(r, c);
      }
    },
    onSecondary: (cell) => {
      if (game.status === 'won' || game.status === 'lost') return;
      game.toggleMarkAt(cell.r, cell.c);
    },
    onHover: (cell) => {
      const valid =
        cell &&
        mode === 'classic' &&
        isPlayable[cell.r][cell.c] &&
        !game.board.revealed[cell.r][cell.c] &&
        (game.status === 'idle' || game.status === 'playing');
      scene.board.setHover(valid ? cell : null);
    },
    onPointerActivity: () => {
      if (keyboardActive) {
        keyboardActive = false;
        scene.board.setFocus(null);
      }
      overlays.hideHint();
    },
  });

  const moveFocus = (dr: number, dc: number) => {
    keyboardActive = true;
    if (!focusCell) {
      focusCell = waterCells[Math.floor(waterCells.length / 2)];
      scene.board.setFocus(focusCell);
      return;
    }
    let r = focusCell.r + dr;
    let c = focusCell.c + dc;
    while (inBounds(r, c) && !isPlayable[r][c]) {
      r += dr;
      c += dc;
    }
    if (inBounds(r, c) && isPlayable[r][c]) focusCell = { r, c };
    scene.board.setFocus(focusCell);
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === '?') {
      overlays.toggleHelp(mode);
      return;
    }
    if (e.key === 'Escape') {
      overlays.hideHelp();
      overlays.hideChangelog();
      overlays.hideHint();
      return;
    }
    if (overlays.endOpen || overlays.helpOpen) return;
    const key = e.key.toLowerCase();
    if (key === 'm') {
      settings.sound = sfx.toggle();
      hud.setSoundOn(settings.sound);
      saveSettings(settings);
      return;
    }
    if (key === 'n') {
      settings.day = scene.dayNight.toggle();
      hud.setDayMode(settings.day);
      saveSettings(settings);
      return;
    }
    if (key === 'r') {
      newGame();
      return;
    }
    if (game.status === 'won' || game.status === 'lost') return;

    const arrows: Record<string, [number, number] | undefined> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (mode === 'patrol') {
      const wasd: Record<string, [number, number] | undefined> = {
        w: [-1, 0],
        s: [1, 0],
        a: [0, -1],
        d: [0, 1],
      };
      const dir = arrows[e.key] ?? wasd[key];
      if (dir) {
        e.preventDefault();
        game.moveShip(dir[0], dir[1]);
      }
      return;
    }

    const dir = arrows[e.key];
    if (dir) {
      e.preventDefault();
      moveFocus(dir[0], dir[1]);
      return;
    }
    if (e.key === 'Enter' && focusCell) {
      e.preventDefault();
      keyboardActive = true;
      const { r, c } = focusCell;
      if (game.board.revealed[r][c]) game.chordAt(r, c);
      else if (game.board.mark[r][c] === 'none') {
        sfx.click();
        game.revealAt(r, c);
      }
      return;
    }
    if (e.key === ' ' && focusCell) {
      e.preventDefault();
      keyboardActive = true;
      game.toggleMarkAt(focusCell.r, focusCell.c);
    }
  });

  // ── Game-Loop ────────────────────────────────────────────────────────

  newGame();
  let lastTs = performance.now();
  const loop = (ts: number) => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;
    scene.update(dt);
    scene.render();
  };
  requestAnimationFrame(loop);
}

boot();
