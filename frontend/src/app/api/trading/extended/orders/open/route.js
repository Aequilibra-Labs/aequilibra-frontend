import { proxyJson } from '../../../../_config';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json();
  // Extended uses /trade endpoint for opening orders
  return proxyJson(request, '/extended/trade', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
