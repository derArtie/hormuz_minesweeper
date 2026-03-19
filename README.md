# Hormuz Minesweeper

Ein browser-basiertes Minesweeper-Spiel, das auf einer stilisierten Karte der Straße von Hormuz und des Persischen Golfs spielt. Minen sind als Seeminen im Wasser versteckt.

## Spielmodi

### Klassisch
Decke alle sicheren Wasserzellen auf, ohne eine Mine zu treffen.

**Steuerung Desktop:** Linksklick — Aufdecken · Rechtsklick — Flagge · Chord — Zahl klicken · Scroll — Zoom · Mitteltaste — Schwenken

**Steuerung Mobile:** Tap — Aufdecken · Long Press — Flagge · Pinch — Zoom · Drag (gezoomt) — Schwenken

### Patrouille
Navigiere von einer Seite der Karte zur anderen. Das Schiff wird automatisch am Rand platziert, Startseite und Position sind zufällig. Je nach Schwierigkeitsgrad stehen 1–3 Leben zur Verfügung.

**Steuerung Desktop:** W/A/S/D oder Pfeiltasten — Schiff bewegen · Scroll — Zoom · Mitteltaste — Schwenken

**Steuerung Mobile:** D-Pad (unten links) — Schiff bewegen · Pinch — Zoom · Drag (gezoomt) — Schwenken

## Schwierigkeitsgrade

| Stufe  | Seeminen |
|--------|----------|
| Leicht | 45       |
| Mittel | 99       |
| Schwer | 150      |

## Features

- Zwei Spielmodi: Klassisch und Patrouille
- Kartenansicht des Persischen Golfs mit Länderbeschriftungen (Iran, Saudi-Arabien, Katar, VAE, Oman)
- Animiertes Wasser mit Wellenbewegung, Emboss-Effekt auf Landkacheln
- Partikeleffekte bei Explosionen
- Tag/Nacht-Modus (☀️ / 🌙)
- Cursor-Auswahl: Standard, Fadenkreuz oder Schiff (Desktop)
- Pan & Zoom: Pinch auf Mobile, Scroll auf Desktop, Mitteltaste zum Schwenken
- Kamera folgt dem Schiff im Patrouille-Modus mit sanftem Zoom-Intro
- D-Pad-Overlay für Mobile im Patrouille-Modus
- Persistente Bestzeiten via localStorage (Top 5 pro Schwierigkeitsgrad)
- Erster Klick ist immer sicher (keine Mine im 3×3-Bereich)
- Meme-Einblendung beim Gewinnen / Verlieren
- Protocol Instructions wechseln dynamisch je nach Spielmodus
- Modernes UI im maritimen Dark-Design
- Fonts lokal eingebunden (DSGVO-konform, kein Google CDN)
- Changelog-Modal mit Versionshistorie

## Dateistruktur

```
index.html          — Startseite
minesweeper/
  index.html        — Spielseite
  game.js           — Spiellogik und Canvas-Rendering
  styles.css        — Styling (Layout, Farben, UI-Komponenten)
  fonts.css         — Lokale @font-face Deklarationen (Inter, JetBrains Mono)
  fonts/            — Schriftdateien (woff2)
  changelog.json    — Versionshistorie
  memes.json        — Meme-Bilder und Captions
  img/              — Bilder und Medien
```

## Version

`1.1.2` — Lebensanzahl Patrouille angepasst (Leicht 3 / Mittel 5 / Schwer 7)

## Starten

`index.html` im Browser öffnen — keine Installation oder Build-Schritt erforderlich.
