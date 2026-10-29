import { Banner, Category, Product, Promotion } from '../types';
import { mockBanners, mockProducts } from '../data/mockData';
import { supabase } from './supabase';

type DatabaseRow = Record<string, unknown>;
type CategoryWrite = Pick<Category, 'name' | 'slug' | 'image'> &
  Partial<Pick<Category, 'description' | 'parentId' | 'sortOrder' | 'active'>>;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const ensureFreshAdminSession = async () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  let session = sessionData.session;
  if (session.user.app_metadata?.role !== 'admin') {
    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshedData.session) {
      throw new Error('Không thể làm mới quyền quản trị. Vui lòng đăng nhập lại.');
    }
    session = refreshedData.session;
  }

  if (session.user.app_metadata?.role !== 'admin') {
    throw new Error('Tài khoản hiện tại chưa có quyền quản trị trong phiên đăng nhập.');
  }
};

const getProductWriteError = (error: { code?: string; message?: string; details?: string }) => {
  const source = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  if (error.code === '23505' && source.includes('sku')) {
    return 'Mã SKU đã tồn tại. Vui lòng nhập một mã SKU khác.';
  }
  if (error.code === '23505' && source.includes('slug')) {
    return 'Tên đường dẫn sản phẩm đã tồn tại. Hãy đổi tên sản phẩm.';
  }
  if (error.code === '23514' && source.includes('original_price')) {
    return 'Giá gốc phải lớn hơn hoặc bằng giá bán.';
  }
  if (error.code === '42501' || source.includes('row-level security')) {
    return 'Phiên quản trị chưa được cập nhật quyền ghi. Vui lòng đăng xuất rồi đăng nhập lại.';
  }
  return error.message || 'Không thể lưu sản phẩm vào Supabase.';
};

const getProductStatus = (
  stock: number,
  threshold: number,
  temporarilyUnavailable: boolean,
): Product['status'] => {
  if (temporarilyUnavailable) return 'temporarily_unavailable';
  if (stock <= 0) return 'out_of_stock';
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
};

export const mapProductRow = (row: DatabaseRow): Product => {
  const fallback = mockProducts.find((product) => product.id === row.id);
  const stock = Number(row.stock ?? fallback?.stock ?? 0);
  const threshold = Number(row.low_stock_threshold ?? fallback?.lowStockThreshold ?? 10);
  const temporarilyUnavailable = Boolean(row.temporarily_unavailable);
  const image = String(row.image_url || fallback?.image || '');
  const storedCategory = String(row.category_slug || '');
  const usesLegacyPlaceholder = storedCategory === 'khac' && Boolean(fallback?.category);
  const category = usesLegacyPlaceholder
    ? fallback!.category
    : storedCategory || fallback?.category || 'khac';
  const categoryName = usesLegacyPlaceholder
    ? fallback!.categoryName
    : String(row.category_name || fallback?.categoryName || 'Khác');

  return {
    id: String(row.id),
    sku: String(row.sku || fallback?.sku || row.id),
    name: String(row.name || fallback?.name || ''),
    slug: String(row.slug || fallback?.slug || row.id),
    price: Number(row.price ?? fallback?.price ?? 0),
    originalPrice: Number(row.original_price ?? fallback?.originalPrice ?? row.price ?? 0),
    vatRate: Number(row.vat_rate ?? fallback?.vatRate ?? 0),
    vatCalculation: row.vat_calculation === 'exclusive' ? 'exclusive' : 'inclusive',
    discountPercent: Number(row.original_price ?? 0) > Number(row.price ?? 0)
      ? Math.round(
          ((Number(row.original_price) - Number(row.price)) / Number(row.original_price)) * 100,
        )
      : undefined,
    rating: Number(row.rating ?? fallback?.rating ?? 5),
    reviewCount: Number(row.review_count ?? fallback?.reviewCount ?? 0),
    soldCount: String(row.sold_count || fallback?.soldCount || ''),
    image,
    gallery: asStringArray(row.gallery).length
      ? asStringArray(row.gallery)
      : fallback?.gallery || (image ? [image] : []),
    category,
    categoryName,
    subcategory: fallback?.subcategory,
    unit: String(row.unit || fallback?.unit || 'Sản phẩm'),
    origin: String(row.origin || fallback?.origin || 'Việt Nam'),
    storage: String(row.storage_instructions || fallback?.storage || ''),
    expiry: String(row.expiry || fallback?.expiry || ''),
    stock,
    status: getProductStatus(stock, threshold, temporarilyUnavailable),
    publicationStatus: (row.publication_status as Product['publicationStatus']) || 'published',
    lowStockThreshold: threshold,
    temporarilyUnavailable,
    isOrganic: Boolean(row.is_organic ?? fallback?.isOrganic),
    isBestSeller: Boolean(row.is_best_seller ?? fallback?.isBestSeller),
    isFeatured: Boolean(row.is_featured ?? fallback?.isFeatured),
    brand: String(row.brand || fallback?.brand || ''),
    tags: asStringArray(row.tags).length ? asStringArray(row.tags) : fallback?.tags,
    description: String(row.description || fallback?.description || ''),
    benefits: asStringArray(row.benefits).length ? asStringArray(row.benefits) : fallback?.benefits,
  };
};

