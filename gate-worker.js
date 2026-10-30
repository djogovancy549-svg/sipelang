/** v2
 * SIPELANG – Gerbang login untuk Cloudflare Worker (sipelang.djogovancy549.workers.dev)
 *
 * Variabel di Worker (Settings → Variables):
 *   AUTH_GAS_URL = URL deploy Web App "Auth Gateway" (…/exec)         [teks biasa]
 *   GATE_SECRET  = nilai GATE_SECRET dari sheet Config                 [Secret / terenkripsi]
 *
 * Cara pakai: pindahkan SELURUH kode Worker lama Anda ke dalam objek APP di bawah
 * (isi fungsi fetch lama Anda). Gerbang akan membungkusnya.
 *
 * Link ke aplikasi lain di dalam Worker lama, ubah menjadi:
 *   https://unggahsipelang.pages.dev/  →  /go/unggah
 *   …/exec (Apps Script upload)        →  /go/gas
 * Link /go/<key> otomatis membawa tiket login sehingga tidak perlu login ulang.
 * Tombol keluar: arahkan ke /__logout
 */

const APP = {
  async fetch(request, env, ctx) {
    // sajikan situs OPTIMA.DOK (hasil build Vite di folder dist) setelah lolos login
    return env.ASSETS.fetch(request);
  }
};

/* ----------------------------- GERBANG ----------------------------- */
const COOKIE = 'sp_session';
const memo = new Map(); // cache verifikasi 60 detik per isolate

async function gas(env, payload) {
  const r = await fetch(env.AUTH_GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: env.GATE_SECRET, ...payload }),
    redirect: 'follow'
  });
  try { return await r.json(); } catch (e) { return { ok: false }; }
}

function getCookie(req, name) {
  const m = (req.headers.get('Cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

async function verify(env, token) {
  const hit = memo.get(token);
  if (hit && hit.exp > Date.now()) return hit.user;
  const r = await gas(env, { action: 'verify', token });
  if (r && r.ok) { memo.set(token, { user: r.user, exp: Date.now() + 60000 }); return r.user; }
  memo.delete(token);
  return null;
}

function toLogin(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD')
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  return Response.redirect(env.AUTH_GAS_URL + '?return=' + encodeURIComponent(request.url), 302);
}

const clearCookie = COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1) tukar tiket → cookie sesi
    if (url.pathname === '/__auth') {
      const r = await gas(env, { action: 'exchange', ticket: url.searchParams.get('ticket') || '' });
      if (!r.ok) return Response.redirect(env.AUTH_GAS_URL + '?return=' + encodeURIComponent(url.origin + '/'), 302);
      let next = url.searchParams.get('next') || '/';
      if (!next.startsWith('/') || next.startsWith('//')) next = '/';
      const maxAge = Math.max(60, Math.floor((r.exp - Date.now()) / 1000));
      return new Response(null, { status: 302, headers: {
        Location: next, 'Cache-Control': 'no-store',
        'Set-Cookie': `${COOKIE}=${r.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
      } });
    }

    // 2) keluar
    if (url.pathname === '/__logout') {
      const t = getCookie(request, COOKIE);
      if (t) { memo.delete(t); await gas(env, { action: 'logout', token: t }); }
      return new Response(null, { status: 302, headers: { Location: env.AUTH_GAS_URL, 'Set-Cookie': clearCookie, 'Cache-Control': 'no-store' } });
    }

    // 3) semua yang lain wajib login
    const token = getCookie(request, COOKIE);
    const user = token ? await verify(env, token) : null;
    if (!user) return toLogin(request, env);

    // 4) /go/<key> → buka aplikasi lain membawa tiket
    if (url.pathname.startsWith('/go/')) {
      const r = await gas(env, { action: 'launch', token, key: url.pathname.slice(4).replace(/\/+$/, '') });
      return r.ok ? Response.redirect(r.url, 302) : new Response('Tautan tidak tersedia.', { status: 404 });
    }

    // 5) aplikasi asli
    const res = await APP.fetch(request, env, ctx);
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'private, no-store');
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  }
};
