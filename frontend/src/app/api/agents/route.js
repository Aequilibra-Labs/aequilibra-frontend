import { NextResponse } from 'next/server';

const BASE = process.env.BACKEND_URL?.replace(/\/$/, '');

export async function POST(req) {
  if (!BASE) return new NextResponse('BACKEND_URL is not set', { status: 500 });

  const body = await req.json().catch(() => ({}));
  const isApprove = body && body.action === 'approve';
  const path = isApprove ? '/hl/agent/approve' : '/hl/agent/new';

  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') || 'application/json' },
  });
}

export async function GET() {
  if (!BASE) return NextResponse.json({ ok: false, error: 'BACKEND_URL is not set' }, { status: 500 });
  const r = await fetch(`${BASE}/health`);
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}
