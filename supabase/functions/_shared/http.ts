const defaultOrigins = [
  'https://freshmart-market-2026.web.app',
  'https://freshmart-market-2026.firebaseapp.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

const configuredOrigins = () =>
  (Deno.env.get('ALLOWED_ORIGINS') || defaultOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const corsHeaders = (request: Request) => {
  const origin = request.headers.get('origin');
  const allowedOrigins = configuredOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-admin-key, x-order-token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

export const jsonResponse = (
  request: Request,
  payload: unknown,
  status = 200,
) => new Response(JSON.stringify(payload), {
  status,
  headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' },
});

export const handleOptions = (request: Request) =>
  request.method === 'OPTIONS'
    ? new Response('ok', { headers: corsHeaders(request) })
    : null;

export const constantTimeEqual = (left: string, right: string) => {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] || 0) ^ (b[index] || 0);
  }
  return difference === 0;
};

export const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};
