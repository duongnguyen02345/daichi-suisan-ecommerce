import { handleOptions, jsonResponse, sha256 } from '../_shared/http.ts';
import { adminRestFetch, isKnownPublicKey, readRestResponse } from '../_shared/supabase-rest.ts';

interface ReportPaymentBody {
  orderId?: string;
  paymentAccessToken?: string;
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Method not allowed' }, 405);
  if (!isKnownPublicKey(request)) return jsonResponse(request, { error: 'API key không hợp lệ' }, 401);

  try {
    const body = await request.json() as ReportPaymentBody;
    const orderId = body.orderId?.trim() || '';
    const paymentAccessToken = body.paymentAccessToken?.trim() || '';
    if (!orderId || !paymentAccessToken) {
      return jsonResponse(request, { error: 'Thiếu thông tin xác thực đơn hàng.' }, 400);
    }

    const accessTokenHash = await sha256(paymentAccessToken);
    const response = await adminRestFetch('rpc/report_freshmart_order_payment', {
      method: 'POST',
      body: JSON.stringify({
        p_order_id: orderId,
        p_access_token_hash: accessTokenHash,
      }),
    });
    const result = await readRestResponse<Record<string, unknown>>(response);
    return jsonResponse(request, result);
  } catch (error) {
    console.error('report-payment failed', error);
    return jsonResponse(request, {
      error: error instanceof Error ? error.message : 'Không thể báo đã thanh toán.',
    }, 400);
  }
});
