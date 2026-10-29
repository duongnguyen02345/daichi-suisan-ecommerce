import React, { useMemo, useState } from 'react';
import { Building2, CheckCircle2, Eye, Landmark, Save, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { buildVietQrUrl } from '../../lib/payment';
import { isPaymentsBackendConfigured } from '../../lib/supabase';

const supportedBanks = [
  { id: 'VCB', name: 'Vietcombank' },
  { id: 'ICB', name: 'VietinBank' },
  { id: 'BIDV', name: 'BIDV' },
  { id: 'MB', name: 'MB Bank' },
  { id: 'TCB', name: 'Techcombank' },
  { id: 'ACB', name: 'ACB' },
  { id: 'VPB', name: 'VPBank' },
  { id: 'TPB', name: 'TPBank' },
  { id: 'VBA', name: 'Agribank' },
  { id: 'STB', name: 'Sacombank' },
];

export const AdminPaymentSettings: React.FC = () => {
  const { bankAccount, saveBankAccount } = useAdmin();
  const [bankId, setBankId] = useState(bankAccount.bankId);
  const [accountNumber, setAccountNumber] = useState(bankAccount.accountNumber);
  const [accountName, setAccountName] = useState(bankAccount.accountName);
  const [isActive, setIsActive] = useState(bankAccount.isActive);
  const [saved, setSaved] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedBank = supportedBanks.find((bank) => bank.id === bankId) || supportedBanks[0];
  const canPreview = accountNumber.trim().length >= 6 && accountName.trim().length >= 3;
  const previewUrl = useMemo(() => {
    if (!canPreview) return '';
    return buildVietQrUrl(
      {
        ...bankAccount,
        bankId,
        bankName: selectedBank.name,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase(),
        isActive,
      },
      10000,
      'FM DEMO',
    );
  }, [accountName, accountNumber, bankAccount, bankId, canPreview, isActive, selectedBank.name]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    const result = await saveBankAccount({
      bankId,
      bankName: selectedBank.name,
      accountNumber: accountNumber.replace(/\s+/g, ''),
      accountName: accountName.trim().toUpperCase(),
      isActive,
    }, adminKey);
    setIsSaving(false);
    setSaved(result.success);
    setMessage(result.message);
    if (result.success) {
      setAdminKey('');
      window.setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <form
        onSubmit={handleSubmit}
        className="xl:col-span-7 bg-white rounded-[16px] border border-[#E5E7EB] p-5 sm:p-6 shadow-card space-y-5"
      >
        <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0E7A32] flex items-center justify-center">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Tài khoản nhận chuyển khoản</h2>
            <p className="text-xs text-gray-500 mt-1">
              QR tại checkout sẽ được tạo từ tài khoản đang kích hoạt bên dưới.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="payment-bank" className="block text-xs font-bold text-gray-700 mb-1.5">
            Ngân hàng
          </label>
          <select
            id="payment-bank"
            value={bankId}
            onChange={(event) => setBankId(event.target.value)}
            className="w-full h-[44px] border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          >
            {supportedBanks.map((bank) => (
              <option key={bank.id} value={bank.id}>{bank.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="payment-account-number" className="block text-xs font-bold text-gray-700 mb-1.5">
            Số tài khoản
          </label>
          <input
            id="payment-account-number"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            minLength={6}
            maxLength={19}
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
            placeholder="Nhập số tài khoản nhận tiền"
            className="w-full h-[44px] border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          />
        </div>

        <div>
          <label htmlFor="payment-account-name" className="block text-xs font-bold text-gray-700 mb-1.5">
            Tên chủ tài khoản
          </label>
          <input
            id="payment-account-name"
            type="text"
            required
            minLength={3}
            maxLength={50}
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            placeholder="NGUYEN VAN A"
            className="w-full h-[44px] border border-gray-200 rounded-xl px-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          />
          <p className="text-[11px] text-gray-400 mt-1">Nên nhập đúng tên không dấu như trên tài khoản ngân hàng.</p>
        </div>

        <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
          <div>
            <div className="text-sm font-bold text-gray-900">Cho phép thanh toán bằng QR</div>
            <div className="text-xs text-gray-500 mt-0.5">Tắt lựa chọn này nếu tài khoản đang bảo trì.</div>
          </div>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="w-5 h-5 accent-[#0E7A32]"
          />
        </label>

        {isPaymentsBackendConfigured && (
          <div>
            <label htmlFor="payment-admin-key" className="block text-xs font-bold text-gray-700 mb-1.5">
              Khóa quản trị thanh toán
            </label>
            <input
              id="payment-admin-key"
              type="password"
              required
              autoComplete="new-password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Nhập FRESHMART_ADMIN_SETUP_KEY"
              className="w-full h-[44px] border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
            />
            <p className="text-[11px] text-gray-400 mt-1">Khóa chỉ được gửi qua HTTPS khi lưu và không được lưu trong trình duyệt.</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã lưu cấu hình
            </span>
          )}
          {!saved && message && <span className="text-xs font-bold text-red-600">{message}</span>}
          <button
            type="submit"
            disabled={isSaving}
            className="h-[42px] px-5 rounded-xl bg-[#0E7A32] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#0A5C25]"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}
          </button>
        </div>
      </form>

      <div className="xl:col-span-5 space-y-4">
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-[#0E7A32]" />
            <h3 className="font-bold text-sm text-gray-900">Xem trước QR</h3>
          </div>
          {previewUrl ? (
            <img src={previewUrl} alt="QR chuyển khoản thử" className="w-full max-w-[320px] mx-auto rounded-xl" />
          ) : (
            <div className="aspect-square max-w-[320px] mx-auto rounded-xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-6">
              <Building2 className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-xs text-gray-500">Nhập đầy đủ số tài khoản và tên chủ tài khoản để xem QR thử.</p>
            </div>
          )}
        </div>

        <div className="rounded-[16px] bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <p className="text-xs text-emerald-900 leading-relaxed">
            {isPaymentsBackendConfigured
              ? 'Tài khoản được lưu trên máy chủ và webhook SePay sẽ tự đối soát giao dịch hợp lệ.'
              : 'Đây là chế độ dùng thử cục bộ. Cấu hình Supabase để bật xác nhận thanh toán tự động.'}
          </p>
        </div>
      </div>
    </div>
  );
};
