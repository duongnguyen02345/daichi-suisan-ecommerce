import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Truck, ShieldCheck, Headphones, Info, X, Receipt } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../lib/utils';

export const CartSummary: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    selectedItemsCount,
    subtotal,
    netSubtotal,
    vatTotal,
    grossProductTotal,
    productDiscount,
    couponDiscount,
    shippingFee,
    finalTotal,
    appliedCoupon,
    removeCoupon,
  } = useCart();
  const handleCheckout = () => navigate('/checkout');

  return (
    <>
      {/* Summary Card */}
      <div className="bg-white rounded-[16px] md:rounded-[12px] border border-[#E5E7EB] p-4 md:p-6 shadow-card space-y-4 md:space-y-5">
        <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#0E7A32]" />
          <span>Tóm tắt đơn hàng</span>
        </h3>

        {/* Breakdown */}
        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính ({selectedItemsCount} sản phẩm)</span>
            <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
          </div>

          {productDiscount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Giảm giá sản phẩm</span>
              <span className="font-bold text-[#0E7A32]">-{formatPrice(productDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-600">
            <span>Tiền hàng trước VAT</span>
            <span className="font-bold text-gray-900">{formatPrice(netSubtotal)}</span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span>Thuế VAT</span>
            <span className="font-bold text-gray-900">{formatPrice(vatTotal)}</span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span>Tiền hàng sau VAT</span>
            <span className="font-bold text-gray-900">{formatPrice(grossProductTotal)}</span>
          </div>

          {appliedCoupon && (
            <div className="flex items-center justify-between text-gray-600">
              <div className="flex items-center gap-1.5">
                <span>Mã giảm giá</span>
                <span className="bg-[#E8F5E9] text-[#0E7A32] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  {appliedCoupon.code}
                  <button onClick={removeCoupon} className="hover:text-red-500" aria-label="Xóa mã">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
              <span className="font-bold text-[#0E7A32]">
                {appliedCoupon.code === 'FREESHIP'
                  ? 'Miễn phí giao hàng'
                  : `-${formatPrice(couponDiscount)}`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-gray-600">
            <div className="flex items-center gap-1">
              <span>Phí vận chuyển</span>
              <Info className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="font-bold text-gray-900">
              {shippingFee === 0 ? (
                <span className="text-[#0E7A32]">Miễn phí</span>
              ) : (
                formatPrice(shippingFee)
              )}
            </span>
          </div>
        </div>

        {/* Desktop-only Total & Action */}
        <div className="hidden lg:block pt-4 border-t border-[#E5E7EB] space-y-4">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-bold text-gray-800">Tổng cộng</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#E53935]">
                {formatPrice(finalTotal)}
              </span>
              <div className="text-[10px] text-gray-400">(Đã bao gồm VAT)</div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleCheckout}
              disabled={selectedItemsCount === 0}
              className="w-full bg-[#0E7A32] text-white h-[42px] px-6 rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0A5C25] transition duration-200 hover:scale-[1.02] shadow-md shadow-emerald-800/15 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <Lock className="w-4 h-4" />
              <span>Tiến hành thanh toán</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/products')}
              className="w-full border border-gray-200 text-gray-700 h-[42px] rounded-[12px] text-xs font-semibold hover:bg-gray-50 transition"
            >
              Mua thêm sản phẩm
            </button>
          </div>

          {/* Trust badges footer */}
          <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="font-semibold text-gray-700">Bảo mật thông tin</span>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="font-semibold text-gray-700">Giao nhanh toàn quốc</span>
            </div>
            <div className="flex flex-col items-center">
              <Headphones className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="font-semibold text-gray-700">Hỗ trợ 1900 5234</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Sticky Bottom Checkout Bar on Mobile (lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-gray-500 font-medium leading-none">Tổng cộng</div>
          <div className="text-xl font-black text-[#E53935] leading-none my-1">
            {formatPrice(finalTotal)}
          </div>
          <div className="text-[10px] text-gray-400 font-medium leading-none">(Đã bao gồm VAT)</div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={selectedItemsCount === 0}
          className="bg-[#0E7A32] text-white h-[44px] px-5 rounded-[12px] font-bold text-xs sm:text-sm flex items-center gap-1.5 hover:bg-[#0A5C25] active:scale-95 transition shadow-md shadow-emerald-900/10 disabled:opacity-50 flex-shrink-0"
        >
          <Lock className="w-4 h-4" />
          <span>Tiến hành thanh toán</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
