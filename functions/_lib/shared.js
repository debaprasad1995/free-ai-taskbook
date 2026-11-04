/* Cloudflare Pages request helpers. Public Supabase publishable key only. */
export const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const safeHttps = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
export function origin(env, request) {
  const configured = safeHttps(env.SITE_URL || '');
  return configured ? new URL(configured).origin : new URL(request.url).origin;
}
export function response(body, status=200, contentType='text/html; charset=utf-8', maxAge=300) {
  return new Response(body, { status, headers: {
    'content-type': contentType,
    'cache-control': maxAge ? `public, max-age=${maxAge}, s-maxage=${maxAge}` : 'no-store',
    'x-content-type-options':'nosniff',
    'referrer-policy':'strict-origin-when-cross-origin',
    'x-robots-tag': status === 200 ? 'index, follow' : 'noindex, nofollow'
  }});
}
export function page({title,description,canonical,body,jsonld}) {
  const json=jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g,'\\u003c')}</script>`:'';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | FreeAITaskbook</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><link rel="stylesheet" href="/assets/styles.css">${json}</head><body><header class="site-header"><div class="wrap header-inner"><a class="brand" href="/">FreeAITaskbook</a><nav class="main-nav"><a href="/search/">Search</a><a href="/resources/">Resources</a><a href="/jobs/">Jobs</a></nav></div></header><main class="wrap article section">${body}</main><footer class="site-footer"><div class="wrap"><a href="/">FreeAITaskbook</a> · <a href="/privacy/">Privacy</a></div></footer></body></html>`;
}
export async function rows(env,table,params, max=1000){
  const base=safeHttps(env.SUPABASE_URL||'');
  const key=env.SUPABASE_PUBLISHABLE_KEY;
  if(!base || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(base) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key||'')) throw Error('Public catalog backend is not configured');
  const url=`${base.replace(/\/$/,'')}/rest/v1/${table}?${params}`;
  const r=await fetch(url,{headers:{apikey:key,accept:'application/json','Range':`0-${max-1}`},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error(`Catalog read failed (${r.status})`);
  const data=await r.json();if(!Array.isArray(data))throw Error('Invalid catalog response');return data;
}
export const errorPage = () => response('<!doctype html><title>Temporarily unavailable</title><h1>Temporarily unavailable</h1><p>Try again shortly.</p>',503,'text/html; charset=utf-8',0);
