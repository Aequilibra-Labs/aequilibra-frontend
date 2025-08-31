export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
const bases = () => [...new Set([process.env.BACKEND_URL, 'http://127.0.0.1:8000', 'http://host.docker.internal:8000'].filter(Boolean))];

export async function POST(req) {
  const body = await req.text();
  for (const base of bases()) {
    try {
      const r = await fetch(`${base}/extended/ensure-account`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
      return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
    } catch {}
  }
  return new Response(JSON.stringify({ detail: 'Proxy error' }), { status: 502, headers: { 'content-type': 'application/json' } });
}
