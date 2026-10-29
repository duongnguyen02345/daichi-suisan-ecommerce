import { MenuLocation, SiteNavigationItem } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

const LOCAL_NAV_STORAGE_KEY = 'daichi_cms_navigation_items_v1';

type DatabaseRow = Record<string, unknown>;

export const defaultNavigationItems: SiteNavigationItem[] = [
  { id: 'h-1', menuLocation: 'header', label: 'Trang chủ', url: '/', sortOrder: 1, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'h-2', menuLocation: 'header', label: 'Về chúng tôi', url: '/about', sortOrder: 2, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'h-3', menuLocation: 'header', label: 'Sản phẩm', url: '/products', sortOrder: 3, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'h-4', menuLocation: 'header', label: 'Tin tức', url: '/news', sortOrder: 4, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'h-5', menuLocation: 'header', label: 'Liên hệ', url: '/contact', sortOrder: 5, isExternal: false, openInNewTab: false, isActive: true },

  { id: 'f-1', menuLocation: 'footer_quick_links', label: 'Về chúng tôi', url: '/about', sortOrder: 1, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'f-2', menuLocation: 'footer_quick_links', label: 'Sản phẩm', url: '/products', sortOrder: 2, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'f-3', menuLocation: 'footer_quick_links', label: 'Tin tức ẩm thực', url: '/news', sortOrder: 3, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'f-4', menuLocation: 'footer_quick_links', label: 'Liên hệ & Hợp tác', url: '/contact', sortOrder: 4, isExternal: false, openInNewTab: false, isActive: true },

  { id: 'p-1', menuLocation: 'footer_policy', label: 'Hướng dẫn mua hàng', url: '/ordering-guide', sortOrder: 1, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'p-2', menuLocation: 'footer_policy', label: 'Chính sách giao hàng', url: '/shipping-policy', sortOrder: 2, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'p-3', menuLocation: 'footer_policy', label: 'Chính sách đổi trả', url: '/refund-policy', sortOrder: 3, isExternal: false, openInNewTab: false, isActive: true },
  { id: 'p-4', menuLocation: 'footer_policy', label: 'Chính sách bảo mật', url: '/privacy-policy', sortOrder: 4, isExternal: false, openInNewTab: false, isActive: true },
];

export const isSafeUrl = (url: string): boolean => {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return false;
  }
  return true;
};

const mapNavRow = (row: DatabaseRow): SiteNavigationItem => ({
  id: String(row.id),
  menuLocation: (row.menu_location as MenuLocation) || 'header',
  label: String(row.label || ''),
  url: String(row.url || '/'),
  sortOrder: Number(row.sort_order || 0),
  isExternal: Boolean(row.is_external),
  openInNewTab: Boolean(row.open_in_new_tab),
  isActive: Boolean(row.is_active),
  createdAt: row.created_at ? String(row.created_at) : undefined,
  updatedAt: row.updated_at ? String(row.updated_at) : undefined,
});

export const loadNavigationItems = async (location?: MenuLocation): Promise<SiteNavigationItem[]> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const saved = localStorage.getItem(LOCAL_NAV_STORAGE_KEY);
      const list: SiteNavigationItem[] = saved ? JSON.parse(saved) : defaultNavigationItems;
      return location ? list.filter((i) => i.menuLocation === location && i.isActive) : list;
    } catch {
      return location ? defaultNavigationItems.filter((i) => i.menuLocation === location) : defaultNavigationItems;
    }
  }

  let query = supabase
    .from('site_navigation_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (location) {
    query = query.eq('menu_location', location);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi tải menu: ${error.message}`);

  if (!data || data.length === 0) {
    return location ? defaultNavigationItems.filter((i) => i.menuLocation === location) : defaultNavigationItems;
  }

  return data.map((r) => mapNavRow(r as DatabaseRow));
};

export const saveNavigationItem = async (item: Omit<SiteNavigationItem, 'id'> & { id?: string }): Promise<SiteNavigationItem> => {
  if (!isSafeUrl(item.url)) {
    throw new Error('Đường dẫn URL chứa tiền tố hoặc mã không an toàn (javascript:, data:).');
  }

  if (!isSupabaseConfigured || !supabase) {
    try {
      const saved = localStorage.getItem(LOCAL_NAV_STORAGE_KEY);
      const list: SiteNavigationItem[] = saved ? JSON.parse(saved) : [...defaultNavigationItems];
      const id = item.id || `local-nav-${crypto.randomUUID()}`;
      const nextItem: SiteNavigationItem = { ...item, id, updatedAt: new Date().toISOString() };
      const idx = list.findIndex((i) => i.id === id);
      if (idx >= 0) {
        list[idx] = nextItem;
      } else {
        list.push(nextItem);
      }
      localStorage.setItem(LOCAL_NAV_STORAGE_KEY, JSON.stringify(list));
      return nextItem;
    } catch {
      return { ...item, id: `local-nav-${crypto.randomUUID()}` };
    }
  }

  const payload = {
    menu_location: item.menuLocation,
    label: item.label.trim(),
    url: item.url.trim(),
    sort_order: Number(item.sortOrder || 0),
    is_external: Boolean(item.isExternal),
    open_in_new_tab: Boolean(item.openInNewTab),
    is_active: Boolean(item.isActive),
    updated_at: new Date().toISOString(),
  };

  let query;
  if (item.id && !item.id.startsWith('local-') && !item.id.startsWith('h-') && !item.id.startsWith('f-') && !item.id.startsWith('p-')) {
    query = supabase
      .from('site_navigation_items')
      .update(payload)
      .eq('id', item.id)
      .select()
      .single();
  } else {
    query = supabase
      .from('site_navigation_items')
      .insert(payload)
      .select()
      .single();
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lưu mục menu thất bại: ${error.message}`);
  return mapNavRow(data as DatabaseRow);
};

export const deleteNavigationItem = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const saved = localStorage.getItem(LOCAL_NAV_STORAGE_KEY);
      const list: SiteNavigationItem[] = saved ? JSON.parse(saved) : defaultNavigationItems;
      const nextList = list.filter((i) => i.id !== id);
      localStorage.setItem(LOCAL_NAV_STORAGE_KEY, JSON.stringify(nextList));
    } catch {}
    return;
  }

  const { error } = await supabase.from('site_navigation_items').delete().eq('id', id);
  if (error) throw new Error(`Xóa mục menu thất bại: ${error.message}`);
};
