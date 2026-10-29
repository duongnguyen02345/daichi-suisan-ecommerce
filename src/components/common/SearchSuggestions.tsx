import React from 'react';
import { ArrowRight, FolderSearch, PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';

export interface SearchCategorySuggestion {
  id: string;
  name: string;
  slug: string;
  image?: string;
  count: number;
  isPromotion?: boolean;
}

interface SearchSuggestionsProps {
  listId: string;
  query: string;
  products: Product[];
  categories: SearchCategorySuggestion[];
  onClose: () => void;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  listId,
  query,
  products,
  categories,
  onClose,
}) => {
  const hasResults = products.length > 0 || categories.length > 0;
  const searchUrl = `/products?search=${encodeURIComponent(query)}`;

  return (
    <div
      id={listId}
      role="region"
      aria-label={`Gợi ý tìm kiếm cho ${query}`}
      className="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] max-h-[min(520px,70vh)] overflow-y-auto rounded-[16px] border border-slate-200 bg-white p-2 text-left shadow-[0_18px_50px_rgba(15,23,42,0.2)] animate-modal"
    >
      {hasResults ? (
        <>
          {categories.length > 0 ? (
            <section aria-label="Danh mục phù hợp">
              <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                Danh mục phù hợp
              </p>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    onClick={onClose}
                    className={`flex min-w-0 items-center gap-2.5 rounded-[10px] px-2.5 py-2 transition ${
                      category.isPromotion
                        ? 'bg-rose-50 text-[#D03E45] hover:bg-rose-100'
                        : 'text-[#183A64] hover:bg-emerald-50 hover:text-[#0E7A32]'
                    }`}
                  >
                    {category.image ? (
                      <img src={category.image} alt="" className="h-8 w-8 flex-shrink-0 rounded-[9px] object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-slate-100">
                        <FolderSearch className="h-4 w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{category.name}</span>
                    <span className="text-[10px] font-bold opacity-70">{category.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {products.length > 0 ? (
            <section className={categories.length > 0 ? 'mt-2 border-t border-slate-100 pt-2' : ''} aria-label="Sản phẩm phù hợp">
              <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                Sản phẩm gợi ý
              </p>
              <div className="space-y-1">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 transition hover:bg-slate-50 focus:bg-slate-50"
                  >
                    <img
                      src={product.image}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded-[10px] border border-slate-100 object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[#183A64]">{product.name}</span>
                      <span className="block truncate text-[10px] text-[#64748B]">{product.categoryName} · {product.unit}</span>
                    </span>
                    <span className="flex-shrink-0 text-[12px] font-bold text-[#D03E45]">{formatPrice(product.price)}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-[12px] bg-slate-50 px-3 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#64748B] shadow-xs">
            <PackageSearch className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-[#183A64]">Chưa có gợi ý phù hợp</p>
            <p className="text-[10px] text-[#64748B]">Nhấn Enter để xem kết quả tìm kiếm đầy đủ.</p>
          </div>
        </div>
      )}

      <Link
        to={searchUrl}
        onClick={onClose}
        className="mt-2 flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0E7A32] px-3 text-[12px] font-bold text-white transition hover:bg-[#0A5C25]"
      >
        Xem tất cả kết quả cho “{query}”
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};
