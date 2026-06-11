import { h } from './dom';

const REPEAT_MS = 180;

/** On-Screen-D-Pad für den Patrouille-Modus (Mobile). */
export class Dpad {
  readonly element: HTMLElement;
  private repeatTimer = 0;

  constructor(root: HTMLElement, onMove: (dr: number, dc: number) => void) {
    this.element = h('div', 'dpad');
    const dirs: [string, number, number, string][] = [
      ['▲', -1, 0, 'u'],
      ['◀', 0, -1, 'l'],
      ['▶', 0, 1, 'r'],
      ['▼', 1, 0, 'd'],
    ];
    for (const [glyph, dr, dc, area] of dirs) {
      const btn = h('button', 'dpad-btn', glyph);
      btn.type = 'button';
      btn.style.gridArea = area;
      btn.setAttribute('aria-label', `Schiff bewegen ${glyph}`);
      const start = (e: Event) => {
        e.preventDefault();
        onMove(dr, dc);
        window.clearInterval(this.repeatTimer);
        this.repeatTimer = window.setInterval(() => onMove(dr, dc), REPEAT_MS);
      };
      const stop = () => window.clearInterval(this.repeatTimer);
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', stop);
      btn.addEventListener('touchcancel', stop);
      btn.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') start(e);
      });
      btn.addEventListener('pointerup', stop);
      btn.addEventListener('pointerleave', stop);
      this.element.append(btn);
    }
    this.element.append(h('div', 'dpad-mid'));
    root.append(this.element);
  }

  setVisible(visible: boolean): void {
    this.element.classList.toggle('show', visible);
  }
}
