/** Pure validation helpers for permitted Greenhouse job-board ingestion. */
export function supabaseWriteHeaders(key) {
  if (typeof key !== 'string' || !(key.startsWith('sb_secret_') || key.startsWith('eyJ'))) throw Error('Server-only Supabase key is missing or invalid');
  const headers = {apikey:key,'Content-Type':'application/json',Accept:'application/json'};
  // Modern sb_secret_ API keys aren't JWTs. Only legacy service_role keys use Bearer.
  if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  return headers;
}
export function greenhouseJobUrl(value) {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    // Greenhouse permits employer-hosted custom HTTPS job posting links.
    // The URL comes from a verified board's authoritative public API, not user input.
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !host.includes('.')) return null;
    if (/^(localhost|.*\.localhost|.*\.local|127\.|10\.|192\.168\.|169\.254\.|0\.|::1|\[::1\])/.test(host)) return null;
    return u.toString();
  } catch { return null; }
}
