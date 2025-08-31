// src/app/api/extended/challenge/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bases() {
  // Try env then sensible local fallbacks
  const env = process.env.BACKEND_URL && process.env.BACKEND_URL.trim();
  const list = [];
  if (env) list.push(env);
  list.push('http://127.0.0.1:8000', 'http://host.docker.internal:8000');
  // remove duplicates
  return [...new Set(list)];
}

export async function GET(req) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path');
  if (!path) {
    return new Response(JSON.stringify({ detail: 'Missing "path" query param' }), {
      status: 400, headers: { 'content-type': 'application/json' },
    });
  }

  const tried = [];
  for (const base of bases()) {
    const target = `${base}/extended/challenge?path=${encodeURIComponent(path)}`;
    tried.push(target);
    try {
      const r = await fetch(target, { cache: 'no-store' });
      const text = await r.text();
      return new Response(text, {
        status: r.status,
        headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
      });
    } catch (e) {
      // try next base
    }
  }
  return new Response(JSON.stringify({ detail: 'Proxy error: fetch failed', tried: tried }), {
    status: 502, headers: { 'content-type': 'application/json' },
  });
}
