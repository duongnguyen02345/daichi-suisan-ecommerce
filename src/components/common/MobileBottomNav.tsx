import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, FileText, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { totalItemsCount } = useCart();

  const navItems = [
    { label: 'Trang chủ', path: '/', icon: Home },
    { label: 'Sản phẩm', path: '/products', icon: LayoutGrid },
    { label: 'Giỏ hàng', path: '/cart', icon: ShoppingCart, badge: totalItemsCount },
    { label: 'Đơn hàng', path: '/account?tab=orders', icon: FileText },
    { label: 'Tài khoản', path: '/account', icon: User },
  ];

  return (
    <nav
      data-mobile-bottom-nav
      aria-label="Thanh điều hướng di động"
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 h-[68px] sm:h-[72px] bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] z-50 px-2 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] select-none"
    >
      <div className="grid grid-cols-5 h-full items-center max-w-[1280px] mx-auto">
        {navItems.map((item) => {
          const isHome = item.path === '/';
          const isOrders = item.path.includes('tab=orders');
          const isAccount = item.path === '/account';

          let isActive = false;
          if (isHome) {
            isActive = location.pathname === '/';
          } else if (isOrders) {
            isActive = location.pathname === '/account' && location.search.includes('tab=orders');
          } else if (isAccount) {
            isActive = location.pathname === '/account' && !location.search.includes('tab=orders');
          } else {
            isActive = location.pathname.startsWith(item.path.split('?')[0]);
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`nav-item min-w-[44px] min-h-[44px] flex flex-col items-center justify-center transition-colors ${
                isActive ? 'text-[#0E7A32]' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <div className="relative nav-icon-wrap flex items-center justify-center">
                <Icon
                  className={`nav-icon w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.5px] text-[#0E7A32] scale-105' : 'stroke-2 text-[#6B7280]'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge absolute -top-1.5 -right-2.5 bg-[#DC2626] text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-1 ring-white shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`nav-label text-[11px] mt-1 tracking-tight ${
                  isActive ? 'font-bold text-[#0E7A32]' : 'font-medium text-[#6B7280]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