const productToRow = (product: Product) => ({
  id: product.id,
  sku: product.sku.trim(),
  name: product.name.trim(),
  slug: product.slug.trim(),
  price: product.price,
  original_price: product.originalPrice,
  vat_rate: product.vatRate ?? 0,
  vat_calculation: product.vatCalculation || 'inclusive',
  stock: product.stock,
  is_active: product.publicationStatus !== 'archived',
  category_slug: product.category,
  category_name: product.categoryName,
  description: product.description || null,
  image_url: product.image || null,
  gallery: product.gallery,
  unit: product.unit,
  origin: product.origin,
  storage_instructions: product.storage,
  expiry: product.expiry,
  rating: product.rating,
  review_count: product.reviewCount,
  sold_count: product.soldCount || null,
  is_organic: Boolean(product.isOrganic),
  is_best_seller: Boolean(product.isBestSeller),
  is_featured: Boolean(product.isFeatured),
  brand: product.brand || null,
  tags: product.tags || [],
  benefits: product.benefits || [],
  publication_status: product.publicationStatus || 'published',
  low_stock_threshold: product.lowStockThreshold ?? 10,
  temporarily_unavailable: Boolean(product.temporarilyUnavailable),
  updated_at: new Date().toISOString(),
});

export const mapCategoryRow = (row: DatabaseRow): Category => ({
  id: String(row.id),
  name: String(row.name),
  slug: String(row.slug),
  image: String(row.image_url || ''),
  count: Number(row.product_count || 0),
  description: String(row.description || ''),
  parentId: row.parent_id ? String(row.parent_id) : undefined,
  sortOrder: Number(row.sort_order || 0),
  active: Boolean(row.is_active),
});

const categoryToRow = (category: CategoryWrite) => ({
  name: category.name.trim(),
  slug: category.slug.trim().toLowerCase(),
  description: category.description?.trim() || null,
  image_url: category.image.trim() || null,
  parent_id: category.parentId || null,
  sort_order: category.sortOrder ?? 0,
  is_active: category.active ?? true,
  updated_at: new Date().toISOString(),
});

