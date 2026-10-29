import { constantTimeEqual, jsonResponse } from '../_shared/http.ts';
import { adminRestFetch, readRestResponse } from '../_shared/supabase-rest.ts';

const signPayload = async (secret: string, value: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse(request, { success: false }, 405);

  try {
    const secret = Deno.env.get('SEPAY_WEBHOOK_SECRET') || '';
    const timestamp = request.headers.get('x-sepay-timestamp') || '';
    const receivedSignature = request.headers.get('x-sepay-signature') || '';
    const timestampSeconds = Number(timestamp);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!secret || !Number.isFinite(timestampSeconds) || Math.abs(nowSeconds - timestampSeconds) > 300) {
      return jsonResponse(request, { success: false }, 401);
    }

    const rawBody = await request.text();
    const expectedSignature = `sha256=${await signPayload(secret, `${timestamp}.${rawBody}`)}`;
    if (!constantTimeEqual(receivedSignature, expectedSignature)) {
      return jsonResponse(request, { success: false }, 401);
    }

    const payload = JSON.parse(rawBody);
    const response = await adminRestFetch('rpc/process_sepay_webhook', {
      method: 'POST',
      body: JSON.stringify({ p_payload: payload }),
    });
    const result = await readRestResponse<Record<string, unknown>>(response);
    console.log('SePay webhook processed', result);
    return jsonResponse(request, { success: true });
  } catch (error) {
    console.error('sepay-webhook failed', error);
    return jsonResponse(request, { success: false }, 500);
  }
});
