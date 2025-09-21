import { proxyJson } from '../../../../_config';

export async function POST(request) {
  const body = await request.json();
  return proxyJson(request, '/agents/hl/bracket/modify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    bodyAlreadyRead: true,
  });
}