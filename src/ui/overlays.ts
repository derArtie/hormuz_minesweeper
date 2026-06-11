import type { ScoreData } from '../engine/scores';
import { DIFFICULTIES, DIFFICULTY_ORDER, type Difficulty, type GameMode } from '../engine/types';
import { button, h } from './dom';

export interface EndScreenOptions {
  won: boolean;
  mode: GameMode;
  diff: Difficulty;
  seconds: number;
  /** 0-basierter Platz in den Bestzeiten oder null */
  rank: number | null;
  scores: ScoreData;
  meme: { src: string; caption: string } | null;
}

export interface OverlayCallbacks {
  onRestart(): void;
  onDiff(diff: Difficulty): void;
  onMode(mode: GameMode): void;
}

interface Instruction {
  keys: string;
  action: string;
}

const INSTRUCTIONS: Record<GameMode, { desktop: Instruction[]; mobile: Instruction[] }> = {
  classic: {
    desktop: [
      { keys: 'Linksklick / Enter', action: 'Sektor scannen' },
      { keys: 'Rechtsklick / Leertaste', action: 'Flagge → Fragezeichen' },
      { keys: 'Klick auf Zahl', action: 'Chord-Reveal' },
      { keys: 'Pfeiltasten', action: 'Fokus bewegen' },
      { keys: 'Scroll / Mitteltaste', action: 'Zoom / Pan' },
    ],
    mobile: [
      { keys: 'Tap', action: 'Sektor scannen' },
      { keys: 'Long-Press', action: 'Flagge setzen' },
      { keys: 'Pinch / Drag', action: 'Zoom / Pan' },
    ],
  },
  patrol: {
    desktop: [
      { keys: 'W A S D / Pfeiltasten', action: 'Schiff bewegen' },
      { keys: 'Rechtsklick', action: 'Flagge setzen' },
      { keys: 'Scroll / Mitteltaste', action: 'Zoom / Pan' },
    ],
    mobile: [
      { keys: 'D-Pad', action: 'Schiff bewegen' },
      { keys: 'Long-Press', action: 'Flagge setzen' },
      { keys: 'Pinch / Drag', action: 'Zoom / Pan' },
    ],
  },
};

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

