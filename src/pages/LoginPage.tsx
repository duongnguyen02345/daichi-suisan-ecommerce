import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Package, 
  Crown, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, signIn, signUp, isDemoMode } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage('');

    const result = activeTab === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, fullName.trim());

    setIsSubmitting(false);
    setFormMessage(result.message);
    if (result.success && activeTab === 'login') {
      navigate(result.role === 'admin' ? '/admin' : '/account');
    }
  };

  const handleDemoCustomer = () => {
    login('customer', 'lan.nguyen@mail.com');
    navigate('/account');
  };

  const handleDemoAdmin = () => {
    login('admin', 'admin@freshmart.vn');
    navigate('/admin');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 py-8 md:py-12 animate-fadeIn">
      <div className="bg-white rounded-[12px] shadow-card border border-[#E5E7EB] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Green Promotional Box (Spans 5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#EBF5EE] via-[#E2F0E7] to-[#D5EADF] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-r border-[#E5E7EB]">
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#0E7A32] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Tươi ngon mỗi ngày</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
              Thực phẩm tươi sạch<br />
              <span className="text-[#0E7A32]">Cho bữa ăn an toàn</span>
            </h2>

            <p className="text-xs text-gray-600 leading-relaxed mb-6 font-medium">
              Đăng nhập hoặc tạo tài khoản để mua sắm nhanh chóng, lưu giỏ hàng, theo dõi đơn hàng và nhận nhiều ưu đãi hấp dẫn từ FreshMart!
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-[#0E7A32] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Mua sắm nhanh hơn</h4>
                  <p className="text-[11px] text-gray-500">Lưu giỏ hàng, thanh toán dễ dàng</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-[#0E7A32] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Nhận nhiều ưu đãi</h4>
                  <p className="text-[11px] text-gray-500">Khuyến mãi dành riêng cho thành viên</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-[#0E7A32] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Theo dõi đơn hàng</h4>
                  <p className="text-[11px] text-gray-500">Cập nhật trạng thái đơn hàng realtime</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-[#0E7A32] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Trải nghiệm cá nhân hóa</h4>
                  <p className="text-[11px] text-gray-500">Gợi ý sản phẩm phù hợp với bạn</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fresh produce basket image */}
          <div className="relative z-10 mt-6 pt-4 border-t border-emerald-900/10">
            <div className="flex items-center justify-between text-xs font-serif italic text-emerald-800 font-bold mb-2">
              <span>Tươi ngon từ thiên nhiên đến bàn ăn</span>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80" 
              alt="Fresh vegetables box" 
              className="w-full h-28 object-cover rounded-[12px] shadow-sm"
            />
          </div>
        </div>

        {/* Right Form Box (Spans 7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 pb-4 text-center text-sm font-bold transition relative ${
                  activeTab === 'login' ? 'text-[#0E7A32]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Đăng nhập
                {activeTab === 'login' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0E7A32]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 pb-4 text-center text-sm font-bold transition relative ${
                  activeTab === 'register' ? 'text-[#0E7A32]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Tạo tài khoản
                {activeTab === 'register' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0E7A32]" />
                )}
              </button>
            </div>

            {/* Quick Demo Switcher */}
            {isDemoMode ? <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-[14px] flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Đăng nhập nhanh (Demo):
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDemoCustomer}
                  className="px-3.5 h-[34px] bg-[#0E7A32] text-white rounded-[10px] text-xs font-semibold hover:bg-[#0A5C25] transition hover:scale-[1.02] flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Khách hàng
                </button>
                <button
                  type="button"
                  onClick={handleDemoAdmin}
                  className="px-3.5 h-[34px] bg-slate-800 text-white rounded-[10px] text-xs font-semibold hover:bg-slate-700 transition hover:scale-[1.02] flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin
                </button>
              </div>
            </div> : null}

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {activeTab === 'login' ? 'Chào mừng bạn trở lại!' : 'Đăng ký tài khoản mới'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              {activeTab === 'login'
                ? 'Đăng nhập để tiếp tục mua sắm và trải nghiệm nhiều ưu đãi hấp dẫn cùng FreshMart.'
                : 'Trở thành thành viên FreshMart để nhận tích lũy điểm và quà tặng chào mừng.'}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên của bạn"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-[12px] text-xs focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email hoặc SĐT</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-[12px] text-xs focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-[12px] text-xs focus:ring-2 focus:ring-[#0E7A32]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {activeTab === 'login' && (
                <div className="text-right">
                  <a href="#forgot" className="text-xs text-[#0E7A32] font-semibold hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0E7A32] text-white h-[42px] rounded-[12px] font-semibold text-sm hover:bg-[#0A5C25] transition duration-200 hover:scale-[1.02] shadow-md shadow-emerald-800/15 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
              >
                {isSubmitting ? 'Đang xử lý...' : activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
              {formMessage && (
                <p role="status" className="text-xs text-center font-semibold text-gray-600">
                  {formMessage}
                </p>
              )}
            </form>

            {/* Social Logins */}
            <div className="mt-6 text-center">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-400 font-medium">Hoặc đăng nhập với</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleDemoCustomer}
                  className="flex items-center justify-center gap-2 h-[42px] border border-gray-200 rounded-[12px] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition hover:scale-[1.02]"
                >
                  <span className="text-red-500 font-black">G</span> Google
                </button>
                <button
                  type="button"
                  onClick={handleDemoCustomer}
                  className="flex items-center justify-center gap-2 h-[42px] border border-gray-200 rounded-[12px] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition hover:scale-[1.02]"
                >
                  <span className="text-blue-600 font-black">f</span> Facebook
                </button>
                <button
                  type="button"
                  onClick={handleDemoCustomer}
                  className="flex items-center justify-center gap-2 h-[42px] border border-gray-200 rounded-[12px] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition hover:scale-[1.02]"
                >
                  Apple
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                {activeTab === 'login' ? (
                  <>
                    Chưa có tài khoản?{' '}
                    <button
                      onClick={() => setActiveTab('register')}
                      className="text-[#0E7A32] font-semibold hover:underline"
                    >
                      Tạo tài khoản ngay
                    </button>
                  </>
                ) : (
                  <>
                    Đã có tài khoản?{' '}
                    <button
                      onClick={() => setActiveTab('login')}
                      className="text-[#0E7A32] font-semibold hover:underline"
                    >
                      Đăng nhập ngay
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Callout Note */}
          <div className="mt-8 bg-emerald-50/70 border border-emerald-100 rounded-[14px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0E7A32] text-white flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-emerald-950">
                Bạn có thể mua hàng mà không cần đăng nhập
              </h5>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">
              Chỉ cần nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng khi thanh toán. Đăng nhập là tùy chọn để nhận ưu đãi và quản lý đơn thuận tiện hơn.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
