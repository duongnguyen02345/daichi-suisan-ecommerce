import { mockProducts } from '../data/mockData';
import { DeliveryLocation, Order, PaymentMethod, Product } from '../types';
import {
  getPaymentsFunctionUrl,
  getPaymentsRequestHeaders,
  isPaymentsBackendConfigured,
  supabase,
} from './supabase';

export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  recipientName: string;
  phone: string;
  email?: string;
  deliveryLocation: DeliveryLocation;
  deliveryMode: 'immediate' | 'scheduled';
  deliveryDate: string;
  deliveryTimeSlot: string;
  note?: string;
  customerAccessToken?: string;
  guestCheckout: boolean;
}

export interface RemoteOrderResult {
  id: string;
  code: string;
  subtotal: number;
  netSubtotal: number;
  vatTotal: number;
  productDiscount: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  status: Order['status'];
  paymentStatus: Order['paymentStatus'];
  transferReference?: string;
  qrUrl?: string;
  paymentAccessToken: string;
  customerAccessToken?: string;
  paymentExpiresAt?: string;
  bankAccount?: {
    bankId: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface GuestCustomerProfile {
  customerCode: string;
  name: string;
  email: string;
  addresses: Array<{
    id: string;
    formattedAddress: string;
    latitude?: number;
    longitude?: number;
    timesUsed: number;
    lastUsedAt: string;
  }>;
}

const GUEST_CUSTOMER_TOKENS_KEY = 'freshmart_guest_customer_tokens_v1';
const normalizeCustomerCode = (value: string) => {
  const compact = value.trim().replace(/[\s().-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
};

const readGuestCustomerTokens = (): Record<string, string> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_CUSTOMER_TOKENS_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
};

const getGuestCustomerToken = (phone: string) => readGuestCustomerTokens()[normalizeCustomerCode(phone)] || '';

const saveGuestCustomerToken = (phone: string, token: string) => {
  if (!token) return;
  const tokens = readGuestCustomerTokens();
  tokens[normalizeCustomerCode(phone)] = token;
  localStorage.setItem(GUEST_CUSTOMER_TOKENS_KEY, JSON.stringify(tokens));
};

export interface RemoteOrderStatus {
  id: string;
  code: string;
  status: Order['status'];
  paymentStatus: Order['paymentStatus'];
  paymentReportedAt?: string;
  paidAt?: string;
  paymentExpiresAt?: string;
  providerTransactionId?: string;
}

const readResponse = async <T,>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Không thể kết nối máy chủ thanh toán.');
  }
  return payload as T;
};

export const createRemoteOrder = async (input: CreateOrderInput) => {
  if (!isPaymentsBackendConfigured) return null;
  const customerAccessToken = input.guestCheckout
    ? input.customerAccessToken || getGuestCustomerToken(input.phone)
    : '';
  const response = await fetch(getPaymentsFunctionUrl('create-order'), {
    method: 'POST',
    headers: getPaymentsRequestHeaders(),
    body: JSON.stringify({ ...input, customerAccessToken: customerAccessToken || undefined }),
  });
  const result = await readResponse<RemoteOrderResult>(response);
  if (input.guestCheckout && result.customerAccessToken) {
    saveGuestCustomerToken(input.phone, result.customerAccessToken);
  }
  return result;
};

export const lookupGuestCustomerProfile = async (phone: string): Promise<GuestCustomerProfile | null> => {
  if (!isPaymentsBackendConfigured) return null;
  const normalizedPhone = normalizeCustomerCode(phone);
  const customerAccessToken = getGuestCustomerToken(normalizedPhone);
  if (!customerAccessToken) return null;
  const response = await fetch(getPaymentsFunctionUrl('guest-customer-profile'), {
    method: 'POST',
    headers: getPaymentsRequestHeaders(),
    body: JSON.stringify({ phone: normalizedPhone, customerAccessToken }),
  });
  const result = await readResponse<{ found: boolean } & Partial<GuestCustomerProfile>>(response);
  if (!result.found || !result.customerCode || !result.name || !Array.isArray(result.addresses)) return null;
  return result as GuestCustomerProfile;
};

export const fetchRemoteOrderStatus = async (orderId: string, paymentAccessToken: string) => {
  if (!isPaymentsBackendConfigured) return null;
  const url = new URL(getPaymentsFunctionUrl('order-status'));
  url.searchParams.set('orderId', orderId);
  const response = await fetch(url, {
    headers: getPaymentsRequestHeaders({ 'X-Order-Token': paymentAccessToken }),
  });
  return readResponse<RemoteOrderStatus>(response);
};

export const reportRemoteOrderPayment = async (orderId: string, paymentAccessToken: string) => {
  if (!isPaymentsBackendConfigured) return null;
  const response = await fetch(getPaymentsFunctionUrl('report-payment'), {
    method: 'POST',
    headers: getPaymentsRequestHeaders(),
    body: JSON.stringify({ orderId, paymentAccessToken }),
  });
  return readResponse<RemoteOrderStatus>(response);
};

type DatabaseRow = Record<string, unknown>;

const createOrderProduct = (row: DatabaseRow): Product => {
  const productId = String(row.product_id || 'unknown');
  const fallback = mockProducts.find((product) => product.id === productId);
  if (fallback) return fallback;
  const unitPrice = Number(row.unit_price || 0);
  return {
    id: productId,
    sku: productId,
    name: String(row.product_name || 'Sản phẩm'),
    slug: productId,
    price: unitPrice,
    originalPrice: Number(row.original_unit_price || unitPrice),
    vatRate: Number(row.vat_rate || 0),
    vatCalculation: row.vat_calculation === 'exclusive' ? 'exclusive' : 'inclusive',
    rating: 0,
    reviewCount: 0,
    image: '',
    gallery: [],
    category: 'khac',
    categoryName: 'Khác',
    unit: 'Sản phẩm',
    origin: '',
    storage: '',
    expiry: '',
    stock: 0,
    status: 'out_of_stock',
  };
};

const formatRemoteDateTime = (value: unknown) => {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleString('vi-VN');
};

const mapAdminOrderRow = (row: DatabaseRow): Order => {
  const itemRows = Array.isArray(row.order_items)
    ? row.order_items as DatabaseRow[]
    : [];
  return {
    id: String(row.id),
    code: String(row.code),
    createdAt: formatRemoteDateTime(row.created_at),
    items: itemRows.map((item) => ({
      product: createOrderProduct(item),
      quantity: Number(item.quantity || 0),
      price: Number(item.unit_price || 0),
    })),
    subtotal: Number(row.subtotal || 0),
    netSubtotal: Number(row.net_subtotal || 0),
    vatTotal: Number(row.vat_total || 0),
    discount: Number(row.product_discount || 0),
    couponDiscount: Number(row.coupon_discount || 0),
    shippingFee: Number(row.shipping_fee || 0),
    total: Number(row.total || 0),
    status: row.status as Order['status'],
    paymentMethod: row.payment_method as PaymentMethod,
    paymentStatus: row.payment_status as Order['paymentStatus'],
    transferReference: row.transfer_reference ? String(row.transfer_reference) : undefined,
    qrUrl: row.qr_url ? String(row.qr_url) : undefined,
    paymentExpiresAt: row.payment_expires_at ? String(row.payment_expires_at) : undefined,
    paymentReportedAt: row.payment_reported_at ? String(row.payment_reported_at) : undefined,
    paymentProvider: row.payment_provider === 'sepay' ? 'sepay' : undefined,
    providerTransactionId: row.provider_transaction_id
      ? String(row.provider_transaction_id)
      : undefined,
    recipientName: String(row.recipient_name || ''),
    phone: String(row.phone || ''),
    email: row.email ? String(row.email) : undefined,
    address: String(row.address || ''),
    deliveryMode: String(row.delivery_time_slot) === 'Giao ngay' ? 'immediate' : 'scheduled',
    deliveryDate: String(row.delivery_date || ''),
    deliveryTimeSlot: String(row.delivery_time_slot || ''),
    note: row.note ? String(row.note) : undefined,
  };
};

export const loadAdminOrders = async () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(id, product_id, product_name, unit_price, original_unit_price, quantity, vat_rate, vat_calculation, net_unit_price, vat_unit_amount)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapAdminOrderRow(row as DatabaseRow));
};

export const transitionRemoteOrder = async (
  orderId: string,
  status: Order['status'],
  note?: string,
) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { error } = await supabase.rpc('transition_freshmart_order', {
    p_order_id: orderId,
    p_status: status,
    p_note: note || null,
  });
  if (error) throw error;
};

export const confirmRemoteOrderPayment = async (orderId: string, note?: string) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { error } = await supabase.rpc('confirm_freshmart_order_payment', {
    p_order_id: orderId,
    p_provider_transaction_id: null,
    p_note: note || null,
  });
  if (error) throw error;
};
