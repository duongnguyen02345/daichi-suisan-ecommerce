import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Tag,
  Image as ImageIcon,
  Users,
  Warehouse,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronRight,
  ArrowLeft,
  FilePenLine,
  Globe2,
  LayoutTemplate,
  Compass,
  FolderOpen,
  SearchCheck,
  Star,
  History,
} from 'lucide-react';
import { useSiteProfile } from '../../context/SiteProfileContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarItem {
  id: string;
  path: string;
  label: string;
  icon: any;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export const adminSidebarGroups: SidebarGroup[] = [
  {
    title: 'Tổng quan',
    items: [
      { id: 'dashboard', path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'audit-logs', path: '/admin/audit-logs', label: 'Nhật ký hoạt động', icon: History },
    ],
  },
  {
    title: 'Bán hàng',
    items: [
      { id: 'orders', path: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
      { id: 'customers', path: '/admin/customers', label: 'Khách hàng', icon: Users },
      { id: 'reports', path: '/admin/reports', label: 'Báo cáo bán hàng', icon: BarChart3 },
    ],
  },
  {
    title: 'Sản phẩm',
    items: [
      { id: 'products', path: '/admin/products', label: 'Quản lý sản phẩm', icon: Package },
      { id: 'categories', path: '/admin/categories', label: 'Danh mục', icon: Layers },
      { id: 'inventory', path: '/admin/inventory', label: 'Kho hàng & Tồn kho', icon: Warehouse },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { id: 'promotions', path: '/admin/promotions', label: 'Khuyến mại & Voucher', icon: Tag },
      { id: 'banners', path: '/admin/banners', label: 'Quản lý banner', icon: ImageIcon },
      { id: 'articles', path: '/admin/articles', label: 'Đăng bài viết', icon: FilePenLine },
      { id: 'reviews', path: '/admin/reviews', label: 'Đánh giá sản phẩm', icon: Star },
    ],
  },
  {
    title: 'Quản lý website',
    items: [
      { id: 'site-profile', path: '/admin/website/profile', label: 'Hồ sơ & Logo', icon: Globe2 },
      { id: 'pages', path: '/admin/website/pages', label: 'Nội dung các trang', icon: LayoutTemplate },
      { id: 'navigation', path: '/admin/website/navigation', label: 'Menu & Điều hướng', icon: Compass },
      { id: 'media', path: '/admin/website/media', label: 'Thư viện hình ảnh', icon: FolderOpen },
      { id: 'seo', path: '/admin/website/seo', label: 'Cấu hình SEO', icon: SearchCheck },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { id: 'contact', path: '/admin/contact', label: 'Liên hệ & Tin nhắn', icon: MessageSquare },
      { id: 'settings', path: '/admin/settings', label: 'Cài đặt thanh toán', icon: Settings },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { profile } = useSiteProfile();
  const location = useLocation();

  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Admin Sidebar conforming to Section 16:
          Width 260px, Height 100vh, Background #064E3B */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[260px] h-screen bg-[#064E3B] text-white flex flex-col justify-between transition-transform duration-[250ms] lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo (Height 72px) */}
          <div className="h-[72px] px-6 flex items-center justify-between border-b border-emerald-900/60 flex-none">
            <Link to="/" className="flex items-center gap-2.5">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={`Logo ${profile.brandName}`}
                  className="h-9 max-w-[150px] object-contain object-left"
                />
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-amber-200/40 bg-[#9F1D24] text-xs font-black text-[#FCEBC2]">
                    大一
                  </div>
                  <span className="max-w-[165px] truncate text-[16px] font-black tracking-tight text-white">
                    {profile.brandName}
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Quick link back */}
          <div className="px-3 pt-3 pb-2 flex-none">
            <Link
              to="/"
              className="flex items-center gap-2 text-[12px] text-emerald-300 hover:text-white px-3 py-2 rounded-[12px] bg-emerald-950/40 hover:bg-emerald-950/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem trang khách hàng</span>
            </Link>
          </div>

          {/* Grouped Menu Items conforming to Section 16 */}
          <nav className="px-3 py-1 space-y-4 overflow-y-auto flex-1 no-scrollbar pb-6">
            {adminSidebarGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                  {group.title}
                </div>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path || (item.path !== '/admin/dashboard' && currentPath.startsWith(item.path));

                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={onClose}
                        className={`w-full h-[40px] flex items-center gap-2.5 px-3 rounded-[10px] text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'bg-[#0E7A32] text-white font-semibold shadow-xs'
                            : 'text-emerald-100/75 hover:bg-emerald-900/60 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
