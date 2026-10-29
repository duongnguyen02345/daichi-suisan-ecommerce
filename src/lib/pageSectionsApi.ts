import { PageSection, PublicationStatus } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

const LOCAL_PAGE_SECTIONS_KEY = 'daichi_cms_page_sections_v1';

type DatabaseRow = Record<string, unknown>;

export const sanitizeText = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '');
};

export const defaultPageSections: PageSection[] = [
  {
    id: 'home-hero',
    pageKey: 'home',
    sectionKey: 'hero',
    title: 'Hải Sản Tươi Ngon Chuẩn Nhật',
    subtitle: 'Nhập khẩu trực tiếp từ ngư trường Toyosu & Hokkaido',
    body: {
      badge: 'HẢI SẢN CAO CẤP',
      features: ['Giao hỏa tốc 2H', 'Chuẩn sashimi 100%', 'Bảo quản âm sâu -60°C'],
    },
    ctaText: 'Khám phá ngay',
    ctaLink: '/products',
    sortOrder: 1,
    isVisible: true,
    publicationStatus: 'published',
  },
  {
    id: 'home-intro',
    pageKey: 'home',
    sectionKey: 'intro',
    title: 'Về DAICHI SUISAN',
    subtitle: 'Đưa tinh hoa ẩm thực xứ hoa anh đào tới bàn ăn Việt',
    body: {
      description:
        'DAICHI SUISAN tự hào là cầu nối ẩm thực biển Nhật Bản cao cấp. Mỗi loại hải sản đều được tuyển lựa nghiêm ngặt và vận chuyển đường hàng không để đảm bảo độ tươi tuyệt hảo.',
    },
    ctaText: 'Xem thêm câu chuyện',
    ctaLink: '/about',
    sortOrder: 2,
    isVisible: true,
    publicationStatus: 'published',
  },
  {
    id: 'home-artisan',
    pageKey: 'home',
    sectionKey: 'artisan',
    title: 'Nghệ Thuật Xử Lý Chuẩn Sashimi',
    subtitle: 'Phương pháp Ikijime giữ trọn vẹn vị umami tự nhiên',
    body: {
      quote:
        'Sự tươi ngon không chỉ là thời gian, đó là cả một nghệ thuật bảo quản và chế biến chuẩn mực Nhật Bản.',
      artisanName: 'Bếp Trưởng Hải Sản Nhật Bản',
    },
    ctaText: 'Tìm hiểu quy trình',
    ctaLink: '/about',
    sortOrder: 3,
    isVisible: true,
    publicationStatus: 'published',
  },
  {
    id: 'home-commitments',
    pageKey: 'home',
    sectionKey: 'commitments',
    title: 'Cam Kết Vàng Từ DAICHI SUISAN',
    subtitle: 'Tiêu chuẩn chất lượng vượt trội vì sức khỏe gia đình',
    body: {
      items: [
        { title: '100% Nguồn Gốc Nhật', desc: 'Có đầy đủ chứng nhận xuất xứ CO/CQ từng lô hàng' },
        { title: 'Cấp Đông Siêu Tốc', desc: 'Công nghệ cấp đông proton giữ trọn vẹn kết cấu tế bào cá' },
        { title: 'Giao Hàng Chuyên Biệt', desc: 'Thùng lạnh giữ nhiệt chuyên dụng kèm đá gel tiêu chuẩn' },
      ],
    },
    ctaText: '',
    ctaLink: '',
    sortOrder: 4,
    isVisible: true,
    publicationStatus: 'published',
  },
  {
    id: 'about-hero',
    pageKey: 'about',
    sectionKey: 'hero',
    title: 'Câu Chuyện DAICHI SUISAN',
    subtitle: 'Hành trình mang hương vị biển Nhật đến gia đình Việt',
    body: { badge: 'VỀ CHÚNG TÔI' },
    ctaText: '',
    ctaLink: '',
    sortOrder: 1,
    isVisible: true,
    publicationStatus: 'published',
  },
  {
    id: 'about-vision',
    pageKey: 'about',
    sectionKey: 'vision',
    title: 'Tầm Nhìn & Sứ Mệnh',
    subtitle: 'Trở thành thương hiệu hải sản Nhật Bản uy tín hàng đầu',
    body: {
      vision: 'Xây dựng chuỗi cung ứng hải sản Nhật chất lượng cao và minh bạch số một tại Việt Nam.',
      mission: 'Đem đến nguồn thực phẩm an lành, dinh dưỡng tinh hoa và trải nghiệm trọn vẹn cho khách hàng.',
    },
    ctaText: '',
    ctaLink: '',
    sortOrder: 2,
    isVisible: true,
    publicationStatus: 'published',
  },
  {
    id: 'about-values',
    pageKey: 'about',
    sectionKey: 'values',
    title: 'Giá Trị Cốt Lõi',
    subtitle: 'Chất Lượng - Minh Bạch - Tận Tâm',
    body: {
      values: [
        { name: 'Chất Lượng Thật', desc: 'Không thỏa hiệp về độ tươi ngon và nguồn gốc xuất xứ' },
        { name: 'Minh Bạch', desc: 'Nguồn gốc rõ ràng và kiểm định nghiêm ngặt' },
        { name: 'Tận Tâm', desc: 'Phục vụ chu đáo mọi yêu cầu của khách hàng' },
      ],
    },
    ctaText: '',
    ctaLink: '',
    sortOrder: 3,
    isVisible: true,
    publicationStatus: 'published',
  },
  {
    id: 'contact-hero',
    pageKey: 'contact',
    sectionKey: 'hero',
    title: 'Liên Hệ Với Chúng Tôi',
    subtitle: 'Chúng tôi luôn sẵn sàng hỗ trợ quý khách',
    body: {
      hotline: '0398 018 639',
      address: '446 Đội Cấn, Ba Đình, Hà Nội',
      hours: '08:00 - 21:00 hàng ngày',
    },
    ctaText: 'Gọi ngay',
    ctaLink: 'tel:0398018639',
    sortOrder: 1,
    isVisible: true,
    publicationStatus: 'published',
  },
  {
    id: 'common-notice',
    pageKey: 'common',
    sectionKey: 'header_notice',
    title: 'Thông Báo Website',
    subtitle: 'Giao hàng miễn phí cho đơn từ 1.000.000đ trong nội thành Hà Nội',
    body: {},
    ctaText: '',
    ctaLink: '',
    sortOrder: 1,
    isVisible: true,
    publicationStatus: 'published',
  },
];

