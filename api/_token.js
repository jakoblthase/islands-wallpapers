// Freischalt-Token: wer das Paket eines Kanals gekauft hat, bekommt ein signiertes Token (HMAC), gültig 365 Tage.
// Kein Konto, keine Datenbank: das Token steht nur im Browser der Käuferin bzw. des Käufers.
import crypto from 'node:crypto';

const geheim = () => {
  const g = process.env.WALLPAPER_SECRET;
  if (!g || g.length < 32) throw new Error('WALLPAPER_SECRET fehlt (mindestens 32 Zeichen, nur in Vercel eintragen).');
  return g;
};
const signiere = (text) => crypto.createHmac('sha256', geheim()).update(text).digest('base64url');

export function erstelleToken(kanal, tage = 365) {
  const bis = Math.floor(Date.now() / 1000) + tage * 86400;
  const kern = `${kanal}.${bis}`;
  return `${kern}.${signiere(kern)}`;
}

export function pruefeToken(token, kanal) {
  const teile = String(token ?? '').split('.');
  if (teile.length !== 3) return false;
  const [k, bis, sig] = teile;
  if (k !== kanal || !/^\d+$/.test(bis) || Number(bis) < Date.now() / 1000) return false;
  const soll = Buffer.from(signiere(`${k}.${bis}`));
  const ist = Buffer.from(sig);
  return soll.length === ist.length && crypto.timingSafeEqual(soll, ist);
}
