// GET /api/datei?kanal=…&figur=…&szene=…&token=…  →  Wallpaper in voller Größe (bezahltes Paket)
// Liefert nur mit gültigem Freischalt-Token; Dateien liegen in privat/<kanal>/<figur>/<szene>.jpg (nicht öffentlich).
import fs from 'node:fs';
import path from 'node:path';
import { pruefeToken } from './_token.js';

const NAME = /^[a-z0-9-]{1,40}$/;

export default function handler(req, res) {
  const { kanal, figur, szene, token } = req.query;
  if (![kanal, figur, szene].every((x) => NAME.test(String(x ?? '')))) return res.status(400).send('Bad request');
  if (!pruefeToken(token, kanal)) return res.status(403).send('Please unlock the pack first.');
  const datei = path.join(process.cwd(), 'privat', kanal, figur, `${szene}.jpg`);
  if (!fs.existsSync(datei)) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Disposition', `attachment; filename="${kanal}-${figur}-${szene}.jpg"`);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  fs.createReadStream(datei).pipe(res);
}
