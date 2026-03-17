# Hormuz Minesweeper

Ein browser-basiertes Minesweeper-Spiel, das auf einer stilisierten Karte der Straße von Hormuz und des Persischen Golfs spielt. Minen sind als Seeminen im Wasser versteckt.

## Spielprinzip

Klicke auf Wasserzellen, um sie aufzudecken. Vermeide die versteckten Seeminen. Markiere verdächtige Felder mit einer Flagge (Rechtsklick), um das Spielfeld zu kartieren.

**Steuerung:**
- **Linksklick** — Zelle aufdecken
- **Rechtsklick** — Flagge setzen / Fragezeichen / zurücksetzen
- **Linksklick auf aufgedeckte Zahl** — Chord-Reveal (deckt alle Nachbarn auf, wenn genug Flaggen gesetzt sind)

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
- Schiff-Cursor beim Hovern über spielbare Felder
- Persistente Bestzeiten via localStorage (Top 5 pro Schwierigkeitsgrad)
- Erster Klick ist immer sicher (keine Mine im 3×3-Bereich)
- Modernes UI im maritimen Dark-Design (Inter + JetBrains Mono)
- Versionsnummer im UI sichtbar

## Dateistruktur

```
index.html          — Startseite (Spielbeschreibung, Link zum Spiel)
minesweeper/
  index.html        — Spielseite
  game.js           — Spiellogik und Canvas-Rendering
  styles.css        — Styling (Layout, Farben, UI-Komponenten)
```

## Version

`1.0.1` — Persistent scores, UI redesign (maritime dark theme)

## Starten

`index.html` im Browser öffnen — keine Installation oder Build-Schritt erforderlich.
