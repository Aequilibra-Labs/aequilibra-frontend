import { NextResponse } from 'next/server';
import { proxyJson } from '../../_config';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');

  if (!owner) {
    return NextResponse.json({ detail: 'owner is required' }, { status: 400 });
  }

  try {
    // proxyJson keeps the original query string via backendUrl()
    return await proxyJson(req, '/extended/agents', { method: 'GET' });
  } catch (err) {
    return NextResponse.json(
      { detail: 'backend unreachable', error: String(err?.message || err) },
      { status: 502 }
    );
  }
}
