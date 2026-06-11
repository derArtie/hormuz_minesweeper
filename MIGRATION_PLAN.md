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
- [x] **1. Scaffold** — Vite + TypeScript (strict) + ESLint + Prettier + Vitest;
      Assets nach `public/` verschoben; Legacy `game.js`/`styles.css` entfernt (Git-Historie behält sie).
- [x] **2. Engine-Extraktion** — `engine/` mit Map-Daten (per Skript exakt aus v1 extrahiert),
      Board-Logik, Patrouille-BFS, Score-Persistenz inkl. v1-Migration, Game-Orchestrierung
      mit Events; 29 Unit-Tests (Minenplatzierung, First-Click-Safety, Flood-Fill, Chord,
      Win/Lose, Patrol-Pfad-Garantie, Score-Migration).
- [x] **3. 3D-Grundszene** — Renderer (PixelRatio-Cap ≤ 2, WebGL-Fallback), Kamera-Rig
      (58° geneigte Top-Down-Perspektive, Zoom/Pan mit Damping und Clamping), stilisiertes
      Wasser (Custom-Shader: 3 überlagerte Wellen, Sonnenglitzern, Nebel), Low-Poly-Terrain
      (Heightmap aus Küstenabstand + deterministischem Jitter, Vertex-Farben, flat shading),
      Länder-Labels via CSS2DRenderer.
- [x] **4. Gameplay-Integration** — InstancedMesh-Tiles mit gestaffelter Sink-Animation +
      Wasserspritzern, farbcodierte Zahlen (8 Instanz-Layer mit Canvas-Texturen), Flaggen,
      Fragezeichen, Seeminen (gemergte Spike-Geometrie), Explosion (gepoolte GPU-Partikel +
      PointLight-Blitz + dezenter Kamera-Shake), Low-Poly-Schiff mit Schaukeln,
      Slide-Animation, Kielwasser und Navigationslicht, pulsierende goldene Zielzone.
- [x] **5. UI/UX** — Design-Tokens (CSS Custom Properties: Farben, Spacing-, Typo-Skala),
      Glassmorphism-Nav + HUD (Minen-Counter, Mission Clock, Lives-Herzen, Smiley-Reset),
      animierte End-Overlays (Meme, Bestzeiten-Vergleich, Schwierigkeits-/Moduswechsel),
      Hilfe-Overlay (`?`), Erststart-Hints, D-Pad (Patrouille), Sound-Toggle, Changelog-Modal.
- [x] **6. Input + A11y** — Maus (Links/Rechts/Mitte/Wheel mit Cursor-Pivot-Zoom),
      Touch (Tap, Long-Press-Flagge, Pinch-Zoom, Drag-Pan), Tastatur (Pfeile/Enter/Space
      klassisch, WASD Patrouille, M/N/R/?-Shortcuts), ARIA-Live-Region,
      sichtbarer 3D-Fokusring, `prefers-reduced-motion` (Wellen, Partikel, Shake, Konfetti).
- [x] **7. Tag/Nacht + Polish** — echter Lichtwechsel (Sonne/Mond, Farbtemperatur, Nebel,
      sanfte 1,4-s-Überblendung, nachts blinkende Leuchtbojen), Konfetti bei Sieg,
      Micro-Interactions (Hover-Tiles, Button-Feedback), Partikel-Budget (700 gepoolt).
- [x] **8. Deployment + Doku** — GitHub Action (Test → Lint → Build → Pages-Deploy),
      README- und Landing-Page-Update, Changelog-Eintrag 2.0.0.
- [x] **9. Verifikation** — Tests grün, `tsc` sauber, ESLint sauber, Production-Build,
      Headless-Browser-Smoke-Tests (Reveal/Chord/Flagge/Zoom, Patrouille-Intro und -Bewegung,
      Sieg-/Niederlage-Overlays, Tag/Nacht) via `scripts/smoke*.mjs`.

## Status: abgeschlossen (2026-06-11)

Nacharbeiten / bewusste Lücken:
- Lighthouse-Mobile-Score wurde lokal nicht gemessen (kein stabiles Chrome-CLI-Setup);
  Architektur ist auf das 60-fps-/Perf-Ziel ausgelegt (InstancedMesh, Partikel-Pool,
  PixelRatio-Cap, ein Wasser-Mesh). Nach dem Deploy einmal auf echter Hardware prüfen.
- Screenshots im README sind Platzhalter — nach dem Deploy echte Aufnahmen einfügen.
- Cursor-Auswahl und das versteckte Dev-Panel aus v1 wurden bewusst nicht übernommen
  (Ersatz für Tests: Dev-Hook `window.__hormuz`, nur im Dev-Build).

## Risiken / Hinweise

- **GitHub Pages**: Nach Merge muss in den Repo-Settings die Pages-Quelle einmalig auf
  „GitHub Actions" umgestellt werden (bisher: Deploy from branch).
- **Bestzeiten**: v1-Key `hormuz_scores` wird beim ersten Start von 2.0 erkannt und in das
  neue versionierte Format übernommen — gleiche Domain ⇒ gleicher localStorage-Origin.
- **Performance-Ziel**: 60 fps auf Mid-Range-Smartphones → InstancedMesh für alle Zellobjekte,
  PixelRatio ≤ 2, begrenztes Partikel-Budget, ein einziges animiertes Wasser-Mesh.
