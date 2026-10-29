import { MediaAsset } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

export const SITE_MEDIA_BUCKET = 'site-media';
export const MAX_MEDIA_FILE_SIZE = 6 * 1024 * 1024; // 6MB

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const LOCAL_MEDIA_STORAGE_KEY = 'daichi_cms_local_media_assets_v1';

type DatabaseRow = Record<string, unknown>;

export const mapMediaAssetRow = (row: DatabaseRow): MediaAsset => ({
  id: String(row.id),
  bucketId: String(row.bucket_id || SITE_MEDIA_BUCKET),
  objectPath: String(row.object_path || ''),
  publicUrl: String(row.public_url || ''),
  fileName: String(row.file_name || ''),
  mimeType: String(row.mime_type || 'image/jpeg'),
  fileSize: Number(row.file_size || 0),
  width: row.width ? Number(row.width) : undefined,
  height: row.height ? Number(row.height) : undefined,
  altText: String(row.alt_text || ''),
  uploadedBy: row.uploaded_by ? String(row.uploaded_by) : undefined,
  archivedAt: row.archived_at ? String(row.archived_at) : undefined,
  createdAt: String(row.created_at || new Date().toISOString()),
});

const ensureAdmin = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  let user = data.user;
  if (user.app_metadata?.role !== 'admin') {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.user) throw new Error('Không thể làm mới phiên quản trị.');
    user = refreshed.user;
  }
  if (user.app_metadata?.role !== 'admin') {
    throw new Error('Chỉ tài khoản Quản trị viên (admin) mới có quyền truy cập Thư viện hình ảnh.');
  }
  return user;
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    if (file.type === 'image/svg+xml') {
      resolve({ width: 800, height: 600 });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

export const dataUrlToFile = (dataUrl: string, fileName = 'upload.png'): File => {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

export const loadMediaAssets = async (options?: {
  includeArchived?: boolean;
  search?: string;
  mimeFilter?: string;
}): Promise<MediaAsset[]> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = localStorage.getItem(LOCAL_MEDIA_STORAGE_KEY);
      let list: MediaAsset[] = local ? JSON.parse(local) : [];
      if (!options?.includeArchived) {
        list = list.filter((item) => !item.archivedAt);
      }
      if (options?.search) {
        const q = options.search.toLowerCase();
        list = list.filter(
          (item) => item.fileName.toLowerCase().includes(q) || item.altText.toLowerCase().includes(q),
        );
      }
      if (options?.mimeFilter && options.mimeFilter !== 'all') {
        list = list.filter((item) => item.mimeType.includes(options.mimeFilter!));
      }
      return list;
    } catch {
      return [];
    }
  }

  let query = supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (!options?.includeArchived) {
    query = query.is('archived_at', null);
  }

  if (options?.search?.trim()) {
    const s = options.search.trim();
    query = query.or(`file_name.ilike.%${s}%,alt_text.ilike.%${s}%`);
  }

  if (options?.mimeFilter && options.mimeFilter !== 'all') {
    query = query.ilike('mime_type', `%${options.mimeFilter}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi tải thư viện ảnh: ${error.message}`);
  return (data || []).map((row) => mapMediaAssetRow(row as DatabaseRow));
};

export const uploadMediaAsset = async (
  file: File,
  options?: {
    folder?: 'branding' | 'banners' | 'products' | 'categories' | 'pages' | 'articles' | 'common';
    altText?: string;
  },
): Promise<MediaAsset> => {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Chỉ hỗ trợ tệp định dạng JPG, PNG, WebP, GIF, SVG hoặc ICO.');
  }
  if (file.size > MAX_MEDIA_FILE_SIZE) {
    throw new Error('Dung lượng tệp vượt quá giới hạn 6 MB.');
  }

  const { width, height } = await getImageDimensions(file);
  const folder = options?.folder || 'common';
  const altText = options?.altText?.trim() || '';

  if (!isSupabaseConfigured || !supabase) {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Không thể đọc file.'));
      reader.readAsDataURL(file);
    });

    const localAsset: MediaAsset = {
      id: `local-media-${crypto.randomUUID()}`,
      bucketId: SITE_MEDIA_BUCKET,
      objectPath: `${folder}/${file.name}`,
      publicUrl: dataUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      width: width || 800,
      height: height || 600,
      altText,
      createdAt: new Date().toISOString(),
    };

    try {
      const current = localStorage.getItem(LOCAL_MEDIA_STORAGE_KEY);
      const list: MediaAsset[] = current ? JSON.parse(current) : [];
      list.unshift(localAsset);
      localStorage.setItem(LOCAL_MEDIA_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    return localAsset;
  }

  const user = await ensureAdmin();
  if (!user) throw new Error('Không có quyền quản trị.');

  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const uniqueId = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const objectPath = `${folder}/${uniqueId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SITE_MEDIA_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Tải tệp lên bộ nhớ thất bại: ${uploadError.message}`);
  }

  const { data: publicData } = supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(objectPath);
  const publicUrl = publicData.publicUrl;

  const { data, error: dbError } = await supabase
    .from('media_assets')
    .insert({
      bucket_id: SITE_MEDIA_BUCKET,
      object_path: objectPath,
      public_url: publicUrl,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      width: width || null,
      height: height || null,
      alt_text: altText,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from(SITE_MEDIA_BUCKET).remove([objectPath]);
    throw new Error(`Lưu thông tin ảnh vào database thất bại: ${dbError.message}`);
  }

  return mapMediaAssetRow(data as DatabaseRow);
};

