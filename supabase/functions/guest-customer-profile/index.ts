import { constantTimeEqual, handleOptions, jsonResponse, sha256 } from '../_shared/http.ts';
import { adminRestFetch, isKnownPublicKey, readRestResponse } from '../_shared/supabase-rest.ts';

interface LookupBody {
  phone?: string;
  customerAccessToken?: string;
}

interface CustomerRow {
  customer_code: string;
  full_name: string;
  email: string | null;
  access_token_hash: string;
}

const normalizePhone = (value: string) => {
  const compact = value.trim().replace(/[\s().-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
};
const isValidVietnamPhone = (value: string) => /^(?:0\d{9,10}|\+84\d{9,10})$/.test(value);

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Method not allowed' }, 405);
  if (!isKnownPublicKey(request)) return jsonResponse(request, { error: 'API key không hợp lệ' }, 401);

  try {
    const body = await request.json() as LookupBody;
    const phone = normalizePhone(body.phone || '');
    if (!isValidVietnamPhone(phone) || !body.customerAccessToken) {
      return jsonResponse(request, { found: false });
    }

    const response = await adminRestFetch(
      `guest_customers?customer_code=eq.${encodeURIComponent(phone)}&select=customer_code,full_name,email,access_token_hash&limit=1`,
    );
    const customers = await readRestResponse<CustomerRow[]>(response);
    const customer = customers[0];
    const suppliedHash = await sha256(body.customerAccessToken);
    if (!customer || !constantTimeEqual(customer.access_token_hash, suppliedHash)) {
      return jsonResponse(request, { found: false });
    }

    const addressResponse = await adminRestFetch(
      `guest_customer_addresses?customer_code=eq.${encodeURIComponent(phone)}&select=id,formatted_address,latitude,longitude,times_used,last_used_at&order=last_used_at.desc&limit=5`,
    );
    const addresses = await readRestResponse<Array<Record<string, unknown>>>(addressResponse);
    return jsonResponse(request, {
      found: true,
      customerCode: customer.customer_code,
      name: customer.full_name,
      email: customer.email || '',
      addresses: addresses.map((address) => ({
        id: String(address.id),
        formattedAddress: String(address.formatted_address),
        latitude: address.latitude == null ? undefined : Number(address.latitude),
        longitude: address.longitude == null ? undefined : Number(address.longitude),
        timesUsed: Number(address.times_used || 1),
        lastUsedAt: String(address.last_used_at),
      })),
    });
  } catch (error) {
    console.error('guest-customer-profile failed', error);
    return jsonResponse(request, { error: 'Không thể tra cứu thông tin khách hàng.' }, 400);
  }
});
