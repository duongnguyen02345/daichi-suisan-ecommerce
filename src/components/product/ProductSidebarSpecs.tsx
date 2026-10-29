import React from 'react';
import { Check, User, Scale, Snowflake, Calendar, LayoutGrid, Leaf, ReceiptText } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import { getProductVatBreakdown } from '../../lib/vat';

interface ProductSidebarSpecsProps {
  product: Product;
}

export const ProductSidebarSpecs: React.FC<ProductSidebarSpecsProps> = ({ product }) => {
  const vat = getProductVatBreakdown(product);
  const highlights = [
    {
      title: 'Táo tươi nhập khẩu trực tiếp',
      sub: 'Chất lượng cao, an toàn, tươi ngon',
    },
    {
      title: 'Giàu vitamin và chất xơ',
      sub: 'Tốt cho hệ tiêu hóa, tăng cường đề kháng',
    },
    {
      title: 'Vị ngọt thanh, giòn tan',
      sub: 'Phù hợp cho cả gia đình',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Card: Key Benefits with Pale Mint Background & Watermark */}
      <div className="relative bg-[#EBF5EE] border border-emerald-100 rounded-[12px] p-4 sm:p-5 overflow-hidden shadow-xs">
        {/* Subtle decorative leaf watermark in background */}
        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
          <Leaf className="w-24 h-24 text-[#0E7A32]" />
        </div>

        <div className="space-y-3 relative z-10">
          {highlights.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#0E7A32] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <p className="text-[13px] sm:text-[14px] font-bold text-[#111827] leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] sm:text-[12px] text-[#4B5563] mt-0.5">
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Card: Technical Product Specs */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 sm:p-5 shadow-xs">
        <h3 className="font-bold text-[#111827] text-[15px] sm:text-[16px] pb-2.5 mb-2.5 border-b border-gray-100">
          Thông tin sản phẩm
        </h3>

        <div className="space-y-2.5 text-xs sm:text-[13px]">
          {/* Xuất xứ */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <User className="w-4 h-4 text-gray-400" />
              <span>Xuất xứ</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[#111827]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>{product.origin || 'Nhật Bản'}</span>
            </div>
          </div>

          {/* Đơn vị tính */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Scale className="w-4 h-4 text-gray-400" />
              <span>Đơn vị tính</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[#111827]">
              <span className="text-gray-400 text-xs">⚖️</span>
              <span>{product.unit || '1kg (5 - 6 quả)'}</span>
            </div>
          </div>

          {/* Bảo quản */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Snowflake className="w-4 h-4 text-gray-400" />
              <span>Bảo quản</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[#111827] text-right">
              <span className="text-gray-400 text-xs">❄️</span>
              <span>{product.storage || 'Ngăn mát tủ lạnh (0 - 4°C)'}</span>
            </div>
          </div>

          {/* Hạn sử dụng */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Hạn sử dụng</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[#111827]">
              <span className="text-gray-400 text-xs">⏱️</span>
              <span>{product.expiry || '7 - 10 ngày'}</span>
            </div>
          </div>

          {/* Danh mục */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <LayoutGrid className="w-4 h-4 text-gray-400" />
              <span>Danh mục</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[#0E7A32] text-right">
              <span>{product.categoryName}{product.subcategory ? ` > ${product.subcategory}` : ''}</span>
            </div>
          </div>

          <div className="flex items-start justify-between py-1 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <ReceiptText className="w-4 h-4 text-gray-400" />
              <span>VAT</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-[#111827]">{product.vatRate ?? 0}%</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {product.vatCalculation === 'exclusive'
                  ? `Giá chưa thuế · Thanh toán ${formatPrice(vat.grossPrice)}`
                  : `Giá đã gồm thuế · Trước thuế ${formatPrice(vat.netPrice)}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
