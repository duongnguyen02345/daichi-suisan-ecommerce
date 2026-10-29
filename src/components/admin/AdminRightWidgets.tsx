import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Star, 
  Tag, 
  ChevronRight, 
  ChevronLeft, 
  Edit3, 
  Plus, 
  Trash2, 
  GripVertical,
  MoreVertical
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { formatPrice } from '../../lib/utils';

export const AdminRightWidgets: React.FC = () => {
  const { 
    banners, 
    products, 
    featuredProductIds, 
    toggleFeatured, 
    promotions, 
    addPromotion 
  } = useAdmin();

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoCode, setNewPromoCode] = useState('');

  const featuredProducts = products.filter((p) => featuredProductIds.includes(p.id));
  const currentBanner = banners[activeBannerIdx] || banners[0];

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPromoTitle && newPromoCode) {
      addPromotion({
        title: newPromoTitle,
        code: newPromoCode.toUpperCase(),
        discountAmount: 30000,
        minOrder: 300000,
        startDate: '01/07/2026',
        endDate: '31/07/2026',
        status: 'active',
      });
      setNewPromoTitle('');
      setNewPromoCode('');
      setIsAddingPromo(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Widget 1: Quản lý banner */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#0E7A32]" />
            <h3 className="font-bold text-gray-900 text-sm">Quản lý banner</h3>
          </div>
          <button className="text-xs text-[#0E7A32] font-semibold flex items-center gap-1 hover:underline">
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Banner Preview Card */}
        <div className="relative rounded-[12px] overflow-hidden bg-gradient-to-r from-emerald-100 to-emerald-200 aspect-[16/9] mb-3">
          <img
            src={currentBanner.image}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 p-4 flex flex-col justify-between text-white">
            <div className="text-[10px] bg-emerald-600/90 w-fit px-2 py-0.5 rounded-full font-bold">
              Banner trang chủ
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm line-clamp-1 mb-2">
                {currentBanner.title.replace('\n', ' ')}
              </h4>
              <button className="bg-emerald-700/90 hover:bg-emerald-600 text-white px-3 py-1 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition">
                <Edit3 className="w-3 h-3" /> Chỉnh sửa
              </button>
            </div>
          </div>
        </div>

        {/* Banner Controls */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <button
            onClick={() => setActiveBannerIdx((p) => (p === 0 ? banners.length - 1 : p - 1))}
            className="p-1.5 rounded-[8px] border border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition ${
                  activeBannerIdx === idx ? 'bg-[#0E7A32] w-4' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveBannerIdx((p) => (p === banners.length - 1 ? 0 : p + 1))}
            className="p-1.5 rounded-[8px] border border-gray-200 hover:bg-gray-50"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Widget 2: Sản phẩm nổi bật */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="font-bold text-gray-900 text-sm">Sản phẩm nổi bật</h3>
          </div>
          <button className="text-xs text-[#0E7A32] font-semibold flex items-center gap-1 hover:underline">
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 cards grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {featuredProducts.slice(0, 3).map((prod) => (
            <div
              key={prod.id}
              className="border border-gray-200 rounded-[12px] p-2 flex flex-col justify-between bg-gray-50/50 relative group"
            >
              <div className="flex items-center justify-between mb-1">
                <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                <button
                  onClick={() => toggleFeatured(prod.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Gỡ nổi bật"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="w-full aspect-square bg-white rounded-[8px] p-1 mb-1 flex items-center justify-center">
                <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <h5 className="font-bold text-[11px] text-gray-800 line-clamp-1">{prod.name}</h5>
                <div className="text-[11px] font-bold text-[#E53935]">{formatPrice(prod.price)}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            const candidate = products.find((p) => !featuredProductIds.includes(p.id));
            if (candidate) toggleFeatured(candidate.id);
          }}
          className="w-full h-[38px] bg-emerald-50 text-[#0E7A32] rounded-[12px] text-xs font-semibold hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Chọn sản phẩm nổi bật</span>
        </button>
      </div>

      {/* Widget 3: Quản lý khuyến mãi */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-gray-900 text-sm">Quản lý khuyến mãi</h3>
          </div>
          <button className="text-xs text-[#0E7A32] font-semibold flex items-center gap-1 hover:underline">
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5 mb-4">
          {promotions.slice(0, 3).map((promo) => (
            <div
              key={promo.id}
              className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 font-black text-xs">
                  %
                </div>
                <div>
                  <h5 className="font-bold text-xs text-gray-900 leading-tight">
                    {promo.title}
                  </h5>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {promo.startDate} - {promo.endDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Đang chạy
                </span>
                <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {isAddingPromo ? (
          <form onSubmit={handleCreatePromo} className="space-y-2 pt-2 border-t border-gray-100">
            <input
              type="text"
              placeholder="Tên chương trình..."
              value={newPromoTitle}
              onChange={(e) => setNewPromoTitle(e.target.value)}
              required
              className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0E7A32]"
            />
            <input
              type="text"
              placeholder="Mã voucher (ví dụ: SUMMER30)"
              value={newPromoCode}
              onChange={(e) => setNewPromoCode(e.target.value)}
              required
              className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0E7A32]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-[#0E7A32] text-white py-1.5 rounded-lg text-xs font-bold"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPromo(false)}
                className="px-3 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-xs"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingPromo(true)}
            className="w-full py-2 bg-emerald-50 text-[#0E7A32] rounded-xl text-xs font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo chương trình khuyến mãi</span>
          </button>
        )}
      </div>
    </div>
  );
};
