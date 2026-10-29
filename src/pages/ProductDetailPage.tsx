import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Leaf, 
  ShieldCheck, 
  Heart,
  Sparkles,
  ArrowRight,
  Home
} from 'lucide-react';
import { ProductGallery } from '../components/product/ProductGallery';
import { ProductInfo } from '../components/product/ProductInfo';
import { ProductSidebarSpecs } from '../components/product/ProductSidebarSpecs';
import { ProductCard } from '../components/common/ProductCard';
import { useAdmin } from '../context/AdminContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useAdmin();
  const publishedProducts = products.filter(
    (item) => item.publicationStatus !== 'draft' && item.publicationStatus !== 'archived',
  );

  // Find product by slug or default to Táo Fuji (SP001)
  const product = publishedProducts.find((p) => p.slug === slug) || publishedProducts[0] || products[0];

  if (!product) {
    return <div className="max-w-[1320px] mx-auto px-4 py-16 text-center text-gray-500">Không tìm thấy sản phẩm.</div>;
  }

  // Related products: prioritize same category, then fallback to others
  const relatedProducts = publishedProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .concat(publishedProducts.filter((p) => p.category !== product.category && p.id !== product.id))
    .slice(0, 6);

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-5 lg:px-6 py-4 md:py-6 animate-fadeIn">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 sm:mb-5 flex-wrap">
        <Link to="/" className="hover:text-[#0E7A32] flex items-center gap-1 text-gray-500">
          <Home className="w-3.5 h-3.5 text-gray-500" />
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <Link to="/" className="hover:text-[#0E7A32] text-gray-600">
          Trang chủ
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <Link to={`/category/${product.category}`} className="hover:text-[#0E7A32] text-gray-600">
          {product.categoryName}
        </Link>
        {product.subcategory && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">{product.subcategory}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="font-bold text-[#0E7A32] truncate">{product.name}</span>
      </nav>

      {/* Main Container: Main Product Card (Gallery + Info) separated from Right Sidebar Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start mb-6 sm:mb-8">
        {/* Main Product Card: Gallery + Product Info */}
        <div className="lg:col-span-9 bg-white rounded-[12px] p-4 sm:p-6 border border-[#E5E7EB] shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left: Gallery */}
            <div className="flex flex-col">
              <ProductGallery product={product} />
            </div>

            {/* Right: Info & Purchasing */}
            <div className="flex flex-col">
              <ProductInfo product={product} />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Key Benefits & Product Specs - Separate Card Container */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <ProductSidebarSpecs product={product} />
        </div>
      </div>

      {/* 4 Bottom Assurance Pillars Strip */}
      <div className="bg-[#EBF5EE] border border-emerald-100 rounded-[12px] p-4 sm:p-5 lg:p-6 mb-8 sm:mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#0E7A32] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Leaf className="w-5 h-5 fill-white/10" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">100% tươi ngon mỗi ngày</h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">Tuyển chọn kỹ lưỡng từ nông trại</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#0E7A32] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">Nguồn gốc rõ ràng</h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">Nhập khẩu chính ngạch</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#0E7A32] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Heart className="w-5 h-5 fill-white/10" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">Tốt cho sức khỏe</h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">Giàu vitamin, chất xơ, chất chống oxy hóa</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#0E7A32] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">Thân thiện với môi trường</h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">Đóng gói an toàn, bảo vệ môi trường</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Sản phẩm liên quan</h2>
          <Link
            to={`/category/${product.category}`}
            className="text-xs sm:text-sm font-semibold text-[#0E7A32] flex items-center gap-1 hover:underline"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} size="small" />
            ))}
          </div>

          {/* Floating right carousel chevron button */}
          <button
            type="button"
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 hidden lg:flex items-center justify-center text-gray-700 hover:text-black hover:scale-105 transition cursor-pointer z-10"
            aria-label="Next related products"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
