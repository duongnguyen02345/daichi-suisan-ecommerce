import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Plus, ChevronDown } from 'lucide-react';
import { AdminSidebar, adminSidebarGroups } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { ProductTable } from '../components/admin/ProductTable';
import { ProductFormModal } from '../components/admin/ProductFormModal';
import { AdminPaymentSettings } from '../components/admin/AdminPaymentSettings';
import { CategoriesSection } from '../components/admin/CategoriesSection';
import { OrdersSection } from '../components/admin/OrdersSection';
import { ArticlesSection } from '../components/admin/ArticlesSection';
import { CustomersSection, ReportsSection } from '../components/admin/AdminInsightsSections';
import { ContactCenterSection } from '../components/admin/ContactCenterSection';
import { SiteProfileSection } from '../components/admin/SiteProfileSection';
import { PageSectionsSection } from '../components/admin/PageSectionsSection';
import { NavigationSection } from '../components/admin/NavigationSection';
import { MediaLibrarySection } from '../components/admin/MediaLibrarySection';
import { SeoSection } from '../components/admin/SeoSection';
import { PromotionsSection } from '../components/admin/PromotionsSection';
import { ReviewsSection } from '../components/admin/ReviewsSection';
import { AuditLogsSection } from '../components/admin/AuditLogsSection';
import {
  AdminDashboardSection,
  AdminDataNotice,
  AdminPlaceholderSection,
  BannersSection,
  InventorySection,
} from '../components/admin/AdminSections';
import { Product } from '../types';

interface RouteMeta {
  group: string;
  title: string;
  description: string;
}

const routesConfig: Record<string, RouteMeta> = {
  '/admin/dashboard': {
    group: 'Tổng quan',
    title: 'Dashboard Tổng quan',
    description: 'Theo dõi nhanh hoạt động kinh doanh, việc cần xử lý và hiệu suất bán hàng.',
  },
  '/admin/audit-logs': {
    group: 'Tổng quan',
    title: 'Nhật ký hoạt động',
    description: 'Theo dõi và đối soát mọi thao tác thay đổi dữ liệu của quản trị viên.',
  },
  '/admin/orders': {
    group: 'Bán hàng',
    title: 'Quản lý đơn hàng',
    description: 'Theo dõi danh sách đơn hàng, xác minh thanh toán VietQR và trạng thái giao hàng.',
  },
  '/admin/customers': {
    group: 'Bán hàng',
    title: 'Quản lý khách hàng',
    description: 'Hồ sơ người mua, lịch sử đặt hàng và số lượt ghé thăm.',
  },
  '/admin/reports': {
    group: 'Bán hàng',
    title: 'Báo cáo bán hàng',
    description: 'Doanh thu, số lượng đơn hoàn tất và các chỉ số kinh doanh then chốt.',
  },
  '/admin/products': {
    group: 'Sản phẩm',
    title: 'Quản lý sản phẩm',
    description: 'Quản lý thông tin, giá bán, tồn kho và hình ảnh hải sản trên website.',
  },
  '/admin/categories': {
    group: 'Sản phẩm',
    title: 'Danh mục sản phẩm',
    description: 'Sắp xếp thứ tự và cấu hình các nhóm hải sản hiển thị trên cửa hàng.',
  },
  '/admin/inventory': {
    group: 'Sản phẩm',
    title: 'Kho hàng & Tồn kho',
    description: 'Điều chỉnh số lượng thực tế trong kho, tự động cập nhật trạng thái còn hoặc hết hàng.',
  },
  '/admin/promotions': {
    group: 'Marketing',
    title: 'Khuyến mại & Voucher',
    description: 'Tạo mã ưu đãi cố định, theo phần trăm hoặc miễn phí vận chuyển với điều kiện rõ ràng.',
  },
  '/admin/banners': {
    group: 'Marketing',
    title: 'Quản lý banner',
    description: 'Cập nhật hình ảnh banner máy tính, mobile và luân phiên tự động trên website.',
  },
  '/admin/articles': {
    group: 'Marketing',
    title: 'Đăng bài viết',
    description: 'Soạn thảo, xuất bản tin tức, cẩm nang ẩm thực và công thức nấu hải sản Nhật.',
  },
  '/admin/reviews': {
    group: 'Marketing',
    title: 'Đánh giá sản phẩm',
    description: 'Kiểm duyệt phản hồi của khách hàng, gắn sao và xuất bản câu trả lời từ cửa hàng.',
  },
  '/admin/website/profile': {
    group: 'Quản lý website',
    title: 'Hồ sơ & Logo website',
    description: 'Cấu hình tên thương hiệu DAICHI SUISAN, logo, hotline, email và địa chỉ kho.',
  },
  '/admin/website/pages': {
    group: 'Quản lý website',
    title: 'Nội dung các trang (CMS)',
    description: 'Chỉnh sửa tiêu đề, mô tả, hình ảnh và khối thông điệp của Trang chủ, Giới thiệu, Liên hệ.',
  },
  '/admin/website/navigation': {
    group: 'Quản lý website',
    title: 'Menu & Điều hướng',
    description: 'Tùy chỉnh menu header, liên kết chân trang và chính sách hiển thị cho khách hàng.',
  },
  '/admin/website/media': {
    group: 'Quản lý website',
    title: 'Thư viện hình ảnh (Media)',
    description: 'Quản lý kho ảnh tập trung, kiểm tra trạng thái đang được sử dụng và sao chép đường dẫn.',
  },
  '/admin/website/seo': {
    group: 'Quản lý website',
    title: 'Cấu hình SEO & Meta',
    description: 'Tối ưu tiêu đề, mô tả tìm kiếm Google và thẻ xem trước Open Graph trên mạng xã hội.',
  },
  '/admin/contact': {
    group: 'Hệ thống',
    title: 'Liên hệ & Tin nhắn',
    description: 'Kênh hỗ trợ trực tuyến và xử lý thắc mắc từ khách hàng.',
  },
  '/admin/settings': {
    group: 'Hệ thống',
    title: 'Cài đặt thanh toán',
    description: 'Cấu hình tài khoản ngân hàng và mã QR VietQR tạo tự động cho đơn hàng.',
  },
};

