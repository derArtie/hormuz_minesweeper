# Hormuz Strategic 2.0

Maritimes 3D-Minesweeper auf einer stilisierten Karte des Persischen Golfs — gebaut mit
Three.js, läuft komplett im Browser. Minen sind als Seeminen im Wasser versteckt; nur
Wasserzellen sind spielbar, Landzellen sind Low-Poly-Terrain.

> **Screenshots:** _Platzhalter — folgen._
> `docs/screenshots/classic-night.png` · `docs/screenshots/patrol-day.png`

## Spielmodi

### ⚓ Klassisch
Decke alle sicheren Wasserzellen auf, ohne eine Seemine zu treffen. Der erste Klick ist
immer sicher (3×3-Umfeld minenfrei). Klick auf eine erfüllte Zahl löst einen Chord-Reveal aus.

### 🚢 Patrouille
Navigiere das Patrouillenschiff von einer Kartenseite zur anderen, ohne auf Minen zu laufen.
Ein minenfreier Pfad ist garantiert; bekannte Minen blockieren den Kurs. Leben steigen mit
der Minendichte: Leicht 3 · Mittel 5 · Schwer 7.

## Schwierigkeitsgrade

| Stufe  | Seeminen | Leben (Patrouille) |
|--------|----------|--------------------|
| Leicht | 45       | 3                  |
| Mittel | 99       | 5                  |
| Schwer | 150      | 7                  |

## Steuerung

| | Desktop | Mobile |
|---|---|---|
| Aufdecken | Linksklick / Enter | Tap |
| Flagge → Fragezeichen | Rechtsklick / Leertaste | Long-Press |
| Chord | Klick auf Zahl | Tap auf Zahl |
| Fokus / Schiff | Pfeiltasten (Klassisch) · WASD/Pfeile (Patrouille) | D-Pad (Patrouille) |
| Zoom / Pan | Scroll · Mitteltaste/Drag | Pinch · Drag |
| Shortcuts | `?` Hilfe · `M` Sound · `N` Tag/Nacht · `R` Neue Mission | — |

## Features

- **3D-Szene**: animiertes Wasser (Custom-Shader mit Wellen und Sonnenglitzern),
  Low-Poly-Terrain mit Küstenrelief, im Raum verankerte Länderbeschriftungen (CSS2D)
- **Befriedigendes Aufdecken**: Zellen versinken gestaffelt mit Wasserspritzern,
  farbcodierte Zahlen wie im klassischen Minesweeper
- **Explosionen**: Partikel, Lichtblitz, dezenter Kamera-Shake (entfällt bei
  `prefers-reduced-motion`)
- **Patrouillenschiff**: Low-Poly-Modell mit Schaukeln, Slide-Animation, Kielwasser
  und Navigationslicht; pulsierende goldene Zielzone
- **Tag/Nacht-Modus**: echter Lichtwechsel in der Szene mit sanfter Überblendung,
  nachts Mondlicht und Leuchtbojen
- **Modernes UI**: Glassmorphism-HUD (Minen-Counter, Mission Clock, Leben, Smiley-Reset),
  animierte End-Overlays mit Katzen-Memes, Bestzeiten-Vergleich und direktem
  Schwierigkeits-/Moduswechsel, Hilfe-Overlay (`?`), Erststart-Hints
- **Sound**: Web Audio API (Klick, Plopp, Explosion, Sieg-Fanfare), stummschaltbar
- **Konfetti** beim Sieg im Klassisch-Modus
- **Accessibility**: vollständige Tastatursteuerung mit sichtbarem 3D-Fokus,
  ARIA-Live-Ansagen für Spielereignisse, Touch-Targets ≥ 44 px
- **Persistenz**: Top-5-Bestzeiten pro Modus und Schwierigkeitsgrad in localStorage;
  Bestzeiten aus v1 werden automatisch migriert
- **Performance**: InstancedMesh für alle Zellobjekte, gepoolte GPU-Partikel,
  PixelRatio-Cap, ein einziges animiertes Wasser-Mesh

## Tech-Stack

- [Three.js](https://threejs.org/) — einzige große Runtime-Dependency
- [Vite](https://vite.dev/) + TypeScript (strict mode)
- [Vitest](https://vitest.dev/) für die Spiellogik-Tests, ESLint + Prettier
- Spiellogik (`src/engine/`) ist framework-frei und vom Rendering strikt getrennt

```
src/
  engine/   Spiellogik: Karte, Board, Patrouille-BFS, Scores (+ Tests)
  state/    Persistente Einstellungen
  render/   Three.js: Wasser, Terrain, Tiles, Schiff, Effekte, Tag/Nacht
  ui/       HUD, Overlays, Eingabe (Maus/Touch/Tastatur), D-Pad, Styles
  audio/    Web-Audio-Soundeffekte
public/     Statische Assets (Fonts, Memes, Changelog, CNAME)
```

## Lokale Entwicklung

```bash
npm install
npm run dev        # Dev-Server → http://localhost:5173/minesweeper/
npm test           # Engine-Unit-Tests (Vitest)
npm run lint       # ESLint
npm run build      # Type-Check + Production-Build nach dist/
npm run preview    # Production-Build lokal testen
```

## Deployment

Push auf `main` baut und deployt automatisch über die GitHub Action
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) auf GitHub Pages.

> **Einmalig nötig:** In den Repo-Settings unter *Pages* die Source auf
> **„GitHub Actions"** umstellen (bisher „Deploy from a branch").
> Die Custom Domain (`heyartur.de`) bleibt erhalten — die CNAME-Datei
> liegt in `public/` und landet im Build.

## Version

`2.0.0` — 3D-Remake mit Three.js. Historie im Changelog-Modal im Spiel.