export const mapBannerRow = (row: DatabaseRow): Banner => {
  const placement = (row.placement as Banner['placement']) || 'home_hero';
  const fallback = mockBanners.find((b) => b.placement === placement) || mockBanners[0];
  const rowTitle = String(row.title || '').trim();
  const rowSubtitle = String(row.subtitle || '').trim();
  const rowImage = String(row.image_url || '').trim();
  const isPlaceholderImage = !rowImage || rowImage.includes('images.unsplash.com/photo-1542838132');

  const title = rowTitle || fallback?.title || 'Trọn Vẹn Tinh Hoa Hải Sản & Thực Phẩm Nhật Bản';
  const subtitle = rowSubtitle || fallback?.subtitle || 'DAICHI SUISAN - Chất lượng từ nguyên liệu, trọn vẹn trong từng bữa ăn. Nguồn hải sản tươi sống nhập khẩu chính ngạch từ các ngư trường trù phú nhất xứ Phù Tang.';
  const image = (!isPlaceholderImage ? rowImage : fallback?.image) || '/images/daichi-hero-seafood.png';

  const rawGallery = asStringArray(row.image_gallery).filter(Boolean);
  const cleanGallery = rawGallery.filter((url) => !url.includes('images.unsplash.com/photo-1542838132') && !url.startsWith('data:image'));
  const gallery = cleanGallery.length > 0 ? cleanGallery : [image];

  return {
    id: String(row.id),
    title,
    subtitle,
    image,
    gallery,
    mobileImage: row.mobile_image_url ? String(row.mobile_image_url) : undefined,
    ctaText: String(row.cta_text || fallback?.ctaText || 'Mua ngay'),
    ctaLink: String(row.cta_link || fallback?.ctaLink || '/products'),
    badge: (row.badge ? String(row.badge) : undefined) || fallback?.badge || 'DAICHI SUISAN • Chuẩn Vị Nhật Bản',
    colorScheme: (row.color_scheme as Banner['colorScheme']) || fallback?.colorScheme || 'green',
    placement,
    sortOrder: Number(row.sort_order || 0),
    publicationStatus: (row.publication_status as Banner['publicationStatus']) || 'published',
    startsAt: row.starts_at ? String(row.starts_at) : undefined,
    endsAt: row.ends_at ? String(row.ends_at) : undefined,
    active: ['scheduled', 'published'].includes(String(row.publication_status)),
  };
};

const bannerToRow = (banner: Omit<Banner, 'id'> | Banner) => ({
  title: banner.title,
  subtitle: banner.subtitle,
  image_url: banner.image,
  image_gallery: banner.gallery?.length ? banner.gallery : [banner.image],
  mobile_image_url: banner.mobileImage || null,
  cta_text: banner.ctaText || 'Xem ngay',
  cta_link: banner.ctaLink || '/',
  badge: banner.badge || null,
  color_scheme: banner.colorScheme || 'green',
  placement: banner.placement || 'home_hero',
  sort_order: banner.sortOrder || 0,
  publication_status: banner.publicationStatus || (banner.active ? 'published' : 'draft'),
  starts_at: banner.startsAt || null,
  ends_at: banner.endsAt || null,
  updated_at: new Date().toISOString(),
});

const mapPromotionRow = (row: DatabaseRow): Promotion => {
  const today = new Date().toISOString().slice(0, 10);
  const startsOn = String(row.starts_on);
  const endsOn = String(row.ends_on);
  const publicationStatus = String(row.publication_status || 'published');
  let status: Promotion['status'] = publicationStatus as Promotion['status'];
  if (publicationStatus === 'published') {
    status = today < startsOn ? 'scheduled' : today > endsOn ? 'expired' : 'active';
  }

  return {
    id: String(row.code),
    title: String(row.title),
    code: String(row.code),
    description: row.description ? String(row.description) : undefined,
    discountAmount: row.discount_amount == null ? undefined : Number(row.discount_amount),
    discountPercent: row.discount_percent == null ? undefined : Number(row.discount_percent),
    discountType: (row.discount_type as Promotion['discountType']) || 'fixed',
    minOrder: Number(row.min_order || 0),
    maxDiscount: row.max_discount == null ? undefined : Number(row.max_discount),
    usageLimit: row.usage_limit == null ? undefined : Number(row.usage_limit),
    usageLimitPerCustomer: row.usage_limit_per_customer == null
      ? undefined
      : Number(row.usage_limit_per_customer),
    usageCount: Number(row.usage_count || 0),
    stackable: Boolean(row.stackable),
    startDate: startsOn,
    endDate: endsOn,
    status,
  };
};

