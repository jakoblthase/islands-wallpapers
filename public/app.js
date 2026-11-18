// Wallpaper-Seite für einen TikTok-Kanal. Jede Kanal-Seite (public/<kanal>/index.html) setzt window.KANAL und lädt dieses Skript.
// Daten: ./manifest.json (aus dem Repository tiktok, werkzeug/wallpaper.mjs) und /kanaele.json (Bezahlung je Kanal).
// Ablauf: Figur suchen → antippen → Gratis-Wallpaper laden; Paket über Gumroad kaufen, mit dem Lizenzschlüssel freischalten.

const $ = (sel, el = document) => el.querySelector(sel);
const h = (tag, attrs = {}, ...kinder) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kind of kinder.flat()) if (kind != null) el.append(kind);
  return el;
};
const speicher = {
  lies(k) { try { return localStorage.getItem(k); } catch { return null; } },
  schreib(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* privat, egal */ } },
};
const BASIS = `/${window.KANAL}/`;
const normal = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');

const [manifest, kanaele] = await Promise.all([
  fetch(`${BASIS}manifest.json`).then((r) => r.json()),
  fetch('/kanaele.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
]);
const kauf = kanaele[window.KANAL] ?? {};
const T = manifest.seite;
const F = T.farben;
document.documentElement.style.cssText += `--hg:${F.hintergrund};--karte:${F.karte};--text:${F.text};--leise:${F.leise};--akzent:${F.akzent};--akzent-text:${F.akzentText}`;
document.title = `${manifest.titel} · Wallpapers`;

const app = $('#app');
const tokenSchluessel = `token:${window.KANAL}`;
let token = speicher.lies(tokenSchluessel);

function zeige() {
  const id = new URLSearchParams(location.search).get('f');
  const figur = manifest.figuren.find((f) => f.id === id);
  app.replaceChildren(figur ? detail(figur) : uebersicht());
  window.scrollTo(0, 0);
}
function geheZu(id) {
  history.pushState(null, '', id ? `?f=${encodeURIComponent(id)}` : BASIS);
  zeige();
}
addEventListener('popstate', zeige);

function uebersicht() {
  const gitter = h('div', { class: 'gitter' });
  const leer = h('p', { class: 'leer', hidden: true }, 'No islander with that name yet.');
  const fuelle = (q) => {
    const n = normal(q);
    const treffer = manifest.figuren.filter((f) => !n || normal(f.name).includes(n));
    gitter.replaceChildren(...treffer.map((f) => h('button', { class: 'kachel', type: 'button', onclick: () => geheZu(f.id) },
      h('img', { src: `${BASIS}${f.id}/portraet.jpg`, alt: f.name, loading: 'lazy', width: 600, height: 750 }),
      h('span', { class: 'name', style: `--farbe:${f.farbe}` }, f.name),
    )));
    leer.hidden = treffer.length > 0;
  };
  const suche = h('input', { type: 'search', placeholder: T.suche, 'aria-label': T.suche, autocomplete: 'off', oninput: (e) => fuelle(e.target.value) });
  fuelle('');
  return h('main', {},
    h('header', { class: 'kopf' },
      h('p', { class: 'kanal' }, manifest.handle),
      h('h1', {}, T.ueberschrift),
      h('div', { class: 'suche' }, suche),
    ),
    gitter,
    leer,
    h('p', { class: 'hinweis' }, T.nichtGefunden),
  );
}

function detail(f) {
  const gratis = manifest.szenen.find((s) => s.gratis);
  const paket = manifest.szenen;
  const frei = !!token;
  const preis = kauf.preis ?? '';
  return h('main', { class: 'detail' },
    h('button', { class: 'zurueck', type: 'button', onclick: () => geheZu(null) }, '‹ All islanders'),
    h('h1', {}, f.name),
    h('p', { class: 'leise' }, `${manifest.titel} · on the island since episode ${String(f.seit).replace(/\D+/g, '')}`),
    h('figure', { class: 'gross' }, h('img', { src: `${BASIS}${f.id}/gratis.jpg`, alt: `${f.name} · ${gratis.titel}`, width: manifest.breite, height: manifest.hoehe })),
    h('a', { class: 'knopf', href: `${BASIS}${f.id}/gratis.jpg`, download: `${manifest.kanal}-${f.id}.jpg` }, 'Download free wallpaper'),
    h('section', { class: 'paket' },
      h('h2', {}, frei ? 'Your wallpaper pack' : `Wallpaper pack${preis ? ' · ' + preis : ''}`),
      h('p', { class: 'leise' }, frei ? 'All scenes in full size, without the channel name.' : `${paket.length} scenes in full size, without the channel name. One purchase unlocks the pack for every islander.`),
      h('div', { class: 'szenen' }, paket.map((s) => h('div', { class: 'szene' },
        h('img', { src: `${BASIS}${f.id}/vorschau-${s.id}.jpg`, alt: s.titel, loading: 'lazy', width: 430, height: Math.round((430 * manifest.hoehe) / manifest.breite) }),
        h('span', {}, s.titel),
        frei ? h('a', { class: 'knopf klein', href: `/api/datei?kanal=${manifest.kanal}&figur=${f.id}&szene=${s.id}&token=${encodeURIComponent(token)}`, download: `${manifest.kanal}-${f.id}-${s.id}.jpg` }, 'Download') : null,
      ))),
      frei ? null : kaufen(),
    ),
    h('p', { class: 'hinweis' }, 'Your name is on the island because you commented “I’m moving in!”. ',
      h('a', { href: '/datenschutz.html#entfernen' }, 'Remove my islander from this page')),
  );
}

function kaufen() {
  const meldung = h('p', { class: 'meldung', role: 'status' });
  const feld = h('input', { type: 'text', placeholder: 'License key from your receipt', 'aria-label': 'License key', autocomplete: 'off' });
  const freischalten = h('button', { class: 'knopf zweit', type: 'submit' }, 'Unlock');
  const form = h('form', { class: 'schluessel', onsubmit: async (e) => {
    e.preventDefault();
    if (!feld.value.trim()) return;
    freischalten.setAttribute('aria-busy', 'true');
    freischalten.disabled = true;
    meldung.textContent = '';
    try {
      const r = await fetch('/api/freischalten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kanal: manifest.kanal, schluessel: feld.value.trim() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.fehler || 'That key did not work.');
      token = d.token;
      speicher.schreib(tokenSchluessel, token);
      zeige();
    } catch (err) {
      meldung.textContent = err.message;
    } finally {
      freischalten.removeAttribute('aria-busy');
      freischalten.disabled = false;
    }
  } }, feld, freischalten);
  const kaufLink = kauf.gumroad
    ? h('a', { class: 'knopf gumroad-button', href: `${kauf.gumroad}?wanted=true`, 'data-gumroad-overlay-checkout': 'true' }, `Get the pack${kauf.preis ? ' · ' + kauf.preis : ''}`)
    : h('button', { class: 'knopf', type: 'button', disabled: true }, 'Coming soon');
  return h('div', { class: 'kauf' }, kaufLink, h('p', { class: 'leise klein' }, 'Already bought? Enter the license key from your receipt:'), form, meldung);
}

if (kauf.gumroad) document.head.append(h('script', { src: 'https://gumroad.com/js/gumroad.js', async: true }));
zeige();