export const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Backward compatibility with legacy ?tab= query
  useEffect(() => {
    const tab = searchParams.get('tab');
    const path = location.pathname;

    if (path === '/admin' || path === '/admin/') {
      if (tab) {
        const legacyTabMap: Record<string, string> = {
          'site-profile': '/admin/website/profile',
          pages: '/admin/website/pages',
          navigation: '/admin/website/navigation',
          media: '/admin/website/media',
          seo: '/admin/website/seo',
          dashboard: '/admin/dashboard',
          products: '/admin/products',
          categories: '/admin/categories',
          orders: '/admin/orders',
          inventory: '/admin/inventory',
          promotions: '/admin/promotions',
          banners: '/admin/banners',
          articles: '/admin/articles',
          customers: '/admin/customers',
          reports: '/admin/reports',
          reviews: '/admin/reviews',
          contact: '/admin/contact',
          settings: '/admin/settings',
          'audit-logs': '/admin/audit-logs',
        };
        const target = legacyTabMap[tab] || `/admin/${tab}`;
        navigate(target, { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [location.pathname, searchParams, navigate]);

  const currentPath = location.pathname;
  const currentMeta = routesConfig[currentPath] || {
    group: 'Quản trị',
    title: 'Bảng điều khiển',
    description: 'Hệ thống quản lý nội dung và bán hàng DAICHI SUISAN.',
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/admin/dashboard':
        return <AdminDashboardSection />;
      case '/admin/products':
        return (
          <div className="grid grid-cols-1 gap-6 items-start">
            <ProductTable onEditProduct={handleEditProduct} />
          </div>
        );
      case '/admin/categories':
        return <CategoriesSection />;
      case '/admin/orders':
        return <OrdersSection />;
      case '/admin/customers':
        return <CustomersSection />;
      case '/admin/reports':
        return <ReportsSection />;
      case '/admin/inventory':
        return <InventorySection />;
      case '/admin/banners':
        return <BannersSection />;
      case '/admin/promotions':
        return <PromotionsSection />;
      case '/admin/articles':
        return <ArticlesSection />;
      case '/admin/reviews':
        return <ReviewsSection />;
      case '/admin/contact':
        return <ContactCenterSection />;
      case '/admin/website/profile':
        return <SiteProfileSection />;
      case '/admin/website/pages':
        return <PageSectionsSection />;
      case '/admin/website/navigation':
        return <NavigationSection />;
      case '/admin/website/media':
        return <MediaLibrarySection />;
      case '/admin/website/seo':
        return <SeoSection />;
      case '/admin/settings':
        return <AdminPaymentSettings />;
      case '/admin/audit-logs':
        return <AuditLogsSection />;
      default:
        return <AdminDashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex">
      {/* Dark Green Admin Sidebar: Width 260px, Background #064E3B */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0">
        <AdminHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenPaymentReports={() => navigate('/admin/orders')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fadeIn">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center gap-1.5 text-[13px] text-[#6B7280] mb-4">
            <Link to="/" className="hover:text-[#0E7A32] transition">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500 font-medium">{currentMeta.group}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-bold text-[#111827]">{currentMeta.title}</span>
          </nav>

          {/* Page Title & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
            <div>
              <h1 className="text-[22px] lg:text-[28px] font-black text-[#111827] tracking-tight">
                {currentMeta.title}
              </h1>
              <p className="text-[13px] text-[#6B7280] mt-1 leading-relaxed">
                {currentMeta.description}
              </p>
            </div>

            {currentPath === '/admin/products' && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleOpenAdd}
                  className="bg-[#0E7A32] text-white px-5 h-[42px] rounded-[12px] font-semibold text-[13px] hover:scale-[1.02] transition-transform duration-[250ms] shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm sản phẩm</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                </button>
              </div>
            )}
          </div>

          <AdminDataNotice />
          {renderContent()}
        </main>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        product={editingProduct}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
