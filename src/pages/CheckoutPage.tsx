import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Sparkles,
  QrCode,
  Copy,
  Clock3,
  Loader2,
  MapPin,
  UserRoundSearch,
} from 'lucide-react';
import { CheckoutDeliveryTime } from '../components/checkout/CheckoutDeliveryTime';
import { CheckoutPaymentMethod } from '../components/checkout/CheckoutPaymentMethod';
import { CheckoutAddress } from '../components/checkout/CheckoutAddress';
import { PlacementBannerCarousel } from '../components/common/PlacementBannerCarousel';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../../src/lib/utils';
import { useAdmin } from '../context/AdminContext';
import { useOrders } from '../context/OrderContext';
import { DeliveryLocation, Order, PaymentMethod } from '../types';
import { buildVietQrUrl, createOrderCode } from '../lib/payment';
import {
  createRemoteOrder,
  fetchRemoteOrderStatus,
  GuestCustomerProfile,
  lookupGuestCustomerProfile,
} from '../lib/ordersApi';
import { isPaymentsBackendConfigured } from '../lib/supabase';
import { getProductVatBreakdown } from '../lib/vat';

const normalizePhone = (value: string) => {
  const compact = value.trim().replace(/[\s().-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
};
const isValidVietnamPhone = (value: string) => /^(?:0\d{9,10}|\+84\d{9,10})$/.test(normalizePhone(value));
const toLocalDateId = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bankAccount } = useAdmin();
  const { addOrder, updateOrder, reportOrderPayment } = useOrders();
  const { 
    items, 
    subtotal, 
    netSubtotal,
    vatTotal,
    grossProductTotal,
    productDiscount, 
    couponDiscount, 
    shippingFee, 
    finalTotal, 
    appliedCoupon,
    orderNote,
    setOrderNote,
    deliveryMode,
    deliveryDate,
    deliveryTimeSlot,
    removeSelectedItems,
  } = useCart();

  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const defaultAddress = user?.addresses.find((address) => address.isDefault) || user?.addresses[0];
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>({
    formattedAddress: defaultAddress?.address || '',
    source: defaultAddress ? 'saved' : 'manual',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [placedOrderCode, setPlacedOrderCode] = useState('');
  const [placedQrUrl, setPlacedQrUrl] = useState('');
  const [placedPaymentMethod, setPlacedPaymentMethod] = useState<PaymentMethod>('cod');
  const [copyMessage, setCopyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [paymentAccessToken, setPaymentAccessToken] = useState('');
  const [placedPaymentStatus, setPlacedPaymentStatus] = useState<Order['paymentStatus']>();
  const [placedTotal, setPlacedTotal] = useState(0);
  const [placedBankAccount, setPlacedBankAccount] = useState(bankAccount);
  const [isReportingPayment, setIsReportingPayment] = useState(false);
  const [paymentReportMessage, setPaymentReportMessage] = useState('');
  const [guestProfile, setGuestProfile] = useState<GuestCustomerProfile | null>(null);
  const [isLookingUpGuest, setIsLookingUpGuest] = useState(false);

  const selectedItems = items.filter((i) => i.selected);

  useEffect(() => {
    if (!user) return;
    setRecipientName((current) => current || user.name || '');
    setPhone((current) => current || user.phone || '');
    setEmail((current) => current || user.email || '');
    const savedAddress = user.addresses.find((address) => address.isDefault) || user.addresses[0];
    if (savedAddress) {
      setDeliveryLocation((current) => current.formattedAddress
        ? current
        : { formattedAddress: savedAddress.address, source: 'saved' });
    }
  }, [user]);

  useEffect(() => {
    if (user || !isValidVietnamPhone(phone)) {
      setGuestProfile(null);
      setIsLookingUpGuest(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsLookingUpGuest(true);
      try {
        const profile = await lookupGuestCustomerProfile(phone);
        if (!cancelled) setGuestProfile(profile);
      } catch {
        if (!cancelled) setGuestProfile(null);
      } finally {
        if (!cancelled) setIsLookingUpGuest(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [phone, user]);

  const applyGuestProfile = (address?: GuestCustomerProfile['addresses'][number]) => {
    if (!guestProfile) return;
    setRecipientName(guestProfile.name);
    if (guestProfile.email) setEmail(guestProfile.email);
    if (address) {
      setDeliveryLocation({
        formattedAddress: address.formattedAddress,
        latitude: address.latitude,
        longitude: address.longitude,
        source: 'saved',
      });
    }
    setSubmitError('');
  };

  useEffect(() => {
    if (
      !isSuccessModalOpen ||
      placedPaymentMethod !== 'bank_transfer' ||
      !placedOrderId ||
      !paymentAccessToken ||
      placedPaymentStatus === 'paid'
    ) return;

    let cancelled = false;
    const checkStatus = async () => {
      try {
        const status = await fetchRemoteOrderStatus(placedOrderId, paymentAccessToken);
        if (!status || cancelled) return;
        setPlacedPaymentStatus(status.paymentStatus);
        updateOrder(placedOrderId, {
          status: status.status,
          paymentStatus: status.paymentStatus,
          providerTransactionId: status.providerTransactionId,
        });
      } catch {
        // A temporary network error should not interrupt the customer's QR flow.
      }
    };

    void checkStatus();
    const intervalId = window.setInterval(checkStatus, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isSuccessModalOpen, paymentAccessToken, placedOrderId, placedPaymentMethod, placedPaymentStatus, updateOrder]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = recipientName.trim();
    const normalizedPhone = normalizePhone(phone);
    const normalizedAddress = deliveryLocation.formattedAddress.trim();
    const resolvedDeliveryDate = deliveryMode === 'immediate' ? toLocalDateId(new Date()) : deliveryDate;
    const resolvedDeliveryTime = deliveryMode === 'immediate' ? 'Giao ngay' : deliveryTimeSlot;
    if (selectedItems.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất một sản phẩm để đặt hàng.');
      return;
    }
    if (normalizedName.length < 2) {
      setSubmitError('Vui lòng nhập đầy đủ họ và tên người nhận.');
      return;
    }
    if (!isValidVietnamPhone(normalizedPhone)) {
      setSubmitError('Số điện thoại không hợp lệ. Vui lòng nhập số Việt Nam bắt đầu bằng 0 hoặc +84.');
      return;
    }
    if (normalizedAddress.length < 10) {
      setSubmitError('Vui lòng nhập địa chỉ nhận hàng đầy đủ: số nhà, đường, phường/xã và tỉnh/thành phố.');
      return;
    }
    if (deliveryMode === 'scheduled') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(resolvedDeliveryDate) || !/^\d{2}:\d{2}$/.test(resolvedDeliveryTime)) {
        setSubmitError('Vui lòng chọn đầy đủ ngày và thời gian muốn nhận hàng.');
        return;
      }
      const scheduledAt = new Date(`${resolvedDeliveryDate}T${resolvedDeliveryTime}:00`);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 30 * 60 * 1000) {
        setSubmitError('Thời gian hẹn giao phải cách thời điểm hiện tại ít nhất 30 phút.');
        return;
      }
    }
    if (paymentMethod === 'bank_transfer' && (!bankAccount.isActive || !bankAccount.accountNumber)) {
      setSubmitError('Tài khoản nhận chuyển khoản đang chưa được cấu hình. Vui lòng chọn thanh toán khi nhận hàng.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const remoteOrder = await createRemoteOrder({
        items: selectedItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        couponCode: appliedCoupon?.code,
        recipientName: normalizedName,
        phone: normalizedPhone,
        email: email.trim() || undefined,
        deliveryLocation,
        deliveryMode,
        deliveryDate: resolvedDeliveryDate,
        deliveryTimeSlot: resolvedDeliveryTime,
        note: orderNote.trim() || undefined,
        guestCheckout: !user,
      });

      const orderCode = remoteOrder?.code || createOrderCode();
      const transferReference = paymentMethod === 'bank_transfer' ? orderCode : undefined;
      const qrUrl = remoteOrder?.qrUrl || (paymentMethod === 'bank_transfer'
        ? buildVietQrUrl(bankAccount, finalTotal, transferReference || orderCode)
        : undefined);
      const resolvedBankAccount = remoteOrder?.bankAccount
        ? { ...bankAccount, ...remoteOrder.bankAccount, isActive: true }
        : bankAccount;
      const order: Order = {
        id: remoteOrder?.id || `ord-${orderCode.toLowerCase()}`,
        code: orderCode,
        createdAt: new Date().toLocaleString('vi-VN'),
        items: selectedItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: getProductVatBreakdown(item.product).grossPrice,
        })),
        subtotal: remoteOrder?.subtotal ?? subtotal,
        netSubtotal: remoteOrder?.netSubtotal ?? netSubtotal,
        vatTotal: remoteOrder?.vatTotal ?? vatTotal,
        discount: remoteOrder?.productDiscount ?? productDiscount,
        couponDiscount: remoteOrder?.couponDiscount ?? couponDiscount,
        shippingFee: remoteOrder?.shippingFee ?? shippingFee,
        total: remoteOrder?.total ?? finalTotal,
        status: remoteOrder?.status || (paymentMethod === 'bank_transfer' ? 'awaiting_payment' : 'pending'),
        paymentMethod,
        paymentStatus: remoteOrder?.paymentStatus || (paymentMethod === 'bank_transfer' ? 'awaiting_confirmation' : 'cash_on_delivery'),
        transferReference,
        qrUrl,
        paymentAccessToken: remoteOrder?.paymentAccessToken,
        paymentExpiresAt: remoteOrder?.paymentExpiresAt,
        paymentProvider: remoteOrder && paymentMethod === 'bank_transfer' ? 'sepay' : undefined,
        recipientName: normalizedName,
        phone: normalizedPhone,
        email: email.trim() || undefined,
        address: normalizedAddress,
        deliveryMode,
        deliveryDate: resolvedDeliveryDate,
        deliveryTimeSlot: resolvedDeliveryTime,
        note: orderNote.trim() || undefined,
      };
      addOrder(order);
      setPlacedOrderId(order.id);
      setPaymentAccessToken(order.paymentAccessToken || '');
      setPlacedOrderCode(orderCode);
      setPlacedQrUrl(qrUrl || '');
      setPlacedPaymentMethod(paymentMethod);
      setPlacedPaymentStatus(order.paymentStatus);
      setPlacedTotal(order.total);
      setPlacedBankAccount(resolvedBankAccount);
      setIsSuccessModalOpen(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    removeSelectedItems();
    setIsSuccessModalOpen(false);
    navigate(user ? '/account?tab=orders' : '/');
  };

  const handleReportPayment = async () => {
    if (!placedOrderId || isReportingPayment) return;
    setIsReportingPayment(true);
    setPaymentReportMessage('');
    const result = await reportOrderPayment(placedOrderId);
    setPaymentReportMessage(result.message);
    if (result.success) setPlacedPaymentStatus('customer_reported');
    setIsReportingPayment(false);
  };

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`Đã sao chép ${label}`);
      window.setTimeout(() => setCopyMessage(''), 1800);
    } catch {
      setCopyMessage('Không thể sao chép tự động. Vui lòng sao chép thủ công.');
    }
  };

  if (selectedItems.length === 0) return <Navigate to="/cart" replace />;

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 py-6 md:py-8 lg:py-10 animate-fadeIn space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link to="/" className="hover:text-[#0E7A32]">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link to="/cart" className="hover:text-[#0E7A32]">Giỏ hàng</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">Thanh toán</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] md:text-[34px] lg:text-[40px] font-bold text-[#111827] leading-tight">Thanh toán</h1>
        <p className="text-sm text-gray-500 mt-1">
          Không cần đăng ký tài khoản. Vui lòng nhập đầy đủ thông tin để FreshMart giao đúng người, đúng địa chỉ.
        </p>
      </div>

      <PlacementBannerCarousel placement="checkout" />

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto mb-10 hidden sm:block">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
          <div className="absolute left-8 w-1/3 top-1/2 -translate-y-1/2 h-0.5 bg-[#0E7A32] z-0" />

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#0E7A32] text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs">
              1
            </div>
            <span className="text-xs font-bold text-[#0E7A32] mt-2">Thông tin giao hàng</span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#0E7A32] text-[#0E7A32] flex items-center justify-center font-bold text-xs shadow-xs">
              2
            </div>
            <span className="text-xs font-bold text-gray-700 mt-2">Phương thức thanh toán</span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <span className="text-xs text-gray-400 mt-2">Xác nhận đơn hàng</span>
          </div>

          {/* Step 4 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <span className="text-xs text-gray-400 mt-2">Hoàn tất</span>
          </div>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-14">
        {/* Left Section: Information blocks (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Block 1: Thông tin nhận hàng */}
          <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0E7A32] flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Thông tin nhận hàng</h3>
                <p className="text-xs text-gray-500">Vui lòng cung cấp thông tin để chúng tôi giao hàng đến bạn</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-2.5 text-xs focus:ring-2 focus:ring-[#0E7A32] focus:bg-white text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  inputMode="tel"
                  minLength={10}
                  maxLength={20}
                  pattern="[0-9+ ().-]{10,20}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0987654321 hoặc +84987654321"
                  className="w-full bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-2.5 text-xs focus:ring-2 focus:ring-[#0E7A32] focus:bg-white text-gray-800"
                />
                <p className="mt-1.5 text-[11px] text-gray-400">Số điện thoại đồng thời là mã khách hàng của đơn mua không cần tài khoản.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email (không bắt buộc)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-2.5 text-xs focus:ring-2 focus:ring-[#0E7A32] focus:bg-white text-gray-800"
              />
            </div>

            {!user && isLookingUpGuest ? (
              <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra thông tin từ lần đặt hàng trước...
              </div>
            ) : null}

            {!user && guestProfile ? (
              <div className="rounded-[14px] border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#0E7A32] shadow-sm">
                    <UserRoundSearch className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-emerald-900">Thông tin từ lần đặt hàng trước</h4>
                    <p className="mt-1 text-xs text-emerald-800">{guestProfile.name} · Mã khách hàng: {guestProfile.customerCode}</p>
                    {guestProfile.addresses.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Chọn địa chỉ nhận hàng</p>
                        {guestProfile.addresses.map((address) => (
                          <button
                            key={address.id}
                            type="button"
                            onClick={() => applyGuestProfile(address)}
                            className="flex w-full items-start gap-2 rounded-[10px] border border-emerald-200 bg-white px-3 py-2.5 text-left text-xs text-gray-700 transition hover:border-[#0E7A32] hover:bg-emerald-50"
                          >
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0E7A32]" />
                            <span className="leading-5">{address.formattedAddress}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button type="button" onClick={() => applyGuestProfile()} className="mt-3 text-xs font-bold text-[#0E7A32] hover:underline">Dùng tên và email đã lưu</button>
                    )}
                  </div>
                </div>
                <p className="mt-3 border-t border-emerald-200 pt-2 text-[10px] leading-4 text-emerald-700">Vì quyền riêng tư, gợi ý này chỉ xuất hiện trên trình duyệt đã từng đặt hàng bằng số điện thoại trên.</p>
              </div>
            ) : null}

            {!user && !guestProfile && !isLookingUpGuest ? (
              <p className="text-[11px] leading-5 text-gray-400">Sau khi đặt hàng, FreshMart sẽ lưu tên và địa chỉ để gợi ý nhanh ở lần mua tiếp theo trên thiết bị này. Bạn không cần tạo tài khoản.</p>
            ) : null}
          </div>

          {/* Block 2: Địa chỉ giao hàng */}
          <CheckoutAddress value={deliveryLocation} onChange={setDeliveryLocation} />

          {/* Block 3: Chọn thời gian giao hàng */}
          <CheckoutDeliveryTime />

          {/* Block 4: Phương thức thanh toán */}
          <CheckoutPaymentMethod method={paymentMethod} setMethod={setPaymentMethod} />

          {/* Block 5: Ghi chú đơn hàng */}
          <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 shadow-card space-y-3">
            <h3 className="font-bold text-gray-900 text-base">5. Ghi chú đơn hàng (tùy chọn)</h3>
            <textarea
              rows={3}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Ví dụ: Giao hàng trước 10h sáng, gọi điện trước khi giao..."
              className="w-full bg-gray-50 border border-gray-200 rounded-[12px] p-3.5 text-xs focus:ring-2 focus:ring-[#0E7A32] focus:bg-white resize-none text-gray-800"
            />
          </div>
        </div>

        {/* Right Section: Order summary sidebar (4 cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">
                Thông tin đơn hàng ({selectedItems.length} sản phẩm)
              </h3>
              <Link to="/cart" className="text-xs text-[#0E7A32] font-semibold hover:underline">
                Quay về giỏ hàng
              </Link>
            </div>

            {/* Items list preview */}
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto no-scrollbar space-y-2">
              {selectedItems.map((item) => (
                <div key={item.product.id} className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-11 h-11 rounded-xl object-contain bg-gray-50 p-1 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-gray-900 truncate">
                        {item.product.name}
                      </h5>
                      <span className="text-[10px] text-gray-400">
                        {item.product.unit} • x{item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-900 flex-shrink-0">
                    {formatPrice(getProductVatBreakdown(item.product).grossPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping notification box */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {shippingFee === 0
                  ? 'Đơn hàng đang được miễn phí vận chuyển'
                  : `Mua thêm ${formatPrice(Math.max(0, 500000 - grossProductTotal))} để được miễn phí vận chuyển`}
              </span>
            </div>

            {/* Calculations breakdown */}
            <div className="space-y-2.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Giảm giá sản phẩm</span>
                <span className="font-bold text-emerald-600">-{formatPrice(productDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiền hàng trước VAT</span>
                <span className="font-bold text-gray-900">{formatPrice(netSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế VAT</span>
                <span className="font-bold text-gray-900">{formatPrice(vatTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiền hàng sau VAT</span>
                <span className="font-bold text-gray-900">{formatPrice(grossProductTotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span>Mã giảm giá ({appliedCoupon?.code || 'FREESHIP'})</span>
                  <span className="font-bold text-emerald-600">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Phí giao hàng</span>
                <span className="font-bold text-emerald-600">
                  {shippingFee === 0 ? '0đ' : formatPrice(shippingFee)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-[#E5E7EB]">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-[#E53935]">{formatPrice(finalTotal)}</span>
              </div>
              <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold p-2.5 rounded-[12px] text-center">
                Bạn đã tiết kiệm được {formatPrice(productDiscount + couponDiscount)} cho đơn hàng này!
              </div>
            </div>

            {/* Place order button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0E7A32] text-white h-[42px] px-6 rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0A5C25] transition duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-emerald-800/15 disabled:opacity-60 disabled:cursor-wait"
            >
              {paymentMethod === 'bank_transfer' ? <QrCode className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{isSubmitting ? 'Đang tạo đơn...' : paymentMethod === 'bank_transfer' ? 'Tạo đơn & mã QR' : 'Đặt hàng'}</span>
            </button>

            {submitError && (
              <p role="alert" className="text-xs text-red-600 font-semibold text-center">{submitError}</p>
            )}

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Bằng việc đặt hàng, bạn đồng ý với <a href="#terms" className="underline">Điều khoản sử dụng</a> và <a href="#privacy" className="underline">Chính sách bảo mật</a> của FreshMart.
            </p>

            {/* Assurances */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sản phẩm tươi ngon được tuyển chọn kỹ lưỡng</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Giao hàng nhanh 2h tại khu vực nội thành</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Order placement / transfer modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 text-center shadow-modal animate-fadeSlideUp border border-[#E5E7EB] max-h-[92vh] overflow-y-auto">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${placedPaymentMethod === 'bank_transfer' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-[#0E7A32]'}`}>
              {placedPaymentMethod === 'bank_transfer' ? <QrCode className="w-9 h-9" /> : <CheckCircle2 className="w-10 h-10" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {placedPaymentMethod === 'bank_transfer' ? 'Quét QR để chuyển khoản' : 'Đặt hàng thành công!'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Mã đơn hàng: <strong className="text-[#0E7A32]">{placedOrderCode}</strong>
            </p>

            {placedPaymentMethod === 'bank_transfer' && (
              <div className="space-y-4 mb-6 text-left">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3">
                  <img src={placedQrUrl} alt={`QR chuyển khoản đơn ${placedOrderCode}`} className="w-full max-w-[320px] mx-auto rounded-xl" />
                </div>
                <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-xs">
                  <div className="p-3 flex items-center justify-between gap-3"><span className="text-gray-500">Ngân hàng</span><strong>{placedBankAccount.bankName}</strong></div>
                  <div className="p-3 flex items-center justify-between gap-3"><span className="text-gray-500">Số tài khoản</span><button type="button" onClick={() => copyValue(placedBankAccount.accountNumber, 'số tài khoản')} className="font-bold flex items-center gap-1 hover:text-[#0E7A32]">{placedBankAccount.accountNumber}<Copy className="w-3.5 h-3.5" /></button></div>
                  <div className="p-3 flex items-center justify-between gap-3"><span className="text-gray-500">Chủ tài khoản</span><strong>{placedBankAccount.accountName}</strong></div>
                  <div className="p-3 flex items-center justify-between gap-3"><span className="text-gray-500">Số tiền</span><button type="button" onClick={() => copyValue(String(placedTotal), 'số tiền')} className="font-bold text-red-600 flex items-center gap-1">{formatPrice(placedTotal)}<Copy className="w-3.5 h-3.5" /></button></div>
                  <div className="p-3 flex items-center justify-between gap-3"><span className="text-gray-500">Nội dung</span><button type="button" onClick={() => copyValue(placedOrderCode, 'nội dung chuyển khoản')} className="font-bold text-[#0E7A32] flex items-center gap-1">{placedOrderCode}<Copy className="w-3.5 h-3.5" /></button></div>
                </div>
                <div className={`rounded-xl border p-3 flex items-start gap-2 text-xs ${placedPaymentStatus === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : placedPaymentStatus === 'customer_reported' ? 'bg-blue-50 border-blue-200 text-blue-900' : placedPaymentStatus === 'review_required' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
                  {placedPaymentStatus === 'paid' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <Clock3 className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span>
                    {placedPaymentStatus === 'paid'
                      ? <><strong>Thanh toán thành công.</strong> Đơn hàng đã được hệ thống tự động xác nhận.</>
                      : placedPaymentStatus === 'customer_reported'
                        ? <><strong>Đã báo thanh toán.</strong> Đơn hàng đang được xử lý; SePay hoặc admin sẽ xác minh và cập nhật kết quả tại đây.</>
                      : placedPaymentStatus === 'review_required'
                        ? <><strong>Cần đối soát.</strong> Số tiền nhận được chưa khớp đơn hàng; FreshMart sẽ kiểm tra thủ công.</>
                        : isPaymentsBackendConfigured
                          ? <>Đang <strong>chờ ngân hàng xác nhận</strong>. Trang này tự kiểm tra mỗi 3 giây.</>
                          : <>Đơn đang ở trạng thái <strong>chờ chuyển khoản</strong>. Chế độ local chưa thể nhận webhook tự động.</>}
                  </span>
                </div>
                {placedPaymentStatus === 'awaiting_confirmation' ? (
                  <button
                    type="button"
                    onClick={() => void handleReportPayment()}
                    disabled={isReportingPayment}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isReportingPayment ? 'Đang gửi thông báo...' : 'Đã thanh toán'}
                  </button>
                ) : null}
                {paymentReportMessage ? (
                  <p role="status" className={`text-center text-xs font-semibold ${
                    placedPaymentStatus === 'customer_reported' ? 'text-blue-700' : 'text-rose-700'
                  }`}>
                    {paymentReportMessage}
                  </p>
                ) : null}
                {copyMessage && <p className="text-center text-xs font-bold text-emerald-700">{copyMessage}</p>}
              </div>
            )}

            {placedPaymentMethod === 'cod' && (
              <p className="text-xs text-gray-500 mb-6">FreshMart sẽ xác nhận và giao hàng theo lịch hẹn của bạn.</p>
            )}
            <button
              onClick={handleFinish}
              className="w-full bg-[#0E7A32] text-white h-[42px] rounded-[12px] font-semibold text-xs hover:bg-[#0A5C25] transition duration-200 hover:scale-[1.02] shadow-sm"
            >
              {!user
                ? 'Hoàn tất – về trang chủ'
                : placedPaymentMethod === 'bank_transfer' && placedPaymentStatus === 'paid'
                ? 'Thanh toán thành công – xem đơn'
                : placedPaymentMethod === 'bank_transfer'
                  ? 'Xem trạng thái đơn hàng'
                  : 'Xem đơn hàng của tôi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
