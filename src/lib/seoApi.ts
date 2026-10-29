import { SiteSeoSetting } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

const LOCAL_SEO_STORAGE_KEY = 'daichi_cms_seo_settings_v1';

type DatabaseRow = Record<string, unknown>;

export const defaultSeoSettings: SiteSeoSetting[] = [
  {
    id: 'seo-default',
    pagePath: 'default',
    metaTitle: 'DAICHI SUISAN - Tinh Hoa Hải Sản Nhật Bản',
    metaDescription: 'Chuyên cung cấp hải sản cao cấp nhập khẩu trực tiếp từ Nhật Bản: Cá hồi Nauy, Cá ngừ đại dương, Bào ngư, Sò điệp Hotate, Cua Tuyết...',
    ogImageUrl: '/images/daichi-hero-seafood.png',
    ogTitle: 'DAICHI SUISAN - Tinh Hoa Thực Phẩm Nhật',
    ogDescription: 'Mang tinh hoa thực phẩm Nhật Bản đến gần hơn với mọi gia đình.',
    canonicalUrl: '',
    keywords: 'hải sản nhật bản, sashimi, daichi suisan, cá hồi, sò điệp hokkaido',
    isIndexable: true,
  },
  {
    id: 'seo-home',
    pagePath: '/',
    metaTitle: 'DAICHI SUISAN | Tinh Hoa Thực Phẩm Nhật Bản',
    metaDescription: 'Hải sản nhập khẩu trực tiếp từ ngư trường Toyosu & Hokkaido. Giao hàng hỏa tốc trong 2 giờ.',
    ogImageUrl: '/images/daichi-hero-seafood.png',
    ogTitle: 'DAICHI SUISAN - Hải Sản Chuẩn Vị Nhật Bản',
    ogDescription: 'Giao hàng hỏa tốc 2 giờ tại Hà Nội. Chuẩn sashimi 100%.',
    canonicalUrl: '',
    keywords: 'hải sản nhật, sashimi tươi, thực phẩm nhật bản, daichi suisan',
    isIndexable: true,
  },
  {
    id: 'seo-about',
    pagePath: '/about',
    metaTitle: 'Về Chúng Tôi - DAICHI SUISAN',
    metaDescription: 'Tìm hiểu câu chuyện, sứ mệnh và cam kết chất lượng của DAICHI SUISAN trong hành trình mang tinh hoa ẩm thực biển Nhật Bản.',
    ogImageUrl: '/images/daichi-chef-craft.png',
    ogTitle: 'Câu Chuyện Thương Hiệu - DAICHI SUISAN',
    ogDescription: 'Hành trình kết nối nguồn hải sản tinh hoa từ ngư trường Nhật Bản tới bàn ăn gia đình Việt.',
    canonicalUrl: '',
    keywords: 'về daichi suisan, câu chuyện thương hiệu, hải sản nhật chất lượng',
    isIndexable: true,
  },
  {
    id: 'seo-contact',
    pagePath: '/contact',
    metaTitle: 'Liên Hệ - DAICHI SUISAN',
    metaDescription: 'Liên hệ đặt hàng, hỗ trợ dịch vụ khách hàng và phản ánh chất lượng. Hotline: 0398 018 639.',
    ogImageUrl: '',
    ogTitle: 'Liên Hệ DAICHI SUISAN',
    ogDescription: 'Chúng tôi luôn sẵn sàng hỗ trợ quý khách về sản phẩm và đơn hàng.',
    canonicalUrl: '',
    keywords: 'liên hệ daichi suisan, địa chỉ hải sản nhật, hotline đặt hàng',
    isIndexable: true,
  },
  {
    id: 'seo-products',
    pagePath: '/products',
    metaTitle: 'Tất Cả Sản Phẩm - DAICHI SUISAN',
    metaDescription: 'Khám phá danh mục hải sản Nhật Bản cao cấp: Sashimi, Cá tươi, Đồ khô & Gia vị truyền thống.',
    ogImageUrl: '',
    ogTitle: 'Danh Mục Sản Phẩm - DAICHI SUISAN',
    ogDescription: 'Tuyển chọn hải sản tươi ngon nhất nhập khẩu đường hàng không.',
    canonicalUrl: '',
    keywords: 'sản phẩm daichi suisan, mua sashimi, hải sản nhập khẩu',
    isIndexable: true,
  },
  {
    id: 'seo-news',
    pagePath: '/news',
    metaTitle: 'Tin Tức & Kiến Thức Ẩm Thực - DAICHI SUISAN',
    metaDescription: 'Cập nhật kiến thức ẩm thực Nhật, công thức chế biến sashimi và các chương trình ưu đãi mới nhất.',
    ogImageUrl: '',
    ogTitle: 'Tin Tức Ẩm Thực Nhật Bản - DAICHI SUISAN',
    ogDescription: 'Bí quyết thưởng thức sashimi và chế biến hải sản chuẩn Nhật.',
    canonicalUrl: '',
    keywords: 'kiến thức ẩm thực nhật, công thức sashimi, ưu đãi hải sản',
    isIndexable: true,
  },
];

