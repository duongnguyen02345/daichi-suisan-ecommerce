import React, { useState, useRef } from 'react';
import { Minus, Plus, Trash2, Heart, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { formatPrice } from '../../lib/utils';

export const CartItemList: React.FC = () => {
  const {
    items,
    updateQuantity,
    removeItem,
    removeSelectedItems,
    toggleSelect,
    toggleSelectAll,
    isAllSelected,
  } = useCart();
  const { toggleFavorite } = useFavorites();

  // Swipe-to-delete state for mobile
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    if (touchStartX.current === null) return;
    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = Math.abs((touchStartY.current ?? 0) - currentY);

    if (diffX > 40 && diffY < 50) {
      setSwipedItemId(id);
    } else if (diffX < -30 && diffY < 50) {
      if (swipedItemId === id) {
        setSwipedItemId(null);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent, id: string) => {
    if (mouseStartX.current === null) return;
    const diffX = mouseStartX.current - e.clientX;
    if (diffX > 40) {
      setSwipedItemId(id);
    } else if (diffX < -30) {
      if (swipedItemId === id) {
        setSwipedItemId(null);
      }
    }
    mouseStartX.current = null;
  };

  const handleMoveSelectedToFavorites = () => {
    items
      .filter((item) => item.selected)
      .forEach((item) => toggleFavorite(item.product));
    removeSelectedItems();
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-[12px] p-10 text-center border border-[#E5E7EB] shadow-card">
        <div className="w-20 h-20 bg-emerald-50 text-[#0E7A32] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Giỏ hàng của bạn đang trống</h3>
        <p className="text-xs text-gray-500 mb-6">Hãy thêm những thực phẩm tươi ngon vào giỏ hàng nhé!</p>
        <a
          href="/products"
          className="inline-flex items-center justify-center bg-[#0E7A32] text-white px-6 h-[42px] rounded-[12px] text-xs font-semibold hover:bg-[#0A5C25] transition hover:scale-[1.02]"
        >
          Tiếp tục mua sắm
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Card Layout (sm:hidden) */}
      <div className="sm:hidden space-y-3">
        {/* Mobile "Chọn tất cả" Header */}
        <div className="flex items-center justify-between px-1 text-xs text-gray-700 font-medium">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={toggleSelectAll}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                isAllSelected
                  ? 'border-[#0E7A32] bg-[#0E7A32]'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {isAllSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </div>
            <span className="font-semibold text-gray-800">
              Chọn tất cả ({items.length} sản phẩm)
            </span>
          </label>
        </div>

        {items.map((item) => {
          const lineTotal = item.product.price * item.quantity;
          const isSwiped = swipedItemId === item.product.id;

          return (
            <div
              key={item.product.id}
              className="relative overflow-hidden rounded-[16px] shadow-card bg-[#E53935]"
            >
              {/* Background Revealed Action: Red Delete Button on Swipe */}
              <div className="absolute inset-y-0 right-0 w-[78px] flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    removeItem(item.product.id);
                    setSwipedItemId(null);
                  }}
                  className="w-full h-full bg-[#E53935] text-white flex flex-col items-center justify-center active:bg-red-700 transition"
                  aria-label="Xóa sản phẩm"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-semibold mt-1">Xóa</span>
                </button>
              </div>

              {/* Foreground Card Content (slides left when swiped) */}
              <div
                style={{
                  transform: isSwiped ? 'translateX(-78px)' : 'translateX(0px)',
                  transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, item.product.id)}
                onMouseDown={handleMouseDown}
                onMouseUp={(e) => handleMouseUp(e, item.product.id)}
                onClick={() => {
                  if (isSwiped) setSwipedItemId(null);
                }}
                className="relative bg-white border border-[#E5E7EB] rounded-[16px] p-3.5 z-10 select-none"
              >
                <div className="flex gap-2.5 items-center">
                  {/* Tickbox at the start of each product card */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(item.product.id);
                    }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                      item.selected
                        ? 'border-[#0E7A32] bg-[#0E7A32]'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    {item.selected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>

                  {/* Product Image */}
                  <div className="w-[72px] h-[72px] rounded-[12px] bg-[#F8F9F5] border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[72px]">
                    {/* Top Row: Name and Spec (no trash button here) */}
                    <div className="min-w-0 pr-1">
                      <h4 className="text-[14px] font-bold text-gray-900 leading-snug truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {item.product.unit || 'Gói 1kg | Nguồn gốc: Đà Lạt'}
                      </p>
                    </div>

                    {/* Bottom Row: Stepper on left, Prices on right */}
                    <div className="flex items-center justify-between gap-2 pt-2">
                      {/* Stepper */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center border border-gray-200 rounded-[8px] bg-gray-50 h-[30px] overflow-hidden flex-shrink-0"
                      >
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 active:bg-gray-200 transition"
                          aria-label="Giảm"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 active:bg-gray-200 transition"
                          aria-label="Tăng"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Prices: Original price on the LEFT, Red current price on the RIGHT */}
                      <div className="text-right flex items-baseline justify-end gap-1.5 flex-shrink-0">
                        {item.product.originalPrice > item.product.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(item.product.originalPrice * item.quantity)}
                          </span>
                        )}
                        <span className="text-sm sm:text-base font-bold text-[#E53935]">
                          {formatPrice(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table Container (hidden sm:block) */}
      <div className="hidden sm:block bg-white rounded-[12px] border border-[#E5E7EB] shadow-card p-3 md:p-3.5">
        {/* Table Header - Detached rounded pill */}
        <div className="grid grid-cols-[5.5fr_2fr_2fr_1.5fr_1fr] gap-3 px-4 py-3 bg-[#EAF7EE] rounded-[10px] text-xs font-bold text-gray-800 mb-2">
          <div
            onClick={toggleSelectAll}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                isAllSelected
                  ? 'border-[#0E7A32] bg-[#0E7A32]'
                  : 'border-gray-300 bg-white hover:border-[#0E7A32]'
              }`}
              role="checkbox"
              aria-checked={isAllSelected}
            >
              {isAllSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </div>
            <span className="font-bold text-gray-800">Sản phẩm</span>
          </div>
          <div className="text-right font-bold text-gray-800">Đơn giá</div>
          <div className="text-center font-bold text-gray-800">Số lượng</div>
          <div className="text-right font-bold text-gray-800">Thành tiền</div>
          <div className="text-center font-bold text-gray-800">Thao tác</div>
        </div>

        {/* Items List */}
        <div className="divide-y divide-gray-200">
          {items.map((item) => {
            const lineTotal = item.product.price * item.quantity;
            return (
              <div
                key={item.product.id}
                className="px-4 py-3 grid grid-cols-[5.5fr_2fr_2fr_1.5fr_1fr] gap-3 items-center hover:bg-emerald-50/20 transition rounded-[8px]"
              >
                {/* Product Col */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    onClick={() => toggleSelect(item.product.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                      item.selected
                        ? 'border-[#0E7A32] bg-[#0E7A32]'
                        : 'border-gray-300 bg-white hover:border-[#0E7A32]'
                    }`}
                    role="checkbox"
                    aria-checked={item.selected}
                  >
                    {item.selected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <div className="w-14 h-14 rounded-[10px] bg-gray-50 border border-[#E5E7EB] p-1 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {item.product.unit || 'Đóng gói tươi mới'}
                    </p>
                  </div>
                </div>

                {/* Price Col */}
                <div className="text-right">
                  <div className="text-sm font-bold text-[#E53935]">
                    {formatPrice(item.product.price)}
                  </div>
                  {item.product.originalPrice > item.product.price && (
                    <div className="text-[11px] text-[#9CA3AF] line-through">
                      {formatPrice(item.product.originalPrice)}
                    </div>
                  )}
                </div>

                {/* Quantity Stepper Col */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center border border-gray-200 rounded-[8px] bg-gray-50 overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
                      aria-label="Giảm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
                      aria-label="Tăng"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Line Total Col */}
                <div className="text-right">
                  <span className="text-sm font-black text-gray-900">
                    {formatPrice(lineTotal)}
                  </span>
                </div>

                {/* Action Col */}
                <div className="text-center">
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition flex items-center justify-center mx-auto"
                    title="Xóa sản phẩm"
                    aria-label="Xóa sản phẩm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions inside table card */}
        <div className="px-4 py-3.5 bg-gray-50/50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs -mx-3 -mb-3 md:-mx-3.5 md:-mb-3.5 rounded-b-[12px] mt-2">
          <div
            onClick={toggleSelectAll}
            className="flex items-center gap-2.5 cursor-pointer text-gray-700 font-semibold select-none"
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                isAllSelected
                  ? 'border-[#0E7A32] bg-[#0E7A32]'
                  : 'border-gray-300 bg-white hover:border-[#0E7A32]'
              }`}
              role="checkbox"
              aria-checked={isAllSelected}
            >
              {isAllSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </div>
            <span>Chọn tất cả ({items.length} sản phẩm)</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={removeSelectedItems}
              className="flex items-center gap-1.5 text-red-600 hover:underline font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa sản phẩm đã chọn</span>
            </button>
            <button
              onClick={handleMoveSelectedToFavorites}
              className="flex items-center gap-1.5 text-[#0E7A32] hover:underline font-semibold"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Chuyển vào danh sách yêu thích</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
