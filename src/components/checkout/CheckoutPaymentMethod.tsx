import React from 'react';
import { Banknote, CreditCard, QrCode, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PaymentMethod } from '../../types';

interface CheckoutPaymentMethodProps {
  method: PaymentMethod;
  setMethod: (method: PaymentMethod) => void;
}

export const CheckoutPaymentMethod: React.FC<CheckoutPaymentMethodProps> = ({ method, setMethod }) => {
  const { bankAccount } = useAdmin();
  const transferAvailable = bankAccount.isActive && Boolean(bankAccount.accountNumber && bankAccount.accountName);

  return (
    <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 shadow-card space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0E7A32] flex items-center justify-center font-bold text-sm">4</div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">Phương thức thanh toán</h3>
          <p className="text-xs text-gray-500">Chọn phương thức thanh toán phù hợp với bạn</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className={`flex items-start sm:items-center justify-between p-4 rounded-[12px] border cursor-pointer transition ${method === 'cod' ? 'border-[#0E7A32] bg-emerald-50/40 ring-1 ring-[#0E7A32]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <input type="radio" name="paymentMethod" checked={method === 'cod'} onChange={() => setMethod('cod')} className="w-4 h-4 accent-[#0E7A32]" />
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0E7A32] flex items-center justify-center flex-shrink-0"><Banknote className="w-5 h-5" /></div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</div>
              <div className="text-[11px] text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</div>
            </div>
          </div>
        </label>

        <label className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[12px] border gap-3 transition ${!transferAvailable ? 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed' : method === 'bank_transfer' ? 'border-[#0E7A32] bg-emerald-50/40 ring-1 ring-[#0E7A32] cursor-pointer' : 'border-gray-200 bg-white hover:bg-gray-50 cursor-pointer'}`}>
          <div className="flex items-center gap-3">
            <input type="radio" name="paymentMethod" checked={method === 'bank_transfer'} disabled={!transferAvailable} onChange={() => setMethod('bank_transfer')} className="w-4 h-4 accent-[#0E7A32]" />
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0"><QrCode className="w-5 h-5" /></div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900">Chuyển khoản ngân hàng</div>
              <div className="text-[11px] text-gray-500">{transferAvailable ? `Quét QR VietQR · ${bankAccount.bankName}` : 'Admin chưa cấu hình tài khoản nhận tiền'}</div>
            </div>
          </div>
          {transferAvailable && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg"><ShieldCheck className="w-3.5 h-3.5" /> Đúng số tiền & nội dung</div>}
        </label>

        <div className="flex items-center justify-between p-4 rounded-[12px] border border-gray-200 bg-gray-50 opacity-65">
          <div className="flex items-center gap-3">
            <input type="radio" name="paymentMethod" disabled className="w-4 h-4" />
            <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-500 flex items-center justify-center"><CreditCard className="w-5 h-5" /></div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-700">Thẻ ngân hàng</div>
              <div className="text-[11px] text-gray-500">Sẽ mở khi cổng thanh toán thẻ được tích hợp</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-lg">Sắp ra mắt</span>
        </div>
      </div>
    </div>
  );
};
