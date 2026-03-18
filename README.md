# Hormuz Minesweeper

Ein browser-basiertes Minesweeper-Spiel, das auf einer stilisierten Karte der Straße von Hormuz und des Persischen Golfs spielt. Minen sind als Seeminen im Wasser versteckt.

## Spielprinzip

Klicke auf Wasserzellen, um sie aufzudecken. Vermeide die versteckten Seeminen. Markiere verdächtige Felder mit einer Flagge, um das Spielfeld zu kartieren.

**Steuerung Desktop:**
- **Linksklick** — Zelle aufdecken
- **Rechtsklick** — Flagge setzen / Fragezeichen / zurücksetzen
- **Linksklick auf aufgedeckte Zahl** — Chord-Reveal (deckt alle Nachbarn auf, wenn genug Flaggen gesetzt sind)
- **Scroll** — Zoom In/Out
- **Mittlere Maustaste gedrückt halten** — Karte schwenken (im gezoomten Zustand)

**Steuerung Mobile:**
- **Tap** — Zelle aufdecken
- **Long Press** — Flagge setzen
- **Pinch** — Zoom In/Out
- **Drag (gezoomt)** — Karte schwenken

## Schwierigkeitsgrade

| Stufe  | Seeminen |
|--------|----------|
| Leicht | 45       |
| Mittel | 99       |
| Schwer | 150      |

## Features

- Kartenansicht des Persischen Golfs mit Länderbeschriftungen (Iran, Saudi-Arabien, Katar, VAE, Oman)
- Animiertes Wasser mit Wellenbewegung
- Partikeleffekte bei Explosionen
- Tag/Nacht-Modus (☀️ / 🌙)
- Cursor-Auswahl: Standard, Fadenkreuz oder Schiff (Desktop)
- Pan & Zoom: Pinch auf Mobile, Scroll auf Desktop, Mitteltaste zum Schwenken
- Persistente Bestzeiten via localStorage (Top 5 pro Schwierigkeitsgrad)
- Erster Klick ist immer sicher (keine Mine im 3×3-Bereich)
- Meme-Einblendung beim Gewinnen / Verlieren
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

`1.0.8` — Cursor-Auswahl, Middle-Mouse-Panning, DSGVO-konforme Font-Einbindung

## Starten

`index.html` im Browser öffnen — keine Installation oder Build-Schritt erforderlich.