export const updateMediaAltText = async (id: string, altText: string): Promise<MediaAsset> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = localStorage.getItem(LOCAL_MEDIA_STORAGE_KEY);
      const list: MediaAsset[] = local ? JSON.parse(local) : [];
      const item = list.find((m) => m.id === id);
      if (item) {
        item.altText = altText;
        localStorage.setItem(LOCAL_MEDIA_STORAGE_KEY, JSON.stringify(list));
        return item;
      }
    } catch {}
    throw new Error('Không tìm thấy tệp trong bộ nhớ cục bộ.');
  }

  await ensureAdmin();
  const { data, error } = await supabase
    .from('media_assets')
    .update({ alt_text: altText.trim() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Cập nhật văn bản thay thế thất bại: ${error.message}`);
  return mapMediaAssetRow(data as DatabaseRow);
};

export interface MediaUsageReport {
  isInUse: boolean;
  locations: string[];
}

export const checkMediaUsage = async (asset: MediaAsset): Promise<MediaUsageReport> => {
  const locations: string[] = [];
  const url = asset.publicUrl;
  if (!url) return { isInUse: false, locations };

  if (!isSupabaseConfigured || !supabase) {
    return { isInUse: false, locations: [] };
  }

  try {
    const [profileRes, bannersRes, productsRes, articlesRes, sectionsRes] = await Promise.all([
      supabase.from('site_profiles').select('logo_url, favicon_url').eq('id', 'primary').maybeSingle(),
      supabase.from('banners').select('title, image_url, mobile_image_url, image_gallery'),
      supabase.from('catalog_products').select('name, image, gallery'),
      supabase.from('articles').select('title, cover_url'),
      supabase.from('page_sections').select('page_key, section_key, title, media_asset_id'),
    ]);

    if (profileRes.data) {
      if (profileRes.data.logo_url === url) locations.push('Logo trang web');
      if (profileRes.data.favicon_url === url) locations.push('Favicon trang web');
    }

    if (bannersRes.data) {
      for (const b of bannersRes.data) {
        if (b.image_url === url || b.mobile_image_url === url || (b.image_gallery && b.image_gallery.includes(url))) {
          locations.push(`Banner: ${b.title || 'Chưa đặt tên'}`);
        }
      }
    }

    if (productsRes.data) {
      for (const p of productsRes.data) {
        if (p.image === url || (p.gallery && p.gallery.includes(url))) {
          locations.push(`Sản phẩm: ${p.name}`);
        }
      }
    }

    if (articlesRes.data) {
      for (const a of articlesRes.data) {
        if (a.cover_url === url) {
          locations.push(`Bài viết: ${a.title}`);
        }
      }
    }

    if (sectionsRes.data) {
      for (const s of sectionsRes.data) {
        if (s.media_asset_id === asset.id) {
          locations.push(`Nội dung trang [${s.page_key}]: ${s.title || s.section_key}`);
        }
      }
    }
  } catch (err) {
    console.warn('Lỗi kiểm tra media usage:', err);
  }

  return {
    isInUse: locations.length > 0,
    locations,
  };
};

export const archiveMediaAsset = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = localStorage.getItem(LOCAL_MEDIA_STORAGE_KEY);
      const list: MediaAsset[] = local ? JSON.parse(local) : [];
      const item = list.find((m) => m.id === id);
      if (item) {
        item.archivedAt = new Date().toISOString();
        localStorage.setItem(LOCAL_MEDIA_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {}
    return;
  }

  await ensureAdmin();
  const { error } = await supabase
    .from('media_assets')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Lưu trữ ảnh thất bại: ${error.message}`);
};

export const deleteMediaAssetPermanently = async (asset: MediaAsset): Promise<void> => {
  const usage = await checkMediaUsage(asset);
  if (usage.isInUse) {
    throw new Error(
      `Không thể xóa tệp này vì đang được sử dụng tại: ${usage.locations.join(', ')}. Hãy thay thế ảnh trước khi xóa.`,
    );
  }

  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = localStorage.getItem(LOCAL_MEDIA_STORAGE_KEY);
      const list: MediaAsset[] = local ? JSON.parse(local) : [];
      const nextList = list.filter((m) => m.id !== asset.id);
      localStorage.setItem(LOCAL_MEDIA_STORAGE_KEY, JSON.stringify(nextList));
    } catch {}
    return;
  }

  await ensureAdmin();

  const { error: dbError } = await supabase.from('media_assets').delete().eq('id', asset.id);
  if (dbError) throw new Error(`Xóa bản ghi thất bại: ${dbError.message}`);

  if (asset.objectPath) {
    const { error: storageError } = await supabase.storage.from(asset.bucketId || SITE_MEDIA_BUCKET).remove([asset.objectPath]);
    if (storageError) {
      console.warn('Lỗi xóa file trong storage:', storageError.message);
    }
  }
};
