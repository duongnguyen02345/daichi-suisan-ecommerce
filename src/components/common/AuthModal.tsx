import React, { useState } from 'react';
import { X, Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMessage,
    login,
    signIn,
    signUp,
    isDemoMode,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage('');
    const result = activeTab === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, fullName.trim());
    setIsSubmitting(false);
    setFormMessage(result.message);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      {/* Modal conforming to Section 14 (Radius 28px), Section 15 (Shadow 0 20px 50px rgba(0,0,0,0.18)), Section 18 (Fade + Slide Up) */}
      <div 
        className="bg-white rounded-[28px] max-w-lg w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-[#E5E7EB] relative animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] rounded-full bg-gray-100 text-[#6B7280] hover:bg-gray-200 hover:text-[#111827] flex items-center justify-center transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Info Banner */}
        <div className="bg-[#FFF7E9] border-b border-amber-200/50 p-4 px-6 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-amber-950">Yêu cầu đăng nhập</h4>
            <p className="text-[12px] text-amber-800/90 mt-0.5">{authModalMessage}</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Tabs */}
          <div className="flex border-b border-[#E5E7EB] mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 pb-3 text-center text-[14px] font-bold transition-colors relative ${
                activeTab === 'login' ? 'text-[#0E7A32]' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Đăng nhập
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0E7A32]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 pb-3 text-center text-[14px] font-bold transition-colors relative ${
                activeTab === 'register' ? 'text-[#0E7A32]' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Tạo tài khoản
              {activeTab === 'register' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0E7A32]" />
              )}
            </button>
          </div>

          {/* Quick Demo Switcher */}
          {isDemoMode && <div className="mb-6 p-3 bg-[#F1F8E9] border border-emerald-100 rounded-[12px]">
            <div className="text-[12px] font-semibold text-emerald-900 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0E7A32]" />
              Đăng nhập thử nghiệm (Demo):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => login('customer')}
                className="bg-[#0E7A32] text-white h-[38px] rounded-[12px] text-[13px] font-semibold hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5 shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                Khách hàng
              </button>
              <button
                type="button"
                onClick={() => login('admin')}
                className="bg-[#064E3B] text-white h-[38px] rounded-[12px] text-[13px] font-semibold hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </button>
            </div>
          </div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <div>
                <label className="block text-[13px] font-semibold text-[#111827] mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 h-[44px] border border-[#E5E7EB] rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-[#111827] mb-1">Email hoặc số điện thoại</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email hoặc SĐT của bạn"
                  className="w-full pl-10 pr-4 h-[44px] border border-[#E5E7EB] rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#111827] mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-10 h-[44px] border border-[#E5E7EB] rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-[#6B7280] hover:text-[#111827]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {activeTab === 'login' && (
              <div className="text-right">
                <a href="#forgot" className="text-[13px] text-[#0E7A32] hover:underline font-semibold">
                  Quên mật khẩu?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[44px] bg-[#0E7A32] text-white rounded-[12px] font-semibold text-[14px] hover:scale-[1.02] transition-transform duration-[250ms] shadow-xs disabled:opacity-60 disabled:cursor-wait"
            >
              {isSubmitting ? 'Đang xử lý...' : activeTab === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
            </button>
            {formMessage && (
              <p role="status" className="text-[12px] text-center font-semibold text-[#6B7280]">
                {formMessage}
              </p>
            )}
          </form>

          {/* Social Logins */}
          <div className="mt-6 text-center">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#E5E7EB]"></div>
              <span className="flex-shrink mx-4 text-[12px] text-[#6B7280] font-medium">Hoặc tiếp tục với</span>
              <div className="flex-grow border-t border-[#E5E7EB]"></div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <button 
                type="button"
                onClick={() => login('customer')}
                className="flex items-center justify-center gap-1.5 h-[42px] border border-[#E5E7EB] rounded-[12px] text-[13px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-red-500">G</span> Google
              </button>
              <button 
                type="button"
                onClick={() => login('customer')}
                className="flex items-center justify-center gap-1.5 h-[42px] border border-[#E5E7EB] rounded-[12px] text-[13px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-blue-600">f</span> Facebook
              </button>
              <button 
                type="button"
                onClick={() => login('customer')}
                className="flex items-center justify-center gap-1.5 h-[42px] border border-[#E5E7EB] rounded-[12px] text-[13px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors"
              >
                Apple
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
