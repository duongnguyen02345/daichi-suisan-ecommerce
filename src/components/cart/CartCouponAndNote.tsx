import React, { useState } from 'react';
import { Tag, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartCouponAndNote: React.FC = () => {
  const { applyCoupon, appliedCoupon, orderNote, setOrderNote } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApply = (codeToApply?: string) => {
    const code = codeToApply || couponCode;
    if (!code.trim()) return;

    const res = applyCoupon(code);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      setCouponCode('');
    } else {
      setMessage({ type: 'error', text: res.message });
    }

    setTimeout(() => setMessage(null), 3500);
  };

  const popularCoupons = [
    { code: 'FRESH30', label: 'Giảm 30K đơn từ 300K' },
    { code: 'FREESHIP', label: 'Miễn phí vận chuyển' },
    { code: 'FRESH50', label: 'Giảm 50K đơn từ 500K' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
      {/* Mã giảm giá Card */}
      <div className="bg-white rounded-[16px] md:rounded-[12px] border border-[#E5E7EB] p-4 md:p-5 shadow-card">
        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#0E7A32]" />
          <span>Mã giảm giá</span>
        </h4>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã giảm giá"
            className="flex-1 bg-white border border-gray-200 rounded-[12px] px-3.5 py-2.5 text-xs font-semibold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          />
          <button
            onClick={() => handleApply()}
            className="bg-[#0E7A32] text-white px-5 h-[40px] md:h-[42px] rounded-[12px] text-xs font-semibold hover:bg-[#0A5C25] transition active:scale-98 shadow-xs flex-shrink-0"
          >
            Áp dụng
          </button>
        </div>

        {message && (
          <div
            className={`text-xs p-2.5 rounded-[12px] mb-3 flex items-center gap-1.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="text-[11px] text-gray-500 mb-2 font-medium">Mã giảm giá phổ biến:</div>
        <div className="grid grid-cols-3 gap-2">
          {popularCoupons.map((c) => {
            const isApplied = appliedCoupon?.code === c.code;
            return (
              <button
                key={c.code}
                onClick={() => handleApply(c.code)}
                type="button"
                className={`text-left p-2 sm:p-2.5 rounded-[12px] border transition active:scale-95 ${
                  isApplied
                    ? 'border-[#0E7A32] bg-emerald-50/70 text-emerald-900 shadow-xs'
                    : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/80 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold text-[#0E7A32] truncate">{c.code}</div>
                <div className="text-[10px] text-gray-500 line-clamp-1 leading-tight mt-0.5">{c.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ghi chú đơn hàng Card */}
      <div className="bg-white rounded-[16px] md:rounded-[12px] border border-[#E5E7EB] p-4 md:p-5 shadow-card flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0E7A32]" />
            <span>Ghi chú đơn hàng (tùy chọn)</span>
          </h4>
          <textarea
            rows={3}
            maxLength={200}
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Ví dụ: Giao sau 17h, gọi trước khi giao 15 phút..."
            className="w-full bg-gray-50 border border-gray-200 rounded-[12px] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E7A32] focus:bg-white resize-none text-gray-800 placeholder:text-gray-400"
          />
        </div>
        <div className="text-right text-[11px] text-gray-400 mt-1.5 font-medium">
          {orderNote.length}/200
        </div>
      </div>
    </div>
  );
};