/** End-, Hilfe- und Changelog-Overlays sowie kontextuelle Hints. */
export class Overlays {
  private readonly endOverlay: HTMLElement;
  private readonly endCard: HTMLElement;
  private readonly helpOverlay: HTMLElement;
  private readonly helpBody: HTMLElement;
  private readonly changelogOverlay: HTMLElement;
  private readonly changelogBody: HTMLElement;
  private readonly hintToast: HTMLElement;
  private hintTimer = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly cb: OverlayCallbacks,
  ) {
    this.endCard = h('div', 'overlay-card end-card');
    this.endOverlay = h('div', 'overlay overlay--end', this.endCard);
    this.endOverlay.addEventListener('click', (e) => {
      if (e.target === this.endOverlay) cb.onRestart();
    });

    this.helpBody = h('div', 'help-body');
    const helpCard = h('div', 'overlay-card help-card', h('h2', 'overlay-title', 'Protokoll-Anweisungen'), this.helpBody);
    const helpClose = button('overlay-close', '✕', () => this.hideHelp());
    helpClose.setAttribute('aria-label', 'Hilfe schließen');
    helpCard.prepend(helpClose);
    this.helpOverlay = h('div', 'overlay overlay--help', helpCard);
    this.helpOverlay.addEventListener('click', (e) => {
      if (e.target === this.helpOverlay) this.hideHelp();
    });

    this.changelogBody = h('div', 'changelog-body', 'Lade…');
    const clCard = h('div', 'overlay-card changelog-card', h('h2', 'overlay-title', 'Release Notes'), this.changelogBody);
    const clClose = button('overlay-close', '✕', () => this.hideChangelog());
    clClose.setAttribute('aria-label', 'Release Notes schließen');
    clCard.prepend(clClose);
    this.changelogOverlay = h('div', 'overlay overlay--changelog', clCard);
    this.changelogOverlay.addEventListener('click', (e) => {
      if (e.target === this.changelogOverlay) this.hideChangelog();
    });

    this.hintToast = h('div', 'hint-toast glass');
    root.append(this.endOverlay, this.helpOverlay, this.changelogOverlay, this.hintToast);
  }

  // ── Endscreen ──────────────────────────────────────────────────────────

  showEnd(opts: EndScreenOptions): void {
    this.endCard.replaceChildren();
    const title = h('h2', `end-title ${opts.won ? 'end-title--won' : 'end-title--lost'}`);
    title.textContent = opts.won
      ? opts.mode === 'patrol'
        ? 'DURCHGEBROCHEN! 🚢'
        : 'GEWONNEN! 🎉'
      : opts.mode === 'patrol'
        ? 'VERSUNKEN! 🌊'
        : 'BOOM! 💥';
    this.endCard.append(title);

    if (opts.won) {
      const timeline = h('div', 'end-time', `⏱ ${opts.seconds}s`);
      if (opts.rank === 0) timeline.append(h('span', 'end-best', ' Neue Bestzeit!'));
      else if (opts.rank !== null) timeline.append(h('span', 'end-best', ` Platz ${opts.rank + 1}`));
      this.endCard.append(timeline);
    }

    if (opts.meme) {
      const box = h('div', 'meme-box');
      if (opts.meme.src.endsWith('.mp4')) {
        const vid = document.createElement('video');
        vid.src = opts.meme.src;
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        box.append(vid);
      } else {
        const img = document.createElement('img');
        img.src = opts.meme.src;
        img.alt = '';
        box.append(img);
      }
      box.append(h('div', 'meme-caption', opts.meme.caption));
      this.endCard.append(box);
    }

    // Bestzeiten des aktuellen Modus/Schwierigkeitsgrads
    const times = opts.scores[opts.mode][opts.diff];
    const list = h('div', 'best-times');
    list.append(h('div', 'best-times-title', `Bestzeiten · ${DIFFICULTIES[opts.diff].label}`));
    if (times.length === 0) list.append(h('div', 'best-times-empty', '—'));
    else {
      const row = h('div', 'best-times-row');
      times.forEach((t, i) => {
        const cls = opts.won && i === opts.rank ? 'best-time best-time--new' : 'best-time';
        row.append(h('span', cls, `${t}s`));
      });
      list.append(row);
    }
    this.endCard.append(list);

    // Schwierigkeit + Modus direkt umschaltbar
    const diffRow = h('div', 'end-seg');
    for (const diff of DIFFICULTY_ORDER) {
      const btn = button(
        diff === opts.diff ? 'seg-btn active' : 'seg-btn',
        DIFFICULTIES[diff].label,
        () => this.cb.onDiff(diff),
      );
      diffRow.append(btn);
    }
    const modeRow = h('div', 'end-seg');
    for (const mode of ['classic', 'patrol'] as const) {
      const btn = button(
        mode === opts.mode ? 'seg-btn active' : 'seg-btn',
        mode === 'classic' ? '⚓ Klassisch' : '🚢 Patrouille',
        () => this.cb.onMode(mode),
      );
      modeRow.append(btn);
    }
    const restart = button('primary-btn', 'Neue Mission', () => this.cb.onRestart());
    this.endCard.append(diffRow, modeRow, restart, h('div', 'end-hint', 'Klick daneben startet ebenfalls neu'));

    this.endOverlay.classList.add('open');
    restart.focus();
  }

  hideEnd(): void {
    this.endOverlay.classList.remove('open');
  }

  get endOpen(): boolean {
    return this.endOverlay.classList.contains('open');
  }

  // ── Hilfe ──────────────────────────────────────────────────────────────

  showHelp(mode: GameMode): void {
    this.helpBody.replaceChildren();
    const groups: [string, Instruction[]][] = [
      ['Desktop', INSTRUCTIONS[mode].desktop],
      ['Mobile', INSTRUCTIONS[mode].mobile],
    ];
    for (const [label, rows] of groups) {
      const list = h('ul', 'help-list');
      for (const row of rows)
        list.append(h('li', '', h('span', 'help-keys', row.keys), h('span', '', row.action)));
      this.helpBody.append(h('div', 'help-group', h('h3', 'help-group-title', label), list));
    }
    this.helpBody.append(
      h(
        'div',
        'help-extra',
        'M: Sound · N: Tag/Nacht · R: Neue Mission · ?: Diese Hilfe. Im Patrouille-Modus bekannte Minen umfahren — bekannte Minen blockieren den Kurs.',
      ),
    );
    this.helpOverlay.classList.add('open');
  }

  hideHelp(): void {
    this.helpOverlay.classList.remove('open');
  }

  toggleHelp(mode: GameMode): void {
    if (this.helpOverlay.classList.contains('open')) this.hideHelp();
    else this.showHelp(mode);
  }

  get helpOpen(): boolean {
    return this.helpOverlay.classList.contains('open');
  }

  // ── Changelog ──────────────────────────────────────────────────────────

  async showChangelog(): Promise<void> {
    this.changelogOverlay.classList.add('open');
    try {
      const res = await fetch('changelog.json');
      const entries = (await res.json()) as ChangelogEntry[];
      this.changelogBody.replaceChildren();
      entries.forEach((entry, i) => {
        const head = h(
          'div',
          'cl-version',
          h('span', i === 0 ? 'cl-tag cl-tag--latest' : 'cl-tag', entry.version),
          h('span', 'cl-date', entry.date),
        );
        const list = h('ul', 'cl-items');
        for (const item of entry.items) list.append(h('li', '', item));
        this.changelogBody.append(h('div', 'cl-entry', head, list));
      });
    } catch {
      this.changelogBody.textContent = 'Changelog konnte nicht geladen werden.';
    }
  }

  hideChangelog(): void {
    this.changelogOverlay.classList.remove('open');
  }

  // ── Hints & Fallback ───────────────────────────────────────────────────

  showHint(text: string, seconds = 7): void {
    this.hintToast.textContent = text;
    this.hintToast.classList.add('open');
    window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => this.hideHint(), seconds * 1000);
  }

  hideHint(): void {
    this.hintToast.classList.remove('open');
  }

  /** Harter Fehler (z. B. kein WebGL): Vollbild-Meldung. */
  showFatal(title: string, message: string): void {
    const card = h('div', 'overlay-card fatal-card', h('h2', 'overlay-title', title), h('p', '', message));
    const overlay = h('div', 'overlay open', card);
    this.root.append(overlay);
  }
}
