import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  Edit2,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Heart,
  Bell,
  Headphones,
  Settings,
  LogOut,
  Gift,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { AccountOrders } from '../components/account/AccountOrders';
import { ProductCard } from '../components/common/ProductCard';
import { useOrders } from '../context/OrderContext';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'overview';

  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const { orders } = useOrders();
  const orderCounts = {
    pending: orders.filter((order) => order.status === 'pending' || order.status === 'awaiting_payment').length,
    shipping: orders.filter((order) => order.status === 'shipping').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    returned: orders.filter((order) => order.status === 'returned').length,
  };

  const [activeOrderFilter, setActiveOrderFilter] = useState<'all' | 'pending' | 'shipping' | 'delivered' | 'returned'>('all');

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="w-20 h-20 bg-emerald-50 text-[#0E7A32] rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
        <p className="text-xs text-gray-500 mb-6">Bạn cần đăng nhập để quản lý tài khoản và đơn hàng của mình.</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center bg-[#0E7A32] text-white px-8 h-[42px] rounded-[12px] font-semibold text-xs hover:bg-[#0A5C25] transition hover:scale-[1.02] shadow-md"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 py-6 md:py-8 lg:py-10 pb-24 md:pb-20 animate-fadeIn space-y-6 md:space-y-8">
      
      {/* 1. Profile Hero Card */}
      <div className="relative rounded-[12px] overflow-hidden bg-gradient-to-r from-[#D5EADF] via-[#E4F3EB] to-[#CDE5D8] p-5 sm:p-6 border border-emerald-900/10 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar with Camera icon */}
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-white shadow-md"
              />
              <button 
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0E7A32] text-white flex items-center justify-center shadow-xs hover:bg-[#0A5C25] transition"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User info */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{user.name}</h2>
                <Edit2 className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-700" />
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>
              <p className="text-xs text-gray-500">{user.phone}</p>
              
              {user.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 bg-white/80 hover:bg-white backdrop-blur-xs text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full mt-2 shadow-2xs transition-colors"
                  aria-label="Mở trang quản trị"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quản trị viên · Mở trang quản trị</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-xs text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-2 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{user.memberTier}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fresh crate image illustration right side */}
          <div className="hidden sm:block w-36 h-24 rounded-[12px] overflow-hidden shadow-xs border border-white/60">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80" 
              alt="Fresh food crate"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 2. Đơn hàng của tôi (4 Status Pills) */}
      <div className="bg-white rounded-[12px] p-5 sm:p-6 border border-[#E5E7EB] shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Đơn hàng của tôi</h3>
          <button
            onClick={() => {
              setSearchParams({ tab: 'orders' });
              setActiveOrderFilter('all');
            }}
            className="text-xs font-bold text-[#0E7A32] flex items-center gap-1 hover:underline"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {/* Chờ xác nhận */}
          <button
            onClick={() => {
              setSearchParams({ tab: 'orders' });
              setActiveOrderFilter('pending');
            }}
            className="flex flex-col items-center p-3 rounded-[12px] bg-gray-50/70 hover:bg-emerald-50 transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0E7A32] flex items-center justify-center mb-1 group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-gray-600 font-medium line-clamp-1">Chờ xác nhận</span>
            <span className="text-xs font-black text-gray-900 mt-0.5">{orderCounts.pending}</span>
          </button>

          {/* Đang giao */}
          <button
            onClick={() => {
              setSearchParams({ tab: 'orders' });
              setActiveOrderFilter('shipping');
            }}
            className="flex flex-col items-center p-3 rounded-[12px] bg-gray-50/70 hover:bg-blue-50 transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-gray-600 font-medium line-clamp-1">Đang giao</span>
            <span className="text-xs font-black text-gray-900 mt-0.5">{orderCounts.shipping}</span>
          </button>

          {/* Đã giao */}
          <button
            onClick={() => {
              setSearchParams({ tab: 'orders' });
              setActiveOrderFilter('delivered');
            }}
            className="flex flex-col items-center p-3 rounded-[12px] bg-gray-50/70 hover:bg-emerald-50 transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-gray-600 font-medium line-clamp-1">Đã giao</span>
            <span className="text-xs font-black text-gray-900 mt-0.5">{orderCounts.delivered}</span>
          </button>

          {/* Đổi trả */}
          <button
            onClick={() => {
              setSearchParams({ tab: 'orders' });
              setActiveOrderFilter('returned');
            }}
            className="flex flex-col items-center p-3 rounded-[12px] bg-gray-50/70 hover:bg-rose-50 transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-1 group-hover:scale-110 transition">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-gray-600 font-medium line-clamp-1">Đổi trả</span>
            <span className="text-xs font-black text-gray-900 mt-0.5">{orderCounts.returned}</span>
          </button>
        </div>
      </div>

      {/* Orders List if activeTab is orders */}
      {activeTabParam === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base">Danh sách đơn hàng</h3>
            <button
              onClick={() => setSearchParams({ tab: 'overview' })}
              className="text-xs text-[#0E7A32] font-semibold hover:underline"
            >
              Thu gọn
            </button>
          </div>
          <AccountOrders orders={orders} activeFilter={activeOrderFilter} />
        </div>
      )}

      {/* 3. Account Navigation Menu List */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-card divide-y divide-gray-100 overflow-hidden">
        {/* Địa chỉ nhận hàng */}
        <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer transition">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-emerald-50 text-[#0E7A32] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">Địa chỉ nhận hàng</h4>
              <p className="text-[11px] text-gray-500">Quản lý địa chỉ giao hàng của bạn</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>2 địa chỉ</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Sản phẩm yêu thích */}
        <div 
          onClick={() => setSearchParams({ tab: 'favorites' })}
          className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-rose-50 text-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">Sản phẩm yêu thích</h4>
              <p className="text-[11px] text-gray-500">Danh sách sản phẩm bạn quan tâm</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>{favorites.length} sản phẩm</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Thông báo */}
        <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer transition">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-emerald-50 text-[#0E7A32] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">Thông báo</h4>
              <p className="text-[11px] text-gray-500">Cập nhật đơn hàng, khuyến mãi mới nhất</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-5 h-5 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center">
              3
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Hỗ trợ khách hàng */}
        <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer transition">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-blue-50 text-blue-600 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">Hỗ trợ khách hàng</h4>
              <p className="text-[11px] text-gray-500">Câu hỏi thường gặp, liên hệ CSKH</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Cài đặt tài khoản */}
        <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer transition">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-gray-100 text-gray-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">Cài đặt tài khoản</h4>
              <p className="text-[11px] text-gray-500">Thông tin cá nhân, bảo mật</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Đăng xuất */}
        <div 
          onClick={handleLogout}
          className="p-4 sm:p-5 flex items-center justify-between hover:bg-rose-50/30 cursor-pointer transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-600">Đăng xuất</h4>
              <p className="text-[11px] text-gray-400">Thoát khỏi tài khoản hiện tại</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {/* 4. Promotional Banner Card: Ưu đãi dành riêng cho bạn */}
      <div className="bg-gradient-to-r from-[#FFF4DF] via-[#FFF8EB] to-[#FFECCC] border border-amber-200/60 rounded-[12px] p-5 flex items-center justify-between gap-4 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[12px] bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">Ưu đãi dành riêng cho bạn</h4>
            <p className="text-xs text-amber-900/80 mt-0.5">Khám phá các khuyến mãi dành cho thành viên</p>
          </div>
        </div>

        <Link
          to="/category/khuyen-mai"
          className="h-[38px] sm:h-[42px] px-5 bg-[#FF9F1C] text-white rounded-[12px] text-xs font-semibold hover:bg-[#F08C00] transition flex items-center gap-1 flex-shrink-0 shadow-xs hover:scale-[1.02]"
        >
          <span>Xem ngay</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 5. Sản phẩm yêu thích Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl lg:text-[32px] font-bold text-[#111827]">Sản phẩm yêu thích</h3>
          <Link to="/products" className="text-xs sm:text-sm font-semibold text-[#0E7A32] flex items-center gap-1 hover:underline">
            <span>Xem thêm</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 justify-items-center">
          {favorites.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
};
