// src/app/api/_config.js
import { NextResponse } from 'next/server';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export function backendUrl(path, req) {
  // normalize path to always start with '/'
  const suffix = path.startsWith('/') ? path : `/${path}`;
  // keep the original query string (e.g. ?path=%2Fapi%2Fv1%2Fuser%2Faccounts)
  const search = req?.nextUrl?.search || '';
  return `${BACKEND_URL}${suffix}${search}`;
}

export function sessionHeaders(req) {
  const cookie = req.headers.get('cookie');
  return cookie ? { cookie } : {};
}

export function proxyInit(req, init = {}) {
  return {
    ...init,
    headers: { ...(init.headers || {}), ...sessionHeaders(req) },
    // Important: never cache auth/agent responses
    cache: 'no-store',
  };
}

export async function proxyJson(req, path, init = {}) {
  // Get the request body if it exists and hasn't been read already
  const body = (!init.bodyAlreadyRead && req.method !== 'GET' && req.method !== 'HEAD') ? await req.text() : undefined;
  
  const fetchInit = {
    method: req.method,
    ...proxyInit(req, init),
  };
  
  // Add body for non-GET requests
  // Use the provided body from init if available, otherwise use the body we just read
  if (init.body || body) {
    fetchInit.body = init.body || body;
    // Preserve content-type header
    const contentType = req.headers.get('content-type');
    if (contentType) {
      fetchInit.headers['content-type'] = contentType;
    }
  }
  
  const r = await fetch(backendUrl(path, req), fetchInit);
  const data = await r.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: r.status });

  // forward Set-Cookie from backend so the browser gets the session cookie
  const setCookie = r.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}
