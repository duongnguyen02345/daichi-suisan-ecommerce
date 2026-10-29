import { constantTimeEqual, handleOptions, jsonResponse } from '../_shared/http.ts';
import { adminRestFetch, isKnownPublicKey, readRestResponse } from '../_shared/supabase-rest.ts';

const toPublicAccount = (row: Record<string, unknown>) => ({
  id: row.id,
  bankId: row.bank_id,
  bankName: row.bank_name,
  accountNumber: row.account_number,
  accountName: row.account_name,
  isActive: row.is_active,
  updatedAt: row.updated_at,
});

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (!isKnownPublicKey(request)) return jsonResponse(request, { error: 'API key không hợp lệ' }, 401);

  try {
    if (request.method === 'GET') {
      const response = await adminRestFetch(
        'bank_accounts?select=id,bank_id,bank_name,account_number,account_name,is_active,updated_at&is_active=eq.true&order=updated_at.desc&limit=1',
      );
      const rows = await readRestResponse<Array<Record<string, unknown>>>(response);
      return jsonResponse(request, { bankAccount: rows[0] ? toPublicAccount(rows[0]) : null });
    }

    if (request.method === 'PUT') {
      const expectedKey = Deno.env.get('FRESHMART_ADMIN_SETUP_KEY') || '';
      const suppliedKey = request.headers.get('x-admin-key') || '';
      if (!expectedKey || !constantTimeEqual(suppliedKey, expectedKey)) {
        return jsonResponse(request, { error: 'Khóa quản trị thanh toán không hợp lệ.' }, 401);
      }
      const body = await request.json() as Record<string, unknown>;
      const response = await adminRestFetch('rpc/save_freshmart_bank_account', {
        method: 'POST',
        body: JSON.stringify({
          p_bank_id: body.bankId,
          p_bank_name: body.bankName,
          p_account_number: body.accountNumber,
          p_account_name: body.accountName,
          p_is_active: Boolean(body.isActive),
        }),
      });
      const account = await readRestResponse<Record<string, unknown>>(response);
      return jsonResponse(request, { bankAccount: toPublicAccount(account) });
    }

    return jsonResponse(request, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('bank-settings failed', error);
    return jsonResponse(request, {
      error: error instanceof Error ? error.message : 'Không thể xử lý cấu hình ngân hàng.',
    }, 400);
  }
});
