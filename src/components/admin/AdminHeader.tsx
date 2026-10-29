import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Package,
  ShoppingBag,
  Users,
  FilePenLine,
  Tag,
  Image as ImageIcon,
  Warehouse,
  Globe2,
  LayoutTemplate,
  Compass,
  FolderOpen,
  SearchCheck,
  Settings,
  History,
  MessageSquare,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useAdmin } from '../../context/AdminContext';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  onOpenPaymentReports: () => void;
}

interface SearchResultItem {
  id: string;
  group: 'modules' | 'products' | 'orders' | 'articles';
  title: string;
  subtitle?: string;
  path: string;
  icon: any;
}

const adminModulesConfig: Array<{ title: string; keywords: string; path: string; icon: any }> = [
  { title: 'Tổng quan (Dashboard)', keywords: 'dashboard tong quan thong ke doanh thu', path: '/admin/dashboard', icon: Package },
  { title: 'Quản lý sản phẩm', keywords: 'san pham catalog gia ban them sua xoa', path: '/admin/products', icon: Package },
  { title: 'Danh mục sản phẩm', keywords: 'danh muc categories phan loai nhom', path: '/admin/categories', icon: Package },
  { title: 'Quản lý đơn hàng', keywords: 'don hang orders van chuyen thanh toan', path: '/admin/orders', icon: ShoppingBag },
  { title: 'Khách hàng', keywords: 'khach hang customers nguoi mua ho so', path: '/admin/customers', icon: Users },
  { title: 'Kho hàng & Tồn kho', keywords: 'kho hang inventory ton kho so luong nhap', path: '/admin/inventory', icon: Warehouse },
  { title: 'Chương trình khuyến mại', keywords: 'khuyen mai promotions ma giam gia uu dai voucher coupon', path: '/admin/promotions', icon: Tag },
  { title: 'Quản lý banner', keywords: 'banner hinh anh quang cao slider hero footer', path: '/admin/banners', icon: ImageIcon },
  { title: 'Đăng bài viết & Tin tức', keywords: 'bai viet articles tin tuc blog kien thuc am thuc', path: '/admin/articles', icon: FilePenLine },
  { title: 'Đánh giá sản phẩm', keywords: 'danh gia reviews binh luan sao feedback phan hoi', path: '/admin/reviews', icon: MessageSquare },
  { title: 'Hồ sơ & Logo website', keywords: 'thong tin website site profile logo cong ty dia chi hotline email', path: '/admin/website/profile', icon: Globe2 },
  { title: 'Nội dung các trang (CMS)', keywords: 'noi dung trang pages page sections trang chu ve chung toi lien he', path: '/admin/website/pages', icon: LayoutTemplate },
  { title: 'Menu & Footer (Điều hướng)', keywords: 'menu footer navigation header dieu huong lien ket', path: '/admin/website/navigation', icon: Compass },
  { title: 'Thư viện hình ảnh (Media)', keywords: 'thu vien hinh anh media assets upload tai anh storage', path: '/admin/website/media', icon: FolderOpen },
  { title: 'Cấu hình SEO & Meta', keywords: 'seo meta title description open graph search ranking', path: '/admin/website/seo', icon: SearchCheck },
  { title: 'Liên hệ & Tin nhắn', keywords: 'lien he contact tin nhan khach hang ho tro', path: '/admin/contact', icon: MessageSquare },
  { title: 'Cài đặt thanh toán', keywords: 'cai dat thanh toan settings ngan hang bank qr vietqr', path: '/admin/settings', icon: Settings },
  { title: 'Nhật ký hoạt động (Audit)', keywords: 'nhat ky audit logs lich su thay doi kiem toan', path: '/admin/audit-logs', icon: History },
];

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, onOpenPaymentReports }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { products } = useAdmin();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo<SearchResultItem[]>(() => {
    if (!debouncedQuery) return [];

    const q = debouncedQuery.toLowerCase();
    const results: SearchResultItem[] = [];

    // 1. Matched Admin Modules
    adminModulesConfig.forEach((mod) => {
      if (mod.title.toLowerCase().includes(q) || mod.keywords.toLowerCase().includes(q)) {
        results.push({
          id: `mod-${mod.path}`,
          group: 'modules',
          title: mod.title,
          path: mod.path,
          icon: mod.icon,
        });
      }
    });

    // 2. Matched Products (up to 5)
    let productMatches = 0;
    products.forEach((prod) => {
      if (productMatches < 5) {
        if (prod.name.toLowerCase().includes(q) || (prod.sku && prod.sku.toLowerCase().includes(q))) {
          results.push({
            id: `prod-${prod.id}`,
            group: 'products',
            title: prod.name,
            subtitle: `SKU: ${prod.sku || 'N/A'} · Giá: ${prod.price?.toLocaleString('vi-VN')} đ`,
            path: `/admin/products`,
            icon: Package,
          });
          productMatches++;
        }
      }
    });

    // 3. Matched Orders (up to 4)
    let orderMatches = 0;
    orders.forEach((ord) => {
      if (orderMatches < 4) {
        if (
          ord.id.toLowerCase().includes(q) ||
          (ord.code && ord.code.toLowerCase().includes(q)) ||
          ord.recipientName.toLowerCase().includes(q) ||
          (ord.phone && ord.phone.includes(q))
        ) {
          results.push({
            id: `ord-${ord.id}`,
            group: 'orders',
            title: `Đơn ${ord.code || ord.id.slice(0, 8)} - ${ord.recipientName}`,
            subtitle: `SĐT: ${ord.phone} · Tổng: ${ord.total?.toLocaleString('vi-VN')} đ`,
            path: `/admin/orders`,
            icon: ShoppingBag,
          });
          orderMatches++;
        }
      }
    });

    return results;
  }, [debouncedQuery, products, orders]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = searchResults[selectedIndex];
      if (item) {
        handleSelect(item);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    navigate(item.path);
    setIsOpen(false);
    setQuery('');
  };

  const paymentReportCount = orders.filter((order) => order.paymentStatus === 'customer_reported').length;
  const adminName = user?.name || 'Admin';
  const adminInitial = adminName.trim().charAt(0).toLocaleUpperCase('vi') || 'A';

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-[12px] text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Live Search */}
        <div ref={containerRef} className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm sản phẩm, đơn hàng, module quản trị..."
            className="w-full bg-gray-50 border border-gray-200 rounded-[12px] pl-10 pr-8 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E7A32] focus:bg-white text-gray-800 transition"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Modal */}
          {isOpen && debouncedQuery && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[460px] overflow-y-auto animate-fadeIn text-xs">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <div>Không tìm thấy kết quả phù hợp cho "{debouncedQuery}"</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Thử tìm theo tên món (Saba, Hokke), mã đơn, hoặc tên chức năng (banner, seo, kho).
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {/* Modules Group */}
                  {searchResults.some((r) => r.group === 'modules') && (
                    <div>
                      <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70">
                        Chức năng quản trị
                      </div>
                      {searchResults
                        .filter((r) => r.group === 'modules')
                        .map((item) => {
                          const idx = searchResults.indexOf(item);
                          const Icon = item.icon;
                          const isSelected = idx === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition ${
                                isSelected ? 'bg-emerald-50 text-[#0E7A32]' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4 text-[#0E7A32]" />
                                <span className="font-semibold">{item.title}</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {/* Products Group */}
                  {searchResults.some((r) => r.group === 'products') && (
                    <div className="mt-1">
                      <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70">
                        Sản phẩm
                      </div>
                      {searchResults
                        .filter((r) => r.group === 'products')
                        .map((item) => {
                          const idx = searchResults.indexOf(item);
                          const isSelected = idx === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition ${
                                isSelected ? 'bg-emerald-50 text-[#0E7A32]' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Package className="w-4 h-4 text-blue-500 flex-none" />
                                <div className="truncate">
                                  <div className="font-semibold truncate">{item.title}</div>
                                  {item.subtitle && (
                                    <div className="text-[10px] text-gray-400">{item.subtitle}</div>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 opacity-40 flex-none" />
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {/* Orders Group */}
                  {searchResults.some((r) => r.group === 'orders') && (
                    <div className="mt-1">
                      <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70">
                        Đơn hàng
                      </div>
                      {searchResults
                        .filter((r) => r.group === 'orders')
                        .map((item) => {
                          const idx = searchResults.indexOf(item);
                          const isSelected = idx === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition ${
                                isSelected ? 'bg-emerald-50 text-[#0E7A32]' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <ShoppingBag className="w-4 h-4 text-amber-500 flex-none" />
                                <div className="truncate">
                                  <div className="font-semibold truncate">{item.title}</div>
                                  {item.subtitle && (
                                    <div className="text-[10px] text-gray-400">{item.subtitle}</div>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 opacity-40 flex-none" />
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          type="button"
          onClick={onOpenPaymentReports}
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
          aria-label={paymentReportCount > 0
            ? `${paymentReportCount} đơn khách báo đã thanh toán`
            : 'Không có thông báo thanh toán mới'}
          title="Mở danh sách đơn cần xác minh thanh toán"
        >
          <Bell className="w-5 h-5" />
          {paymentReportCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {paymentReportCount > 99 ? '99+' : paymentReportCount}
            </span>
          ) : null}
        </button>

        {/* Admin profile pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            {adminInitial}
          </div>
          <div className="hidden md:block text-left">
            <div className="max-w-32 truncate text-xs font-bold text-gray-800 leading-tight">{adminName}</div>
            <div className="text-[10px] text-gray-400">Quản trị hệ thống</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
};
