# Migrationsplan: Hormuz Strategic 2.0 (3D-Remake)

Stand: 2026-06-11 · Branch: `claude/hormuz-3d`

## Phase 0 — Analyse der bestehenden Codebase (v1.1.3)

### Architektur v1

- Statische Site, kein Build-Schritt. Landing Page in `index.html` (Root), Spiel unter
  `minesweeper/` (`index.html`, `game.js`, `styles.css`), Custom Domain `heyartur.de` (CNAME),
  Deployment: GitHub Pages direkt aus dem Branch.
- `game.js` ist eine einzelne IIFE (~1180 Zeilen): Spiellogik, Canvas-2D-Rendering, Input,
  Audio und DOM-Updates sind eng verflochten.

### Spiellogik-Kerne (zu extrahieren)

| Kern | v1-Implementierung |
|---|---|
| Karte | 60×40-Grid; `RAW` (1 = Land), `PLAY` (1 = spielbare Wasserzelle), Rest = nicht spielbares Wasser |
| Minenplatzierung | Fisher-Yates über Wasserzellen, 3×3 um Erstklick ausgeschlossen (`placeMines`) |
| Aufdecken | Rekursiver Flood-Fill über 8er-Nachbarschaft bei 0-Zellen (`reveal`) |
| Chord | Klick auf Zahl mit passender Flaggenzahl deckt restliche Nachbarn auf (`chordReveal`) |
| Flaggen | Zyklus Flagge → Fragezeichen → leer (`toggleFlag`) |
| Win/Lose | Alle minenfreien Wasserzellen aufgedeckt = Sieg; Mine getroffen = Niederlage |
| Patrouille | Zufällige Richtung (W→O oder O→W), Start-/Zielspalte = min/max Wasserspalte ±4, BFS garantiert einen minenfreien Pfad (bis zu 100 Re-Rolls), Leben je Schwierigkeit |
| Timer | 1-s-Intervall, max. 999 |
| Bestzeiten | localStorage-Key `hormuz_scores`, Format `{easy:[s,…],medium:[…],hard:[…]}`, sortiert, Top 5 |

### Abweichungen Spec ↔ v1-Code

- **Leben (Patrouille)**: Spec und README sagen 1–3 Leben; `game.js` hat 3/5/7.
  → Umgesetzt wird die Spec: Leicht 3, Mittel 2, Schwer 1.
- **Cursor-Auswahl** (Standard/Fadenkreuz/Schiff) und **Dev-Panel** stehen nicht auf der
  Paritätsliste → entfallen in 2.0 (Cursor-Emojis passen nicht zur 3D-Szene). Changelog-Modal bleibt.

## Zielarchitektur 2.0

Vite-Projekt im Repo-Root (Multi-Page: Landing `index.html` + Spiel `minesweeper/index.html`),
TypeScript strict, Three.js als einzige große Runtime-Dependency. Build → `dist/`, Deploy via
GitHub Action auf GitHub Pages (URL-Struktur und localStorage-Origin bleiben identisch).

```
src/
  engine/   Spiellogik, framework-frei, pure Functions, Vitest-getestet
  state/    Store/Events: verbindet Engine mit Render + UI
  render/   Three.js: Szene, Wasser-Shader, Terrain, Tiles, Schiff, Effekte, Tag/Nacht
  ui/       HUD, Overlays (Start/Ende/Hilfe), D-Pad, Styles
  audio/    Web Audio API (Klick, Splash, Explosion, Fanfare)
public/     Statische Assets: CNAME, favicon, fonts, minesweeper/img + memes.json + changelog.json
```

## Schritte

- [x] **0. Analyse + Plan** — dieses Dokument.
- [ ] **1. Scaffold** — Vite + TypeScript (strict) + ESLint + Prettier + Vitest;
      Assets nach `public/` verschieben; Legacy `game.js`/`styles.css` entfernen (Git-Historie behält sie).
- [ ] **2. Engine-Extraktion** — `engine/` mit Map-Daten, Board-Logik, Patrouille-BFS,
      Score-Persistenz inkl. v1-Migration, Game-Orchestrierung mit Events; Unit-Tests
      (Minenplatzierung, First-Click-Safety, Flood-Fill, Chord, Win/Lose, Patrol-Pfad, Score-Migration).
- [ ] **3. 3D-Grundszene** — Renderer (PixelRatio-Cap, WebGL-Fallback), Kamera-Rig
      (geneigte Top-Down-Perspektive, Zoom/Pan mit Damping), stilisiertes Wasser
      (Custom-Shader: Wellen, Glitzern), Low-Poly-Terrain mit Höhenvariation,
      Länder-Labels via CSS2DRenderer.
- [ ] **4. Gameplay-Integration** — InstancedMesh-Tiles mit Sink-Animation + Wasserspritzern,
      farbcodierte Zahlen (instanziert, Billboards flach auf dem Wasser), Flaggen, Fragezeichen,
      Seeminen-Meshes, Explosion (Partikel + Lichtblitz + dezenter Kamera-Shake),
      Low-Poly-Schiff mit Schaukeln, Slide-Animation und Kielwasser, Zielzone Patrouille.
- [ ] **5. UI/UX** — Design-Tokens (CSS Custom Properties), Glassmorphism-HUD
      (Minen-Counter, Mission Clock, Lives, Smiley-Reset), animierte End-Overlays
      (Meme, Bestzeiten-Vergleich, Schwierigkeits-/Moduswechsel), Hilfe-Overlay (`?`),
      Erststart-Hint, D-Pad (Mobile, Patrouille), Sound-Toggle, Changelog.
- [ ] **6. Input + A11y** — Maus (Links/Rechts/Mitte/Wheel), Touch (Tap, Long-Press,
      Pinch, Drag), Tastatur (Pfeile/Enter/Space klassisch, WASD Patrouille),
      ARIA-Live-Region, sichtbarer 3D-Fokusring, `prefers-reduced-motion`.
- [ ] **7. Tag/Nacht + Polish** — echter Lichtwechsel (Sonne/Mond, Farbtemperatur,
      sanfte Überblendung), Konfetti bei Sieg, Micro-Interactions, Partikel-Budget.
- [ ] **8. Deployment + Doku** — GitHub Action (Test → Build → Pages-Deploy),
      README-Update, dieses Dokument abschließen.
- [ ] **9. Verifikation** — Tests grün, `tsc` sauber, Production-Build, Smoke-Test.

## Risiken / Hinweise

- **GitHub Pages**: Nach Merge muss in den Repo-Settings die Pages-Quelle einmalig auf
  „GitHub Actions" umgestellt werden (bisher: Deploy from branch).
- **Bestzeiten**: v1-Key `hormuz_scores` wird beim ersten Start von 2.0 erkannt und in das
  neue versionierte Format übernommen — gleiche Domain ⇒ gleicher localStorage-Origin.
- **Performance-Ziel**: 60 fps auf Mid-Range-Smartphones → InstancedMesh für alle Zellobjekte,
  PixelRatio ≤ 2, begrenztes Partikel-Budget, ein einziges animiertes Wasser-Mesh.
