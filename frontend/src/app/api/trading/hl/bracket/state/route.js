import { proxyJson } from '../../../../../_config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return proxyJson(request, '/agents/hl/bracket/state', {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
  });
}