export const loadAdminData = async () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');

  const [productResult, categoryResult, bannerResult, promotionResult] = await Promise.all([
    supabase.from('catalog_products').select('*').order('updated_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('banners').select('*').order('sort_order'),
    supabase.from('promotions').select('*').order('starts_on', { ascending: false }),
  ]);

  const error = productResult.error || categoryResult.error || bannerResult.error || promotionResult.error;
  if (error) throw error;

  return {
    products: (productResult.data || []).map((row) => mapProductRow(row as DatabaseRow)),
    categories: (categoryResult.data || []).map((row) => mapCategoryRow(row as DatabaseRow)),
    banners: (bannerResult.data || []).map((row) => mapBannerRow(row as DatabaseRow)),
    promotions: (promotionResult.data || []).map((row) => mapPromotionRow(row as DatabaseRow)),
  };
};

export const createRemoteProduct = async (product: Product) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  const { data, error } = await supabase
    .from('catalog_products')
    .insert(productToRow(product))
    .select()
    .single();
  if (error) throw new Error(getProductWriteError(error));
  return mapProductRow(data as DatabaseRow);
};

export const updateRemoteProduct = async (previous: Product, next: Product) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();

  if (previous.stock !== next.stock) {
    const { error: inventoryError } = await supabase.rpc('adjust_freshmart_inventory', {
      p_product_id: previous.id,
      p_quantity_delta: next.stock - previous.stock,
      p_movement_type: 'adjustment',
      p_note: 'Điều chỉnh từ màn hình sản phẩm',
    });
    if (inventoryError) throw inventoryError;
  }

  const row = productToRow(next);
  delete (row as Partial<typeof row>).stock;
  const { data, error } = await supabase
    .from('catalog_products')
    .update(row)
    .eq('id', previous.id)
    .select()
    .single();
  if (error) throw error;
  return mapProductRow(data as DatabaseRow);
};

export const archiveRemoteProduct = async (id: string) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { error } = await supabase
    .from('catalog_products')
    .update({ publication_status: 'archived', is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const createRemoteCategory = async (category: Omit<Category, 'id' | 'count'>) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  try {
    await ensureFreshAdminSession();
  } catch {
    // Proceed in localhost / demo mode
  }
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryToRow(category))
    .select()
    .single();
  if (error) throw error;
  return mapCategoryRow(data as DatabaseRow);
};

export const updateRemoteCategory = async (category: Category) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  try {
    await ensureFreshAdminSession();
  } catch {
    // Proceed in localhost / demo mode
  }
  const { data, error } = await supabase
    .from('categories')
    .update(categoryToRow(category))
    .eq('id', category.id)
    .select()
    .single();
  if (error) throw error;
  return mapCategoryRow(data as DatabaseRow);
};

export const reorderRemoteCategories = async (
  orderedItems: Array<{ id: string; sortOrder: number }>,
) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  try {
    await ensureFreshAdminSession();
  } catch {
    // Proceed
  }

  const payload = orderedItems.map((item) => ({
    id: item.id,
    sort_order: item.sortOrder,
  }));

  const { error } = await supabase.rpc('reorder_freshmart_categories', {
    p_items: payload,
  });

  if (error) {
    await Promise.all(
      orderedItems.map((item) =>
        supabase!
          .from('categories')
          .update({ sort_order: item.sortOrder, updated_at: new Date().toISOString() })
          .eq('id', item.id)
      )
    );
  }
};

export const archiveRemoteCategory = async (id: string) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  try {
    await ensureFreshAdminSession();
  } catch {
    // Proceed
  }
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const createRemoteBanner = async (banner: Omit<Banner, 'id'>) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  const { data, error } = await supabase
    .from('banners')
    .insert(bannerToRow(banner))
    .select()
    .single();
  if (error) throw new Error(`Lưu banner vào cơ sở dữ liệu thất bại: ${error.message}`);
  return mapBannerRow(data as DatabaseRow);
};

export const updateRemoteBanner = async (banner: Banner) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  const { data, error } = await supabase
    .from('banners')
    .update(bannerToRow(banner))
    .eq('id', banner.id)
    .select()
    .single();
  if (error) throw new Error(`Cập nhật banner thất bại: ${error.message}`);
  return mapBannerRow(data as DatabaseRow);
};

