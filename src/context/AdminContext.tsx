import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Banner, BankAccount, Category, Product, Promotion } from '../types';
import {
  mockBanners,
  mockCategories,
  mockProducts,
  mockPromotions,
} from '../data/mockData';
import { getRemoteBankAccount, saveRemoteBankAccount } from '../lib/bankApi';
import { isPaymentsBackendConfigured, isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  archiveRemoteCategory,
  archiveRemoteBanner,
  archiveRemoteProduct,
  archiveRemotePromotion,
  createRemoteBanner,
  createRemoteCategory,
  createRemoteProduct,
  createRemotePromotion,
  loadAdminData,
  pauseRemotePromotion,
  resumeRemotePromotion,
  updateRemoteCategory,
  reorderRemoteCategories,
  updateRemoteBanner,
  updateRemoteProduct,
  updateRemotePromotion,
} from '../lib/adminApi';
import { useAuth } from './AuthContext';

interface AdminActionResult {
  success: boolean;
  message: string;
}

interface AdminContextType {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  promotions: Promotion[];
  bankAccount: BankAccount;
  featuredProductIds: string[];
  isLoading: boolean;
  dataSource: 'supabase' | 'local';
  lastError: string;
  refreshAdminData: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<AdminActionResult>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<AdminActionResult>;
  deleteProduct: (id: string) => Promise<AdminActionResult>;
  toggleFeatured: (id: string) => Promise<AdminActionResult>;
  addCategory: (category: Omit<Category, 'id' | 'count'>) => Promise<AdminActionResult>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<AdminActionResult>;
  reorderCategories: (orderedCategoryIds: string[]) => Promise<AdminActionResult>;
  archiveCategory: (id: string) => Promise<AdminActionResult>;
  addPromotion: (promo: Omit<Promotion, 'id'>) => Promise<AdminActionResult>;
  updatePromotion: (code: string, promo: Partial<Promotion>) => Promise<AdminActionResult>;
  pausePromotion: (code: string) => Promise<AdminActionResult>;
  resumePromotion: (code: string) => Promise<AdminActionResult>;
  archivePromotion: (code: string) => Promise<AdminActionResult>;
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<AdminActionResult>;
  updateBanner: (id: string, banner: Partial<Banner>) => Promise<AdminActionResult>;
  archiveBanner: (id: string) => Promise<AdminActionResult>;
  saveBankAccount: (
    account: Omit<BankAccount, 'id' | 'updatedAt'>,
    adminKey?: string,
  ) => Promise<AdminActionResult>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const readLocalState = <T,>(key: string, fallback: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

const deriveProductStatus = (product: Product): Product['status'] => {
  if (product.temporarilyUnavailable) return 'temporarily_unavailable';
  if (product.stock <= 0) return 'out_of_stock';
  if (product.stock <= (product.lowStockThreshold ?? 10)) return 'low_stock';
  return 'in_stock';
};

const toIsoDate = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

const CATALOG_VERSION = 'v6_category_reorder_promotion_2026';

if (typeof window !== 'undefined') {
  try {
    const currentVersion = localStorage.getItem('freshmart_catalog_version');
    if (currentVersion !== CATALOG_VERSION) {
      localStorage.setItem('freshmart_catalog_version', CATALOG_VERSION);
      localStorage.removeItem('freshmart_admin_products');
      localStorage.removeItem('freshmart_admin_categories');
      localStorage.removeItem('freshmart_admin_banners');
      localStorage.removeItem('freshmart_featured_products');
    }
  } catch {
    // Ignore local storage errors if cookies/storage blocked
  }
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(() =>
    readLocalState('freshmart_admin_products', mockProducts),
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    readLocalState('freshmart_admin_categories', mockCategories),
  );
  const [banners, setBanners] = useState<Banner[]>(() => {
    const loaded = readLocalState<Banner[]>('freshmart_admin_banners', mockBanners);
    let list = loaded;
    if (!list.some((b) => b.placement === 'about_hero')) {
      const mockAbout = mockBanners.find((m) => m.placement === 'about_hero');
      if (mockAbout) {
        list = [...list, mockAbout];
      }
    }
    if (!list.some((b) => b.placement === 'about_digital')) {
      const mockDigital = mockBanners.find((m) => m.placement === 'about_digital');
      if (mockDigital) {
        list = [...list, mockDigital];
      }
    }
    return list.map((b) => {
      if ((b.placement === 'home_hero' || b.id === 'b-1' || b.id === '00000000-0000-4000-8000-000000000001') && (!b.title || !b.title.trim())) {
        const mockHero = mockBanners.find((m) => m.placement === 'home_hero') || mockBanners[0];
        return { ...b, ...mockHero, id: b.id };
      }
      if (b.id === 'b-3' && b.title.includes('Wagyu')) {
        const mockB3 = mockBanners.find((m) => m.id === 'b-3');
        return mockB3 || b;
      }
      return b;
    });
  });
  const [promotions, setPromotions] = useState<Promotion[]>(() =>
    readLocalState('freshmart_admin_promotions', mockPromotions),
  );
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>(() =>
    readLocalState('freshmart_featured_products', ['p-1', 'p-2', 'p-3']),
  );
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [lastError, setLastError] = useState('');
  const [bankAccount, setBankAccount] = useState<BankAccount>(() =>
    readLocalState('freshmart_bank_account', {
      id: 'bank-default',
      bankId: 'VCB',
      bankName: 'Vietcombank',
      accountNumber: '',
      accountName: '',
      isActive: false,
      updatedAt: new Date().toISOString(),
    }),
  );

  const refreshAdminData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setDataSource('local');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await loadAdminData();
      setProducts(data.products);
      setCategories(data.categories);
      setBanners(data.banners);
      setPromotions(data.promotions);
      setFeaturedProductIds(data.products.filter((product) => product.isFeatured).map((product) => product.id));
      setDataSource('supabase');
      setLastError('');
    } catch (error) {
      setDataSource('local');
      setLastError(
        error instanceof Error
          ? `Chưa thể đồng bộ Supabase: ${error.message}`
          : 'Chưa thể đồng bộ dữ liệu Supabase.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAdminData();
  }, [refreshAdminData, user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const refreshWhenActive = () => {
      if (document.visibilityState === 'visible') void refreshAdminData();
    };

    window.addEventListener('focus', refreshWhenActive);
    document.addEventListener('visibilitychange', refreshWhenActive);
    return () => {
      window.removeEventListener('focus', refreshWhenActive);
      document.removeEventListener('visibilitychange', refreshWhenActive);
    };
  }, [refreshAdminData]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    localStorage.setItem('freshmart_admin_products', JSON.stringify(products));
    localStorage.setItem('freshmart_admin_categories', JSON.stringify(categories));
    localStorage.setItem('freshmart_admin_banners', JSON.stringify(banners));
    localStorage.setItem('freshmart_admin_promotions', JSON.stringify(promotions));
    localStorage.setItem('freshmart_featured_products', JSON.stringify(featuredProductIds));
  }, [products, categories, banners, promotions, featuredProductIds]);

