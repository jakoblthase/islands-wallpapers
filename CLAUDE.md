# CLAUDE.md

**islands-wallpapers**: Website, auf der Zuschauer der TikTok-Kanäle von Jakob ihre Figur suchen und als Handy-Wallpaper laden. Link in der Bio des Kanals. Gebaut als Rahmen für mehrere Kanäle; heute nur Animated Islands.

Jakob ist Gründer, kein Entwickler. Entscheidungen und Ergebnisse auf Deutsch, verständlich und kurz erklären. **Alles auf der Seite ist Englisch** (wie die Kanäle); diese Doku bleibt deutsch.

## Wie es zusammenhängt

- **Bilder kommen nur aus dem Repository `jakoblthase/tiktok`**: `node werkzeug/wallpaper.mjs <kanal> --ziel ../islands-wallpapers` rendert jede Figur aus dem Figurenblatt des Kanals in jeder Szene und kopiert sie hierher. Nichts wird hier gezeichnet oder generiert. Neue Figur in einer Folge = Werkzeug neu laufen lassen, committen, fertig. Regeln dort: `docs/wallpaper.md`.
- `public/<kanal>/`: öffentlich. `manifest.json` (Figuren, Szenen, Texte, Farben), je Figur `portraet.jpg` (Fotostudio, Kachel), `portraet.mp4`/`.webm` (kurze Winke-Schleife; läuft nur, solange die Kachel sichtbar ist, und nie bei „weniger Bewegung“), `gratis.jpg` (Gratis-Wallpaper mit Namen und kleinem Kanalnamen), `vorschau-<szene>.jpg`.
- `privat/<kanal>/`: das bezahlte Paket in voller Größe, **nie öffentlich**; nur über `api/datei.js` mit gültigem Freischalt-Token.
- `public/app.js`, `public/style.css`: eine Seite für alle Kanäle; `public/<kanal>/index.html` setzt nur `window.KANAL`.
- `public/kanaele.json`: Preis und Gumroad je Kanal (`gumroad` = Produkt-Link, `gumroadProduktId` = Produkt-ID). Leer = Kaufknopf zeigt „Coming soon“.
- `api/freischalten.js`: prüft den Lizenzschlüssel aus der Gumroad-Quittung bei Gumroad und gibt ein signiertes Token (365 Tage) zurück. `api/datei.js`: liefert eine Datei aus `privat/` nur mit Token. `api/_token.js`: Signatur mit `WALLPAPER_SECRET` (nur in Vercel, nie im Repository).

## Neuer Kanal

1. Im Repository tiktok: `kanaele/<kanal>/wallpaper/katalog.mjs` und eine Szene anlegen (Vorlage: Animated Islands), Werkzeug laufen lassen.
2. Hier: `public/<kanal>/index.html` (Kopie, `window.KANAL` ändern), Eintrag in `public/kanaele.json`, Umschreibung in `vercel.json` (`/<kanal>` → `/<kanal>/index.html`).
3. Eigenes Gumroad-Produkt je Kanal (mit Lizenzschlüsseln).

## Regeln

- **Bezahlung über Gumroad als Verkäufer** (Merchant of Record): Gumroad kümmert sich um Mehrwertsteuer und Quittung. Ein Kauf schaltet das Paket eines Kanals für alle Figuren frei.
- **Einziehen bleibt kostenlos.** Wer zahlt, bekommt in den Folgen keinen Vorteil; das Paket ist ein Andenken.
- **Nur TikTok-Namen, nie Klarnamen.** Wer nicht auf der Seite stehen will, wird auf Zuruf entfernt (Eintrag aus dem Katalog im tiktok-Repository nehmen bzw. Figur dort ausblenden, neu rendern).
- Keine Cookies, kein Tracking, keine Konten. Das Freischalt-Token steht nur im Browser.
- **Impressum und Datenschutz** haben Platzhalter (`[NAME]`, `[ANSCHRIFT]`, `[E-MAIL]`). Vor dem Live-Gang von Jakob ausfüllen lassen; vorher nicht in die Bio.
- Schrift Lilita One (SIL Open Font License) liegt in `public/schrift/`.
- Je Schritt ein Branch und ein Pull Request; Jakob gibt frei. Nichts veröffentlichen ohne Jakobs Freigabe.
- Links auf Dateien immer als GitHub-Link mit Branch.
