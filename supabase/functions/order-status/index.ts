import { handleOptions, jsonResponse, sha256 } from '../_shared/http.ts';
import { adminRestFetch, isKnownPublicKey, readRestResponse } from '../_shared/supabase-rest.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== 'GET') return jsonResponse(request, { error: 'Method not allowed' }, 405);
  if (!isKnownPublicKey(request)) return jsonResponse(request, { error: 'API key không hợp lệ' }, 401);

  const orderId = new URL(request.url).searchParams.get('orderId') || '';
  const token = request.headers.get('x-order-token') || '';
  if (!orderId || !token) return jsonResponse(request, { error: 'Thiếu thông tin tra cứu đơn hàng.' }, 400);

  try {
    const tokenHash = await sha256(token);
    const select = 'id,code,status,payment_status,payment_reported_at,paid_at,payment_expires_at,provider_transaction_id';
    const response = await adminRestFetch(
      `orders?select=${select}&id=eq.${encodeURIComponent(orderId)}&access_token_hash=eq.${tokenHash}&limit=1`,
    );
    const orders = await readRestResponse<Array<Record<string, string | null>>>(response);
    const order = orders[0];
    if (!order) return jsonResponse(request, { error: 'Không tìm thấy đơn hàng.' }, 404);

    if (order.payment_status === 'awaiting_confirmation' && order.payment_expires_at &&
      new Date(order.payment_expires_at).getTime() < Date.now()) {
      const expireResponse = await adminRestFetch(`orders?id=eq.${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ payment_status: 'expired', status: 'cancelled', updated_at: new Date().toISOString() }),
      });
      if (expireResponse.ok) {
        order.payment_status = 'expired';
        order.status = 'cancelled';
      }
    }

    return jsonResponse(request, {
      id: order.id,
      code: order.code,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentReportedAt: order.payment_reported_at,
      paidAt: order.paid_at,
      paymentExpiresAt: order.payment_expires_at,
      providerTransactionId: order.provider_transaction_id,
    });
  } catch (error) {
    console.error('order-status failed', error);
    return jsonResponse(request, { error: 'Không thể kiểm tra trạng thái thanh toán.' }, 500);
  }
});
