import { DIFFICULTIES, DIFFICULTY_ORDER, type Difficulty, type GameMode } from '../engine/types';
import { button, h, svgIcon } from './dom';

export interface HudCallbacks {
  onMode(mode: GameMode): void;
  onDiff(diff: Difficulty): void;
  onReset(): void;
  onToggleSound(): void;
  onToggleDay(): void;
  onHelp(): void;
  onChangelog(): void;
}

const ICON_SOUND_ON =
  '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>';
const ICON_SOUND_OFF =
  '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
const ICON_INFO =
  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
const ICON_HELP =
  '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
const ICON_ANCHOR =
  '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>';

/** Schwebendes Glas-HUD + Navigationsleiste über der 3D-Szene. */
export class Hud {
  readonly nav: HTMLElement;
  readonly bar: HTMLElement;

  private readonly modeButtons = new Map<GameMode, HTMLButtonElement>();
  private readonly diffButtons = new Map<Difficulty, HTMLButtonElement>();
  private readonly counterLabel: HTMLElement;
  private readonly counterValue: HTMLElement;
  private readonly clockValue: HTMLElement;
  private readonly smiley: HTMLButtonElement;
  private readonly hearts: HTMLElement;
  private readonly soundIcon: HTMLElement;
  private readonly dayButton: HTMLButtonElement;

  constructor(root: HTMLElement, cb: HudCallbacks) {
    // ── Navigation ──
    const brand = h('div', 'brand');
    brand.append(
      h('div', 'brand-icon', svgIcon(ICON_ANCHOR, 18)),
      h('div', 'brand-text', h('div', 'brand-title', 'Hormuz Strategic'), h('div', 'brand-sub', 'Maritime Navigation Protocol')),
    );

    const modeGroup = h('nav', 'seg-group seg-group--mode');
    for (const mode of ['classic', 'patrol'] as const) {
      const label = mode === 'classic' ? '⚓ Klassisch' : '🚢 Patrouille';
      const btn = button('seg-btn', label, () => cb.onMode(mode));
      this.modeButtons.set(mode, btn);
      modeGroup.append(btn);
    }

    const diffGroup = h('nav', 'seg-group seg-group--diff');
    for (const diff of DIFFICULTY_ORDER) {
      const btn = button('seg-btn', DIFFICULTIES[diff].label, () => cb.onDiff(diff));
      btn.dataset.diff = diff;
      this.diffButtons.set(diff, btn);
      diffGroup.append(btn);
    }

    this.soundIcon = h('span', 'icon-slot', svgIcon(ICON_SOUND_ON));
    const soundBtn = button('icon-btn', this.soundIcon, () => cb.onToggleSound());
    soundBtn.title = 'Sound an/aus (M)';
    soundBtn.setAttribute('aria-label', 'Sound an/aus');

    this.dayButton = button('icon-btn icon-btn--emoji', '☀️', () => cb.onToggleDay());
    this.dayButton.title = 'Tag/Nacht umschalten (N)';
    this.dayButton.setAttribute('aria-label', 'Tag/Nacht umschalten');

    const helpBtn = button('icon-btn', svgIcon(ICON_HELP), () => cb.onHelp());
    helpBtn.title = 'Hilfe (?)';
    helpBtn.setAttribute('aria-label', 'Hilfe anzeigen');

    const changelogBtn = button('icon-btn', svgIcon(ICON_INFO), () => cb.onChangelog());
    changelogBtn.title = 'Release Notes';
    changelogBtn.setAttribute('aria-label', 'Release Notes anzeigen');

    const actions = h('div', 'nav-actions', helpBtn, changelogBtn, soundBtn, this.dayButton);
    this.nav = h('header', 'nav glass', brand, h('div', 'nav-center', modeGroup, diffGroup), actions);

    // ── Spiel-HUD ──
    this.counterLabel = h('span', 'hud-label', 'Minen');
    this.counterValue = h('span', 'lcd', '000');
    this.clockValue = h('span', 'lcd', '000');
    this.smiley = button('smiley', '🙂', () => cb.onReset());
    this.smiley.title = 'Neue Mission (R)';
    this.smiley.setAttribute('aria-label', 'Neues Spiel starten');
    this.hearts = h('span', 'hearts');

    this.bar = h(
      'div',
      'hud-bar glass',
      h('div', 'hud-group', this.counterLabel, this.counterValue),
      h('div', 'hud-center', this.smiley, this.hearts),
      h('div', 'hud-group hud-group--right', h('span', 'hud-label', 'Mission Clock'), this.clockValue),
    );

    root.append(this.nav, this.bar);
  }

  setMode(mode: GameMode): void {
    for (const [m, btn] of this.modeButtons) btn.classList.toggle('active', m === mode);
    this.counterLabel.textContent = mode === 'patrol' ? 'Flaggen' : 'Minen';
    this.hearts.style.display = mode === 'patrol' ? '' : 'none';
  }

  setDiff(diff: Difficulty): void {
    for (const [d, btn] of this.diffButtons) btn.classList.toggle('active', d === diff);
  }

  setCounter(value: number): void {
    this.counterValue.textContent = String(Math.max(0, value)).padStart(3, '0');
  }

  setClock(seconds: number): void {
    this.clockValue.textContent = String(Math.min(999, seconds)).padStart(3, '0');
  }

  setSmiley(state: 'idle' | 'won' | 'lost'): void {
    this.smiley.textContent = state === 'won' ? '😎' : state === 'lost' ? '😵' : '🙂';
  }

  setLives(lives: number, max: number): void {
    this.hearts.replaceChildren();
    for (let i = 0; i < max; i++) {
      this.hearts.append(h('span', i < lives ? 'heart' : 'heart heart--lost', '♥'));
    }
    this.hearts.classList.remove('hearts--pulse');
    void this.hearts.offsetWidth; // Animation neu triggern
    this.hearts.classList.add('hearts--pulse');
  }

  setSoundOn(on: boolean): void {
    this.soundIcon.replaceChildren(svgIcon(on ? ICON_SOUND_ON : ICON_SOUND_OFF));
  }

  setDayMode(day: boolean): void {
    this.dayButton.textContent = day ? '🌙' : '☀️';
  }
}
