import { proxyJson } from '../../../../_config';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Cancel order request body:', body);
    
    const result = await proxyJson(request, '/agents/hl/orders/cancel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      bodyAlreadyRead: true,  // Since we already read the body
    });
    
    console.log('Cancel order response status:', result.status);
    return result;
  } catch (error) {
    console.error('Cancel order API error:', error);
    return new Response(JSON.stringify({ detail: `API error: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
