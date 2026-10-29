import React from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AdminProvider } from './context/AdminContext';
import { OrderProvider } from './context/OrderContext';
import { SiteProfileProvider } from './context/SiteProfileContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { AuthModal } from './components/common/AuthModal';

// Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { AccountPage } from './pages/AccountPage';
import { NewsPage } from './pages/NewsPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { ContactPage } from './pages/ContactPage';
import { ContactFloatingWidget } from './components/common/ContactFloatingWidget';
import { SeoHead } from './components/common/SeoHead';

const AdminPage = React.lazy(() => import('./pages/AdminPage').then((module) => ({
  default: module.AdminPage,
})));

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Layout Wrapper
function Layout() {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');

  // Mặc định giao diện điện thoại cho trang chủ và về chúng tôi ở chế độ xem máy tính
  React.useEffect(() => {
    const isDesktopPage = location.pathname === '/' || location.pathname === '/about';
    const meta = document.getElementById('app-viewport') || document.querySelector('meta[name="viewport"]');

    const updateMobileViewport = () => {
      const isMobile =
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        (window.screen.width <= 500 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

      if (isMobile) {
        document.documentElement.classList.add('is-mobile-device');
        document.body.classList.add('is-mobile-device');

        if (isDesktopPage) {
          const sw = window.screen.width || 390;
          const s = (sw / 1280).toFixed(4);
          if (meta) {
            meta.setAttribute('content', `width=1280, initial-scale=${s}, maximum-scale=3.0, user-scalable=yes`);
          }
          document.documentElement.classList.add('force-desktop-mode');
          document.body.classList.add('force-desktop-mode');
        } else {
          if (meta) {
            meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
          }
          document.documentElement.classList.remove('force-desktop-mode');
          document.body.classList.remove('force-desktop-mode');
        }
      } else {
        document.documentElement.classList.remove('is-mobile-device');
        document.body.classList.remove('is-mobile-device');
        document.documentElement.classList.remove('force-desktop-mode');
        document.body.classList.remove('force-desktop-mode');
        if (meta) {
          meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
      }
    };

    updateMobileViewport();
    window.addEventListener('resize', updateMobileViewport);
    window.addEventListener('orientationchange', updateMobileViewport);

    return () => {
      window.removeEventListener('resize', updateMobileViewport);
      window.removeEventListener('orientationchange', updateMobileViewport);
    };
  }, [location.pathname]);

  if (isAdmin) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#F8F9F5] flex items-center justify-center">
          <div className="text-sm font-semibold text-[#0E7A32]">Đang xác thực tài khoản quản trị...</div>
        </div>
      );
    }
    if (!user || user.role !== 'admin') {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return (
      <>
        <ScrollToTop />
        <SeoHead />
        <React.Suspense fallback={(
          <div className="min-h-screen bg-[#F8F9F5] flex items-center justify-center">
            <div className="text-sm font-semibold text-[#0E7A32]">Đang tải trang quản trị...</div>
          </div>
        )}>
          <Routes>
            <Route path="/admin/*" element={<AdminPage />} />
          </Routes>
        </React.Suspense>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F5]">
      <ScrollToTop />
      <SeoHead />
      <Header />
      <main className={`flex-1 ${location.pathname === '/' || location.pathname === '/about' ? 'pb-0' : 'pb-20 md:pb-0'}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<CategoryPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<ArticleDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
      <ContactFloatingWidget />
      <AuthModal />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteProfileProvider>
          <FavoritesProvider>
            <CartProvider>
              <AdminProvider>
                <OrderProvider>
                  <Layout />
                </OrderProvider>
              </AdminProvider>
            </CartProvider>
          </FavoritesProvider>
        </SiteProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