  useEffect(() => {
    localStorage.setItem('freshmart_bank_account', JSON.stringify(bankAccount));
  }, [bankAccount]);

  useEffect(() => {
    if (!isPaymentsBackendConfigured) return;
    let cancelled = false;
    getRemoteBankAccount()
      .then((account) => {
        if (cancelled) return;
        if (account) setBankAccount(account);
        else setBankAccount((current) => ({ ...current, isActive: false }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const addProduct = async (newProduct: Omit<Product, 'id'>): Promise<AdminActionResult> => {
    const normalizedSku = newProduct.sku.trim().toUpperCase();
    if (products.some((item) => item.sku.trim().toUpperCase() === normalizedSku)) {
      return { success: false, message: 'Mã SKU đã tồn tại. Vui lòng nhập một mã SKU khác.' };
    }
    if (newProduct.price < 0 || newProduct.originalPrice < newProduct.price) {
      return { success: false, message: 'Giá gốc phải lớn hơn hoặc bằng giá bán.' };
    }

    const productId = `p-${crypto.randomUUID()}`;
    const baseSlug = newProduct.slug || `san-pham-${productId.slice(-8)}`;
    const slug = products.some((item) => item.slug.toLowerCase() === baseSlug.toLowerCase())
      ? `${baseSlug}-${productId.slice(-8)}`
      : baseSlug;
    const product: Product = {
      ...newProduct,
      id: productId,
      sku: normalizedSku,
      slug,
      publicationStatus: newProduct.publicationStatus || 'draft',
      lowStockThreshold: newProduct.lowStockThreshold ?? 10,
    };
    product.status = deriveProductStatus(product);

    try {
      const saved = isSupabaseConfigured ? await createRemoteProduct(product) : product;
      setProducts((current) => [saved, ...current]);
      setLastError('');
      return { success: true, message: 'Đã thêm sản phẩm.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể thêm sản phẩm.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const updateProduct = async (
    id: string,
    updatedFields: Partial<Product>,
  ): Promise<AdminActionResult> => {
    const previous = products.find((item) => item.id === id);
    if (!previous) return { success: false, message: 'Không tìm thấy sản phẩm.' };

    const next: Product = { ...previous, ...updatedFields };
    next.status = deriveProductStatus(next);

    try {
      const saved = isSupabaseConfigured ? await updateRemoteProduct(previous, next) : next;
      setProducts((current) => current.map((item) => (item.id === id ? saved : item)));
      setFeaturedProductIds((current) =>
        saved.isFeatured
          ? Array.from(new Set([...current, id]))
          : current.filter((featuredId) => featuredId !== id),
      );
      setLastError('');
      return { success: true, message: 'Đã cập nhật sản phẩm.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật sản phẩm.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const deleteProduct = async (id: string): Promise<AdminActionResult> => {
    try {
      if (isSupabaseConfigured) await archiveRemoteProduct(id);
      setProducts((current) =>
        isSupabaseConfigured
          ? current.map((item) =>
              item.id === id
                ? { ...item, publicationStatus: 'archived', status: 'temporarily_unavailable' }
                : item,
            )
          : current.filter((item) => item.id !== id),
      );
      setFeaturedProductIds((current) => current.filter((featuredId) => featuredId !== id));
      return {
        success: true,
        message: isSupabaseConfigured ? 'Đã lưu trữ sản phẩm.' : 'Đã xóa sản phẩm dùng thử.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu trữ sản phẩm.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const toggleFeatured = async (id: string): Promise<AdminActionResult> => {
    const product = products.find((item) => item.id === id);
    if (!product) return { success: false, message: 'Không tìm thấy sản phẩm.' };
    return updateProduct(id, { isFeatured: !product.isFeatured });
  };

  const addCategory = async (
    input: Omit<Category, 'id' | 'count'>,
  ): Promise<AdminActionResult> => {
    const slug = input.slug.trim().toLowerCase();
    if (categories.some((category) => category.slug.toLowerCase() === slug)) {
      return { success: false, message: 'Slug danh mục đã tồn tại.' };
    }

    const category: Category = {
      ...input,
      id: `cat-${crypto.randomUUID()}`,
      slug,
      count: 0,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    };

    try {
      const saved = isSupabaseConfigured
        ? await createRemoteCategory(input)
        : category;
      setCategories((current) => [...current, saved].sort(
        (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
      ));
      setLastError('');
      return { success: true, message: 'Đã thêm danh mục.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể thêm danh mục.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const updateCategory = async (
    id: string,
    fields: Partial<Category>,
  ): Promise<AdminActionResult> => {
    const previous = categories.find((category) => category.id === id);
    if (!previous) return { success: false, message: 'Không tìm thấy danh mục.' };

    const slug = (fields.slug ?? previous.slug).trim().toLowerCase();
    if (categories.some((category) => category.id !== id && category.slug.toLowerCase() === slug)) {
      return { success: false, message: 'Slug danh mục đã tồn tại.' };
    }
    const next: Category = { ...previous, ...fields, slug };

    try {
      const saved = isSupabaseConfigured ? await updateRemoteCategory(next) : next;
      setCategories((current) => current
        .map((category) => (category.id === id ? saved : category))
        .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)));
      setLastError('');
      return { success: true, message: 'Đã cập nhật danh mục.' };
    } catch (error) {
      // Fallback local update so UI reflects change immediately
      setCategories((current) => current
        .map((category) => (category.id === id ? next : category))
        .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)));
      const message = error instanceof Error ? error.message : 'Không thể cập nhật danh mục.';
      setLastError(message);
      return { success: true, message: 'Đã cập nhật danh mục trên trình duyệt.' };
    }
  };

  const reorderCategories = async (
    orderedCategoryIds: string[],
  ): Promise<AdminActionResult> => {
    const idToOrder = new Map<string, number>();
    orderedCategoryIds.forEach((catId, index) => {
      idToOrder.set(catId, (index + 1) * 10);
    });

    const nextCategories = categories
      .map((cat) => {
        const newOrder = idToOrder.get(cat.id);
        return newOrder !== undefined ? { ...cat, sortOrder: newOrder } : cat;
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    setCategories(nextCategories);
    if (!isSupabaseConfigured) {
      localStorage.setItem('freshmart_admin_categories', JSON.stringify(nextCategories));
    }

    try {
      if (isSupabaseConfigured) {
        await reorderRemoteCategories(
          orderedCategoryIds.map((catId, index) => ({
            id: catId,
            sortOrder: (index + 1) * 10,
          })),
        );
      }
      localStorage.setItem('freshmart_admin_categories', JSON.stringify(nextCategories));
      setLastError('');
      return { success: true, message: 'Đã cập nhật thứ tự hiển thị danh mục.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu thứ tự lên máy chủ.';
      setLastError(message);
      return { success: true, message: 'Đã lưu thứ tự danh mục cục bộ.' };
    }
  };

  const archiveCategory = async (id: string): Promise<AdminActionResult> => {
    const category = categories.find((item) => item.id === id);
    if (!category) return { success: false, message: 'Không tìm thấy danh mục.' };
    const usedByProducts = products.some(
      (product) => product.category === category.slug && product.publicationStatus !== 'archived',
    );
    if (usedByProducts) {
      return {
        success: false,
        message: 'Danh mục còn sản phẩm đang sử dụng. Hãy chuyển sản phẩm trước khi lưu trữ.',
      };
    }

    try {
      if (isSupabaseConfigured) await archiveRemoteCategory(id);
      setCategories((current) => current.map((item) => (
        item.id === id ? { ...item, active: false } : item
      )));
      setLastError('');
      return { success: true, message: 'Đã lưu trữ danh mục.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu trữ danh mục.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const addPromotion = async (promo: Omit<Promotion, 'id'>): Promise<AdminActionResult> => {
    try {
      if (supabase) {
        const saved = await createRemotePromotion(promo);
        setPromotions((current) => [saved, ...current.filter((p) => p.code !== saved.code)]);
      } else {
        const newPromo: Promotion = { ...promo, id: promo.code.toUpperCase(), code: promo.code.toUpperCase() };
        setPromotions((current) => [newPromo, ...current]);
      }
      return { success: true, message: 'Đã tạo chương trình khuyến mại.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo khuyến mại.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const updatePromotion = async (code: string, promo: Partial<Promotion>): Promise<AdminActionResult> => {
    try {
      if (supabase) {
        const updated = await updateRemotePromotion(code, promo);
        setPromotions((current) => current.map((p) => (p.code === code ? updated : p)));
      } else {
        setPromotions((current) =>
          current.map((p) => (p.code === code ? { ...p, ...promo } : p))
        );
      }
      return { success: true, message: 'Đã cập nhật chương trình khuyến mại.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật khuyến mại.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const pausePromotion = async (code: string): Promise<AdminActionResult> => {
    try {
      if (supabase) {
        await pauseRemotePromotion(code);
      }
      setPromotions((current) =>
        current.map((p) => (p.code === code ? { ...p, status: 'paused' as const } : p))
      );
      return { success: true, message: 'Đã tạm dừng chương trình khuyến mại.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạm dừng khuyến mại.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const resumePromotion = async (code: string): Promise<AdminActionResult> => {
    try {
      if (supabase) {
        await resumeRemotePromotion(code);
      }
      setPromotions((current) =>
        current.map((p) => (p.code === code ? { ...p, status: 'active' as const } : p))
      );
      return { success: true, message: 'Đã kích hoạt lại chương trình khuyến mại.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kích hoạt lại khuyến mại.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const archivePromotion = async (code: string): Promise<AdminActionResult> => {
    try {
      if (supabase) {
        await archiveRemotePromotion(code);
      }
      setPromotions((current) =>
        current.map((p) => (p.code === code ? { ...p, status: 'archived' as const } : p))
      );
      return { success: true, message: 'Đã lưu trữ chương trình khuyến mại.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu trữ khuyến mại.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const updateBanner = async (
    id: string,
    banner: Partial<Banner>,
  ): Promise<AdminActionResult> => {
    const previous = banners.find((item) => item.id === id);
    if (!previous) return { success: false, message: 'Không tìm thấy banner.' };
    const merged = { ...previous, ...banner };
    const gallery = (merged.gallery?.length ? merged.gallery : [merged.image])
      .map((url) => url.trim())
      .filter(Boolean)
      .slice(0, 10);
    const image = gallery[0] || previous.image || '/images/daichi-hero-seafood.png';
    const finalGallery = gallery.length > 0 ? gallery : [image];
    const next: Banner = { ...merged, image, gallery: finalGallery };

    try {
      let saved: Banner = next;
      if (isSupabaseConfigured) {
        saved = await updateRemoteBanner(next);
      }
      setBanners((current) => {
        const updated = current
          .map((item) => (item.id === id ? saved : item))
          .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
        if (!isSupabaseConfigured) {
          try {
            localStorage.setItem('freshmart_admin_banners', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      setLastError('');
      return { success: true, message: 'Đã cập nhật banner thành công.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật banner.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const addBanner = async (input: Omit<Banner, 'id'>): Promise<AdminActionResult> => {
    const gallery = (input.gallery?.length ? input.gallery : [input.image])
      .map((url) => url.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (gallery.length === 0) return { success: false, message: 'Vui lòng thêm ít nhất một ảnh banner.' };
    if (!input.title.trim()) return { success: false, message: 'Vui lòng nhập tiêu đề banner.' };

    const placement = input.placement || 'home_hero';
    if (banners.some((item) => (item.placement || 'home_hero') === placement && item.publicationStatus !== 'archived')) {
      return { success: false, message: 'Khu vực này đã có banner. Hãy thêm ảnh vào bộ ảnh của banner hiện tại.' };
    }
    const nextSortOrder = Math.max(
      0,
      ...banners.filter((item) => (item.placement || 'home_hero') === placement)
        .map((item) => item.sortOrder || 0),
    ) + 10;
    const banner: Omit<Banner, 'id'> = {
      ...input,
      image: gallery[0],
      gallery,
      placement,
      sortOrder: input.sortOrder || nextSortOrder,
      publicationStatus: input.publicationStatus || 'draft',
      active: input.publicationStatus === 'published' || input.publicationStatus === 'scheduled',
    };

    try {
      let saved = { ...banner, id: `b-${crypto.randomUUID()}` } as Banner;
      if (isSupabaseConfigured) {
        saved = await createRemoteBanner(banner);
      }
      setBanners((current) => {
        const updated = [...current, saved]
          .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
        if (!isSupabaseConfigured) {
          try {
            localStorage.setItem('freshmart_admin_banners', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      setLastError('');
      return { success: true, message: 'Đã thêm banner thành công.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể thêm banner.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const archiveBanner = async (id: string): Promise<AdminActionResult> => {
    const banner = banners.find((item) => item.id === id);
    if (!banner) return { success: false, message: 'Không tìm thấy banner.' };
    try {
      if (isSupabaseConfigured) {
        await archiveRemoteBanner(id);
      }
      setBanners((current) => {
        const updated = current.map((item) =>
          item.id === id ? { ...item, publicationStatus: 'archived' as const, active: false } : item,
        );
        if (!isSupabaseConfigured) {
          try {
            localStorage.setItem('freshmart_admin_banners', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      setLastError('');
      return { success: true, message: 'Đã lưu trữ banner.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu trữ banner.';
      setLastError(message);
      return { success: false, message };
    }
  };

  const saveBankAccount = async (
    account: Omit<BankAccount, 'id' | 'updatedAt'>,
    adminKey = '',
  ): Promise<AdminActionResult> => {
    const localAccount: BankAccount = {
      ...account,
      id: bankAccount.id,
      updatedAt: new Date().toISOString(),
    };

    if (isPaymentsBackendConfigured) {
      if (!adminKey.trim()) {
        return { success: false, message: 'Vui lòng nhập khóa quản trị thanh toán.' };
      }
      try {
        const result = await saveRemoteBankAccount(account, adminKey.trim());
        if (result?.bankAccount) setBankAccount(result.bankAccount);
        return { success: true, message: 'Đã đồng bộ tài khoản với máy chủ thanh toán.' };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Không thể lưu cấu hình ngân hàng.',
        };
      }
    }

    setBankAccount(localAccount);
    return { success: true, message: 'Đã lưu cấu hình dùng thử trên trình duyệt.' };
  };

  const value: AdminContextType = {
    products,
    categories,
    banners,
    promotions,
    bankAccount,
    featuredProductIds,
    isLoading,
    dataSource,
    lastError,
    refreshAdminData,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFeatured,
    addCategory,
    updateCategory,
    reorderCategories,
    archiveCategory,
    addPromotion,
    updatePromotion,
    pausePromotion,
    resumePromotion,
    archivePromotion,
    addBanner,
    updateBanner,
    archiveBanner,
    saveBankAccount,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};

