import { constantTimeEqual, handleOptions, jsonResponse, sha256 } from '../_shared/http.ts';
import { adminRestFetch, isKnownPublicKey, readRestResponse } from '../_shared/supabase-rest.ts';

interface CreateOrderBody {
  items?: Array<{ productId?: string; quantity?: number }>;
  paymentMethod?: 'cod' | 'bank_transfer';
  couponCode?: string;
  recipientName?: string;
  phone?: string;
  email?: string;
  deliveryLocation?: { formattedAddress?: string; latitude?: number; longitude?: number };
  deliveryMode?: 'immediate' | 'scheduled';
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  note?: string;
  customerAccessToken?: string;
  guestCheckout?: boolean;
}

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const normalizePhone = (value: string) => {
  const compact = value.trim().replace(/[\s().-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
};
const isValidVietnamPhone = (value: string) => /^(?:0\d{9,10}|\+84\d{9,10})$/.test(value);
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const vietnamDateId = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);

const buildQrUrl = (bank: Record<string, string>, amount: number, reference: string) => {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: reference,
    accountName: bank.accountName,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bankId)}-${encodeURIComponent(bank.accountNumber)}-compact2.png?${params.toString()}`;
};

interface GuestCustomerRow {
  customer_code: string;
  full_name: string;
  access_token_hash: string;
  order_count: number;
}

const saveGuestCustomer = async (
  body: CreateOrderBody,
  orderId: string,
  recipientName: string,
  phone: string,
  email: string,
  address: string,
) => {
  const lookupResponse = await adminRestFetch(
    `guest_customers?customer_code=eq.${encodeURIComponent(phone)}&select=customer_code,full_name,access_token_hash,order_count&limit=1`,
  );
  const customers = await readRestResponse<GuestCustomerRow[]>(lookupResponse);
  const existing = customers[0];
  const suppliedHash = body.customerAccessToken ? await sha256(body.customerAccessToken) : '';
  const hasProfileAccess = Boolean(existing && suppliedHash && constantTimeEqual(existing.access_token_hash, suppliedHash));
  let issuedToken = '';
  let canSaveAddress = hasProfileAccess;

  if (!existing) {
    issuedToken = randomToken();
    const insertResponse = await adminRestFetch('guest_customers', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        customer_code: phone,
        full_name: recipientName,
        email: email || null,
        access_token_hash: await sha256(issuedToken),
        order_count: 1,
        first_order_id: orderId,
        last_order_id: orderId,
      }),
    });
    if (!insertResponse.ok) {
      // A concurrent first order may have created the same phone profile.
      issuedToken = '';
    } else {
      canSaveAddress = true;
    }
  } else {
    const patch = hasProfileAccess
      ? {
          full_name: recipientName,
          email: email || null,
          order_count: Number(existing.order_count || 0) + 1,
          last_order_id: orderId,
          updated_at: new Date().toISOString(),
        }
      : {
          order_count: Number(existing.order_count || 0) + 1,
          last_order_id: orderId,
          updated_at: new Date().toISOString(),
        };
    const updateResponse = await adminRestFetch(`guest_customers?customer_code=eq.${encodeURIComponent(phone)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    if (!updateResponse.ok) throw new Error('Không thể cập nhật hồ sơ khách hàng.');
  }

  if (canSaveAddress) {
    const addressHash = await sha256(address.toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim());
    const addressLookup = await adminRestFetch(
      `guest_customer_addresses?customer_code=eq.${encodeURIComponent(phone)}&address_hash=eq.${addressHash}&select=id,times_used&limit=1`,
    );
    const addresses = await readRestResponse<Array<{ id: string; times_used: number }>>(addressLookup);
    const savedAddress = addresses[0];
    if (savedAddress) {
      const updateAddressResponse = await adminRestFetch(`guest_customer_addresses?id=eq.${encodeURIComponent(savedAddress.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          formatted_address: address,
          latitude: body.deliveryLocation?.latitude ?? null,
          longitude: body.deliveryLocation?.longitude ?? null,
          times_used: Number(savedAddress.times_used || 0) + 1,
          last_used_at: new Date().toISOString(),
        }),
      });
      if (!updateAddressResponse.ok) throw new Error('Không thể cập nhật địa chỉ khách hàng.');
    } else {
      const insertAddressResponse = await adminRestFetch('guest_customer_addresses', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          customer_code: phone,
          formatted_address: address,
          address_hash: addressHash,
          latitude: body.deliveryLocation?.latitude ?? null,
          longitude: body.deliveryLocation?.longitude ?? null,
        }),
      });
      if (!insertAddressResponse.ok) throw new Error('Không thể lưu địa chỉ khách hàng.');
    }
  }

  return issuedToken || undefined;
};

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Method not allowed' }, 405);
  if (!isKnownPublicKey(request)) return jsonResponse(request, { error: 'API key không hợp lệ' }, 401);

  try {
    const body = await request.json() as CreateOrderBody;
    const recipientName = body.recipientName?.trim() || '';
    const phone = normalizePhone(body.phone || '');
    const address = body.deliveryLocation?.formattedAddress?.trim() || '';
    const email = body.email?.trim() || '';
    const deliveryMode = body.deliveryMode === 'scheduled' ? 'scheduled' : 'immediate';
    const deliveryDate = deliveryMode === 'immediate' ? vietnamDateId() : body.deliveryDate || '';
    const deliveryTimeSlot = deliveryMode === 'immediate' ? 'Giao ngay' : body.deliveryTimeSlot || '';

    if (!body.items?.length || !body.paymentMethod) {
      return jsonResponse(request, { error: 'Thông tin đơn hàng chưa đầy đủ.' }, 400);
    }
    if (recipientName.length < 2 || recipientName.length > 80) {
      return jsonResponse(request, { error: 'Vui lòng nhập đầy đủ họ và tên người nhận.' }, 400);
    }
    if (!isValidVietnamPhone(phone)) {
      return jsonResponse(request, { error: 'Số điện thoại người nhận không hợp lệ.' }, 400);
    }
    if (address.length < 10 || address.length > 250) {
      return jsonResponse(request, { error: 'Vui lòng nhập địa chỉ nhận hàng đầy đủ.' }, 400);
    }
    if (email && !isValidEmail(email)) {
      return jsonResponse(request, { error: 'Địa chỉ email không hợp lệ.' }, 400);
    }
    if (deliveryMode === 'scheduled') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || !/^\d{2}:\d{2}$/.test(deliveryTimeSlot)) {
        return jsonResponse(request, { error: 'Ngày hoặc thời gian hẹn giao không hợp lệ.' }, 400);
      }
      const scheduledAt = new Date(`${deliveryDate}T${deliveryTimeSlot}:00+07:00`).getTime();
      const latestDate = vietnamDateId(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      if (!Number.isFinite(scheduledAt) || scheduledAt < Date.now() + 30 * 60 * 1000 || deliveryDate > latestDate) {
        return jsonResponse(request, { error: 'Thời gian hẹn giao phải sau ít nhất 30 phút và không quá 30 ngày.' }, 400);
      }
    }

    const paymentAccessToken = randomToken();
    const accessTokenHash = await sha256(paymentAccessToken);
    const rpcResponse = await adminRestFetch('rpc/create_freshmart_order', {
      method: 'POST',
      body: JSON.stringify({
        p_items: body.items,
        p_payment_method: body.paymentMethod,
        p_coupon_code: body.couponCode || null,
        p_recipient_name: recipientName,
        p_phone: phone,
        p_email: email || null,
        p_address: address,
        p_latitude: body.deliveryLocation.latitude ?? null,
        p_longitude: body.deliveryLocation.longitude ?? null,
        p_delivery_date: deliveryDate,
        p_delivery_time_slot: deliveryTimeSlot,
        p_note: body.note || null,
        p_access_token_hash: accessTokenHash,
        p_customer_id: null,
      }),
    });
    const order = await readRestResponse<Record<string, unknown>>(rpcResponse);
    const bank = order.bankAccount as Record<string, string> | null;
    const qrUrl = body.paymentMethod === 'bank_transfer' && bank
      ? buildQrUrl(bank, Number(order.total), String(order.transferReference))
      : undefined;

    if (qrUrl) {
      const updateResponse = await adminRestFetch(`orders?id=eq.${encodeURIComponent(String(order.id))}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ qr_url: qrUrl }),
      });
      if (!updateResponse.ok) throw new Error('Không thể lưu mã QR cho đơn hàng.');
    }

    let customerAccessToken: string | undefined;
    if (body.guestCheckout === true) {
      try {
        customerAccessToken = await saveGuestCustomer(
          body,
          String(order.id),
          recipientName,
          phone,
          email,
          address,
        );
      } catch (profileError) {
        // The order is already valid; profile persistence must never cause a duplicate checkout retry.
        console.error('guest customer profile save failed', profileError);
      }
    }

    return jsonResponse(request, { ...order, qrUrl, paymentAccessToken, customerAccessToken }, 201);
  } catch (error) {
    console.error('create-order failed', error);
    return jsonResponse(request, {
      error: error instanceof Error ? error.message : 'Không thể tạo đơn hàng.',
    }, 400);
  }
});