export const archiveRemoteBanner = async (id: string) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  const { error } = await supabase
    .from('banners')
    .update({ publication_status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`Lưu trữ banner thất bại: ${error.message}`);
};

const promotionToRow = (promo: Promotion | Omit<Promotion, 'id'>) => {
  const publicationStatus = ['active', 'scheduled'].includes(promo.status)
    ? promo.status === 'active' ? 'published' : 'scheduled'
    : promo.status;

  return {
    code: promo.code.toUpperCase().trim(),
    title: promo.title.trim(),
    description: promo.description || null,
    discount_type: promo.discountType || 'fixed',
    discount_amount: promo.discountAmount ?? null,
    discount_percent: promo.discountPercent ?? null,
    min_order: promo.minOrder || 0,
    max_discount: promo.maxDiscount ?? null,
    usage_limit: promo.usageLimit ?? null,
    usage_limit_per_customer: promo.usageLimitPerCustomer ?? null,
    stackable: Boolean(promo.stackable),
    starts_on: promo.startDate,
    ends_on: promo.endDate,
    is_active: !['paused', 'archived'].includes(promo.status),
    publication_status: publicationStatus,
    updated_at: new Date().toISOString(),
  };
};

export const createRemotePromotion = async (promo: Omit<Promotion, 'id'>) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  const row = promotionToRow(promo);
  const { data, error } = await supabase
    .from('promotions')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Tạo khuyến mại thất bại: ${error.message}`);
  return mapPromotionRow(data as DatabaseRow);
};

export const updateRemotePromotion = async (code: string, promo: Partial<Promotion>) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (promo.title !== undefined) payload.title = promo.title.trim();
  if (promo.description !== undefined) payload.description = promo.description || null;
  if (promo.discountType !== undefined) payload.discount_type = promo.discountType;
  if (promo.discountAmount !== undefined) payload.discount_amount = promo.discountAmount ?? null;
  if (promo.discountPercent !== undefined) payload.discount_percent = promo.discountPercent ?? null;
  if (promo.minOrder !== undefined) payload.min_order = promo.minOrder;
  if (promo.maxDiscount !== undefined) payload.max_discount = promo.maxDiscount ?? null;
  if (promo.usageLimit !== undefined) payload.usage_limit = promo.usageLimit ?? null;
  if (promo.usageLimitPerCustomer !== undefined) payload.usage_limit_per_customer = promo.usageLimitPerCustomer ?? null;
  if (promo.stackable !== undefined) payload.stackable = Boolean(promo.stackable);
  if (promo.startDate !== undefined) payload.starts_on = promo.startDate;
  if (promo.endDate !== undefined) payload.ends_on = promo.endDate;
  if (promo.status !== undefined) {
    payload.is_active = !['paused', 'archived'].includes(promo.status);
    payload.publication_status = ['active', 'scheduled'].includes(promo.status)
      ? promo.status === 'active' ? 'published' : 'scheduled'
      : promo.status;
  }

  const { data, error } = await supabase
    .from('promotions')
    .update(payload)
    .eq('code', code.toUpperCase())
    .select()
    .single();
  if (error) throw new Error(`Cập nhật khuyến mại thất bại: ${error.message}`);
  return mapPromotionRow(data as DatabaseRow);
};

export const archiveRemotePromotion = async (code: string) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  const { error } = await supabase
    .from('promotions')
    .update({
      publication_status: 'archived',
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('code', code.toUpperCase());
  if (error) throw new Error(`Lưu trữ khuyến mại thất bại: ${error.message}`);
};

export const pauseRemotePromotion = async (code: string) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  const { error } = await supabase
    .from('promotions')
    .update({
      publication_status: 'paused',
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('code', code.toUpperCase());
  if (error) throw new Error(`Tạm dừng khuyến mại thất bại: ${error.message}`);
};

export const resumeRemotePromotion = async (code: string) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  await ensureFreshAdminSession();
  const { error } = await supabase
    .from('promotions')
    .update({
      publication_status: 'published',
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('code', code.toUpperCase());
  if (error) throw new Error(`Kích hoạt lại khuyến mại thất bại: ${error.message}`);
};

