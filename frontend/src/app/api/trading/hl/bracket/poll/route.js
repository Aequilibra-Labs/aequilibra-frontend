import { proxyJson } from '../../../../../_config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return proxyJson(request, '/agents/hl/bracket/poll', {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
  });
}