const mapSectionRow = (row: DatabaseRow): PageSection => ({
  id: String(row.id),
  pageKey: String(row.page_key),
  sectionKey: String(row.section_key),
  title: String(row.title || ''),
  subtitle: String(row.subtitle || ''),
  body: (row.body && typeof row.body === 'object' ? row.body : {}) as Record<string, any>,
  mediaAssetId: row.media_asset_id ? String(row.media_asset_id) : undefined,
  ctaText: String(row.cta_text || ''),
  ctaLink: String(row.cta_link || ''),
  sortOrder: Number(row.sort_order || 0),
  isVisible: Boolean(row.is_visible),
  publicationStatus: (row.publication_status as PublicationStatus) || 'published',
  publishedAt: row.published_at ? String(row.published_at) : undefined,
  updatedBy: row.updated_by ? String(row.updated_by) : undefined,
  createdAt: row.created_at ? String(row.created_at) : undefined,
  updatedAt: row.updated_at ? String(row.updated_at) : undefined,
});

const sectionToRow = (section: PageSection, adminUserId?: string) => ({
  page_key: section.pageKey.trim(),
  section_key: section.sectionKey.trim(),
  title: sanitizeText(section.title.trim()),
  subtitle: sanitizeText(section.subtitle.trim()),
  body: section.body || {},
  media_asset_id: section.mediaAssetId || null,
  cta_text: sanitizeText(section.ctaText.trim()),
  cta_link: sanitizeText(section.ctaLink.trim()),
  sort_order: Number(section.sortOrder || 0),
  is_visible: Boolean(section.isVisible),
  publication_status: section.publicationStatus || 'published',
  updated_by: adminUserId || null,
  updated_at: new Date().toISOString(),
});

export const loadPageSections = async (pageKey?: string): Promise<PageSection[]> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = localStorage.getItem(LOCAL_PAGE_SECTIONS_KEY);
      const list: PageSection[] = local ? JSON.parse(local) : defaultPageSections;
      return pageKey ? list.filter((s) => s.pageKey === pageKey) : list;
    } catch {
      return pageKey ? defaultPageSections.filter((s) => s.pageKey === pageKey) : defaultPageSections;
    }
  }

  let query = supabase.from('page_sections').select('*').order('sort_order', { ascending: true });
  if (pageKey) {
    query = query.eq('page_key', pageKey);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi tải nội dung trang: ${error.message}`);

  if (!data || data.length === 0) {
    return pageKey ? defaultPageSections.filter((s) => s.pageKey === pageKey) : defaultPageSections;
  }

  return data.map((row) => mapSectionRow(row as DatabaseRow));
};

export const savePageSection = async (section: PageSection): Promise<PageSection> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = localStorage.getItem(LOCAL_PAGE_SECTIONS_KEY);
      const list: PageSection[] = local ? JSON.parse(local) : [...defaultPageSections];
      const index = list.findIndex(
        (s) => s.pageKey === section.pageKey && s.sectionKey === section.sectionKey,
      );
      const updated = {
        ...section,
        id: section.id || `local-section-${crypto.randomUUID()}`,
        updatedAt: new Date().toISOString(),
      };
      if (index >= 0) {
        list[index] = updated;
      } else {
        list.push(updated);
      }
      localStorage.setItem(LOCAL_PAGE_SECTIONS_KEY, JSON.stringify(list));
      return updated;
    } catch {
      return section;
    }
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('Phiên quản trị viên đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const payload = sectionToRow(section, authData.user.id);
  const { data, error } = await supabase
    .from('page_sections')
    .upsert(payload, { onConflict: 'page_key,section_key' })
    .select()
    .single();

  if (error) {
    throw new Error(`Lưu phần nội dung thất bại: ${error.message}`);
  }

  return mapSectionRow(data as DatabaseRow);
};

export const deletePageSection = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = localStorage.getItem(LOCAL_PAGE_SECTIONS_KEY);
      const list: PageSection[] = local ? JSON.parse(local) : defaultPageSections;
      const nextList = list.filter((s) => s.id !== id);
      localStorage.setItem(LOCAL_PAGE_SECTIONS_KEY, JSON.stringify(nextList));
    } catch {}
    return;
  }

  const { error } = await supabase.from('page_sections').delete().eq('id', id);
  if (error) throw new Error(`Xóa phần nội dung thất bại: ${error.message}`);
};
