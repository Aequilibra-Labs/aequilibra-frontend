import { NextResponse } from 'next/server';
import { proxyJson } from '../../../../_config';

export async function POST(req) {
  try {
    return await proxyJson(req, '/agents/hl/bracket/preview', { method: 'POST' });
  } catch (err) {
    return NextResponse.json(
      { detail: 'backend unreachable', error: String(err?.message || err) },
      { status: 502 }
    );
  }
}