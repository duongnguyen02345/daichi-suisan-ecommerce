import { MediaAsset, SiteProfile } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

type DatabaseRow = Record<string, unknown>;

const LOCAL_SITE_PROFILE_KEY = 'daichi_site_profile_v1';
const SITE_MEDIA_BUCKET = 'site-media';
const MAX_SITE_MEDIA_SIZE = 6 * 1024 * 1024;
const ALLOWED_SITE_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

export const defaultSiteProfile: SiteProfile = {
  id: 'primary',
  brandName: 'DAICHI SUISAN',
  legalName: 'Công ty TNHH Thương mại và Dịch vụ DAICHI SUISAN',
  tagline: 'Tinh hoa thực phẩm Nhật',
  companyDescription: 'Mang tinh hoa thực phẩm Nhật Bản đến gần hơn với mọi gia đình.',
  taxCode: '0111155633',
  hotline: '0398 018 639',
  supportLabel: 'Hỗ trợ theo giờ làm việc',
  email: '',
  address: '446 Đội Cấn, Ba Đình, Hà Nội',
  businessHours: 'Theo giờ làm việc do quản trị viên cấu hình',
  logoUrl: '',
  faviconUrl: '',
  copyrightText: 'DAICHI SUISAN TRADING AND SERVICES COMPANY LIMITED. Tất cả quyền được bảo lưu.',
  isPublished: true,
};

const mapSiteProfile = (row: DatabaseRow): SiteProfile => ({
  id: 'primary',
  brandName: String(row.brand_name || defaultSiteProfile.brandName),
  legalName: String(row.legal_name || defaultSiteProfile.legalName),
  tagline: String(row.tagline || ''),
  companyDescription: String(row.company_description || ''),
  taxCode: String(row.tax_code || ''),
  hotline: String(row.hotline || ''),
  supportLabel: String(row.support_label || ''),
  email: String(row.email || ''),
  address: String(row.address || ''),
  businessHours: String(row.business_hours || ''),
  logoUrl: String(row.logo_url || ''),
  faviconUrl: String(row.favicon_url || ''),
  copyrightText: String(row.copyright_text || ''),
  isPublished: Boolean(row.is_published),
  createdAt: row.created_at ? String(row.created_at) : undefined,
  updatedAt: row.updated_at ? String(row.updated_at) : undefined,
});

const profileToRow = (profile: SiteProfile, updatedBy: string) => ({
  id: 'primary',
  brand_name: profile.brandName.trim(),
  legal_name: profile.legalName.trim(),
  tagline: profile.tagline.trim(),
  company_description: profile.companyDescription.trim(),
  tax_code: profile.taxCode.trim(),
  hotline: profile.hotline.trim(),
  support_label: profile.supportLabel.trim(),
  email: profile.email.trim(),
  address: profile.address.trim(),
  business_hours: profile.businessHours.trim(),
  logo_url: profile.logoUrl.trim(),
  favicon_url: profile.faviconUrl.trim(),
  copyright_text: profile.copyrightText.trim(),
  is_published: profile.isPublished,
  updated_by: updatedBy,
});

const readLocalProfile = (): SiteProfile => {
  try {
    const value = localStorage.getItem(LOCAL_SITE_PROFILE_KEY);
    return value ? { ...defaultSiteProfile, ...JSON.parse(value), id: 'primary' } : defaultSiteProfile;
  } catch {
    return defaultSiteProfile;
  }
};

const ensureAdminSession = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

  let user = data.user;
  if (user.app_metadata?.role !== 'admin') {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.user) throw new Error('Không thể làm mới quyền quản trị.');
    user = refreshed.user;
  }
  if (user.app_metadata?.role !== 'admin') throw new Error('Tài khoản không có quyền quản trị website.');
  return user;
};

export const loadSiteProfile = async (): Promise<SiteProfile> => {
  if (!isSupabaseConfigured || !supabase) return readLocalProfile();

  const { data, error } = await supabase
    .from('site_profiles')
    .select('*')
    .eq('id', 'primary')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? mapSiteProfile(data as DatabaseRow) : defaultSiteProfile;
};

export const saveSiteProfile = async (profile: SiteProfile): Promise<SiteProfile> => {
  if (!isSupabaseConfigured || !supabase) {
    const localProfile = { ...profile, id: 'primary' as const, updatedAt: new Date().toISOString() };
    localStorage.setItem(LOCAL_SITE_PROFILE_KEY, JSON.stringify(localProfile));
    return localProfile;
  }

  const user = await ensureAdminSession();
  if (!user) throw new Error('Không tìm thấy phiên quản trị.');

  const { data, error } = await supabase
    .from('site_profiles')
    .upsert(profileToRow(profile, user.id), { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSiteProfile(data as DatabaseRow);
};

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
  reader.readAsDataURL(file);
});

export const uploadSiteMedia = async (
  file: File,
  folder: 'branding' | 'pages' = 'branding',
  altText = '',
): Promise<{ asset?: MediaAsset; url: string }> => {
  if (!ALLOWED_SITE_MEDIA_TYPES.has(file.type)) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, PNG, WebP, GIF, SVG hoặc ICO.');
  }
  if (file.size > MAX_SITE_MEDIA_SIZE) throw new Error('Ảnh không được vượt quá 6 MB.');

  if (!isSupabaseConfigured || !supabase) {
    return { url: await fileToDataUrl(file) };
  }

  const user = await ensureAdminSession();
  if (!user) throw new Error('Không tìm thấy phiên quản trị.');

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const objectPath = `${folder}/${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(SITE_MEDIA_BUCKET).upload(objectPath, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: publicData } = supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(objectPath);
  const { data, error: metadataError } = await supabase
    .from('media_assets')
    .insert({
      bucket_id: SITE_MEDIA_BUCKET,
      object_path: objectPath,
      public_url: publicData.publicUrl,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      alt_text: altText.trim(),
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (metadataError) {
    await supabase.storage.from(SITE_MEDIA_BUCKET).remove([objectPath]);
    throw new Error(metadataError.message);
  }

  const row = data as DatabaseRow;
  return {
    url: publicData.publicUrl,
    asset: {
      id: String(row.id),
      bucketId: String(row.bucket_id),
      objectPath: String(row.object_path),
      publicUrl: String(row.public_url),
      fileName: String(row.file_name),
      mimeType: String(row.mime_type),
      fileSize: Number(row.file_size),
      width: row.width ? Number(row.width) : undefined,
      height: row.height ? Number(row.height) : undefined,
      altText: String(row.alt_text || ''),
      uploadedBy: row.uploaded_by ? String(row.uploaded_by) : undefined,
      archivedAt: row.archived_at ? String(row.archived_at) : undefined,
      createdAt: String(row.created_at),
    },
  };
};
