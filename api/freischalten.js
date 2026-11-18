// POST /api/freischalten  { kanal, schluessel }  →  { token }
// Prüft den Lizenzschlüssel aus der Gumroad-Quittung bei Gumroad (öffentliche Schnittstelle, ohne Zugangsdaten)
// und gibt ein Freischalt-Token für das Paket des Kanals zurück. Erstattete oder zurückgebuchte Käufe zählen nicht.
// Je Schlüssel höchstens GERAETE Freischaltungen; eine neue Eingabe auf demselben Gerät (z. B. nach dem Löschen der Browserdaten) zählt mit.
import { erstelleToken } from './_token.js';
import fs from 'node:fs';
import path from 'node:path';

const kanaele = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'kanaele.json'), 'utf8'));

/** Ein Schlüssel schaltet höchstens so viele Geräte (genauer: Freischaltungen) frei (Jakob, 2026-11-18). Gumroad zählt mit. */
const GERAETE = 3;
/** Eine Freischaltung gilt so lange im Browser; lang, damit dasselbe Gerät nicht jedes Jahr eine neue Freischaltung verbraucht. */
const GUELTIG_TAGE = 5 * 365;
const KONTAKT = 'jakoblthase95@gmail.com';

/** Fragt Gumroad nach dem Schlüssel. `zaehlen` erhöht dort den Zähler der Nutzungen. */
async function pruefe(produktId, schluessel, zaehlen) {
  const antwort = await fetch('https://api.gumroad.com/v2/licenses/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ product_id: produktId, license_key: schluessel, increment_uses_count: String(zaehlen) }),
  });
  const d = await antwort.json().catch(() => ({}));
  const kauf = d.purchase ?? {};
  return { gueltig: !!d.success && !kauf.refunded && !kauf.chargebacked && !kauf.disputed, nutzungen: Number(d.uses ?? 0) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ fehler: 'Method not allowed' });
  const { kanal, schluessel } = req.body ?? {};
  const k = kanaele[kanal];
  if (!k?.gumroadProduktId) return res.status(400).json({ fehler: 'This shop is not open yet.' });
  if (typeof schluessel !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(schluessel.trim())) {
    return res.status(400).json({ fehler: 'Please check the license key.' });
  }
  try {
    // Erst nur nachsehen (zählt nicht mit), dann bei Erfolg eine Freischaltung zählen.
    const erst = await pruefe(k.gumroadProduktId, schluessel.trim(), false);
    if (!erst.gueltig) return res.status(403).json({ fehler: 'That key did not work. Please copy it exactly from your receipt.' });
    if (erst.nutzungen >= GERAETE) {
      return res.status(403).json({ fehler: `This key is already unlocked on ${GERAETE} devices. New phone? Write to ${KONTAKT} and we will help.` });
    }
    const dann = await pruefe(k.gumroadProduktId, schluessel.trim(), true);
    if (!dann.gueltig) return res.status(403).json({ fehler: 'That key did not work. Please copy it exactly from your receipt.' });
    return res.status(200).json({ token: erstelleToken(kanal, GUELTIG_TAGE) });
  } catch {
    return res.status(502).json({ fehler: 'We could not check the key right now. Please try again in a minute.' });
  }
}