const mapSeoRow = (row: DatabaseRow): SiteSeoSetting => ({
  id: String(row.id),
  pagePath: String(row.page_path || 'default'),
  metaTitle: String(row.meta_title || ''),
  metaDescription: String(row.meta_description || ''),
  ogImageUrl: String(row.og_image_url || ''),
  ogTitle: String(row.og_title || ''),
  ogDescription: String(row.og_description || ''),
  canonicalUrl: String(row.canonical_url || ''),
  keywords: String(row.keywords || ''),
  isIndexable: Boolean(row.is_indexable),
  updatedAt: row.updated_at ? String(row.updated_at) : undefined,
});

export const loadAllSeoSettings = async (): Promise<SiteSeoSetting[]> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const saved = localStorage.getItem(LOCAL_SEO_STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultSeoSettings;
    } catch {
      return defaultSeoSettings;
    }
  }

  const { data, error } = await supabase.from('site_seo_settings').select('*');
  if (error) throw new Error(`Lỗi tải cài đặt SEO: ${error.message}`);
  if (!data || data.length === 0) return defaultSeoSettings;
  return data.map((r) => mapSeoRow(r as DatabaseRow));
};

export const loadSeoSettingByPath = async (pagePath: string): Promise<SiteSeoSetting> => {
  const all = await loadAllSeoSettings();
  const match = all.find((s) => s.pagePath === pagePath);
  if (match) return match;
  const def = all.find((s) => s.pagePath === 'default');
  return def || defaultSeoSettings[0];
};

export const saveSeoSetting = async (setting: SiteSeoSetting): Promise<SiteSeoSetting> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const saved = localStorage.getItem(LOCAL_SEO_STORAGE_KEY);
      const list: SiteSeoSetting[] = saved ? JSON.parse(saved) : [...defaultSeoSettings];
      const idx = list.findIndex((s) => s.pagePath === setting.pagePath);
      const updated = { ...setting, updatedAt: new Date().toISOString() };
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      localStorage.setItem(LOCAL_SEO_STORAGE_KEY, JSON.stringify(list));
      return updated;
    } catch {
      return setting;
    }
  }

  const payload = {
    page_path: setting.pagePath,
    meta_title: setting.metaTitle.trim(),
    meta_description: setting.metaDescription.trim(),
    og_image_url: setting.ogImageUrl.trim(),
    og_title: setting.ogTitle.trim(),
    og_description: setting.ogDescription.trim(),
    canonical_url: setting.canonicalUrl.trim(),
    keywords: setting.keywords.trim(),
    is_indexable: Boolean(setting.isIndexable),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('site_seo_settings')
    .upsert(payload, { onConflict: 'page_path' })
    .select()
    .single();

  if (error) throw new Error(`Lưu cài đặt SEO thất bại: ${error.message}`);
  return mapSeoRow(data as DatabaseRow);
};
