// POST /api/freischalten  { kanal, schluessel }  →  { token }
// Prüft den Lizenzschlüssel aus der Gumroad-Quittung bei Gumroad (öffentliche Schnittstelle, ohne Zugangsdaten)
// und gibt ein Freischalt-Token für das Paket des Kanals zurück. Erstattete oder zurückgebuchte Käufe zählen nicht.
import { erstelleToken } from './_token.js';
import fs from 'node:fs';
import path from 'node:path';

const kanaele = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'kanaele.json'), 'utf8'));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ fehler: 'Method not allowed' });
  const { kanal, schluessel } = req.body ?? {};
  const k = kanaele[kanal];
  if (!k?.gumroadProduktId) return res.status(400).json({ fehler: 'This shop is not open yet.' });
  if (typeof schluessel !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(schluessel.trim())) {
    return res.status(400).json({ fehler: 'Please check the license key.' });
  }
  try {
    const antwort = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ product_id: k.gumroadProduktId, license_key: schluessel.trim(), increment_uses_count: 'false' }),
    });
    const d = await antwort.json().catch(() => ({}));
    const kauf = d.purchase ?? {};
    if (!d.success || kauf.refunded || kauf.chargebacked || kauf.disputed) {
      return res.status(403).json({ fehler: 'That key did not work. Please copy it exactly from your receipt.' });
    }
    return res.status(200).json({ token: erstelleToken(kanal) });
  } catch {
    return res.status(502).json({ fehler: 'We could not check the key right now. Please try again in a minute.' });
  }
}
