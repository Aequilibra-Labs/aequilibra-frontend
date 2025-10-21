// src/app/api/trading/extended/orders/market-close/route.js
import { proxyJson } from '../../../../_config';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json();
  return proxyJson(request, '/extended/orders/market-close', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
