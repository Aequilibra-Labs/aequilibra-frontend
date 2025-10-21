// src/app/api/auth/verify/route.js
import { proxyJson } from '../../_config';

export const dynamic = 'force-dynamic'; // avoid caching, optional but helpful

export async function POST(request) {
  return proxyJson(request, '/auth/verify');
}
