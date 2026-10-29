import { Article } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

type ArticleRow = Record<string, unknown>;

const ARTICLE_FIELDS = 'id,title,slug,excerpt,content,cover_url,cover_type,category,publication_status,published_at,author_id,created_at,updated_at';

const mapArticle = (row: ArticleRow): Article => ({
  id: String(row.id),
  title: String(row.title || ''),
  slug: String(row.slug || ''),
  excerpt: String(row.excerpt || ''),
  content: String(row.content || ''),
  coverUrl: String(row.cover_url || ''),
  coverType: row.cover_type === 'video' ? 'video' : 'image',
  category: String(row.category || 'Tin tức'),
  publicationStatus: row.publication_status === 'published'
    ? 'published'
    : row.publication_status === 'archived' ? 'archived' : 'draft',
  publishedAt: row.published_at ? String(row.published_at) : undefined,
  authorId: row.author_id ? String(row.author_id) : undefined,
  createdAt: String(row.created_at || new Date().toISOString()),
  updatedAt: String(row.updated_at || new Date().toISOString()),
});

const ensureAdminSession = async () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

  let session = data.session;
  if (session.user.app_metadata?.role !== 'admin') {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) {
      throw new Error('Không thể làm mới quyền quản trị. Vui lòng đăng nhập lại.');
    }
    session = refreshed.data.session;
  }
  if (session.user.app_metadata?.role !== 'admin') {
    throw new Error('Tài khoản hiện tại chưa có quyền quản trị trong phiên đăng nhập.');
  }
  return session.user;
};

const toWriteRow = (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>) => ({
  title: article.title.trim(),
  slug: article.slug,
  excerpt: article.excerpt.trim(),
  content: article.content.trim(),
  cover_url: article.coverUrl,
  cover_type: article.coverType,
  category: article.category,
  publication_status: article.publicationStatus,
  published_at: article.publicationStatus === 'published'
    ? article.publishedAt || new Date().toISOString()
    : null,
});

export const loadPublishedArticles = async (): Promise<Article[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_FIELDS)
    .eq('publication_status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapArticle(row as ArticleRow));
};

export const loadPublishedArticle = async (slug: string): Promise<Article | null> => {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_FIELDS)
    .eq('slug', slug)
    .eq('publication_status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data ? mapArticle(data as ArticleRow) : null;
};

export const loadAdminArticles = async (): Promise<Article[]> => {
  await ensureAdminSession();
  const { data, error } = await supabase!
    .from('articles')
    .select(ARTICLE_FIELDS)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapArticle(row as ArticleRow));
};

export const uploadArticleMedia = async (file: File): Promise<{ url: string; type: 'image' | 'video' }> => {
  const user = await ensureAdminSession();
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) throw new Error('Chỉ hỗ trợ ảnh hoặc video đại diện.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Tệp đại diện không được vượt quá 25 MB.');

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || (isVideo ? 'mp4' : 'jpg');
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase!.storage.from('article-media').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase!.storage.from('article-media').getPublicUrl(path);
  return { url: data.publicUrl, type: isVideo ? 'video' : 'image' };
};

export const createArticle = async (
  article: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>,
): Promise<Article> => {
  const user = await ensureAdminSession();
  const { data, error } = await supabase!
    .from('articles')
    .insert({ ...toWriteRow(article), author_id: user.id })
    .select(ARTICLE_FIELDS)
    .single();
  if (error) throw error;
  return mapArticle(data as ArticleRow);
};

export const updateArticle = async (
  id: string,
  article: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>,
): Promise<Article> => {
  await ensureAdminSession();
  const { data, error } = await supabase!
    .from('articles')
    .update(toWriteRow(article))
    .eq('id', id)
    .select(ARTICLE_FIELDS)
    .single();
  if (error) throw error;
  return mapArticle(data as ArticleRow);
};

export const archiveArticle = async (id: string): Promise<void> => {
  await ensureAdminSession();
  const { error } = await supabase!
    .from('articles')
    .update({ publication_status: 'archived', published_at: null })
    .eq('id', id);
  if (error) throw error;
};
