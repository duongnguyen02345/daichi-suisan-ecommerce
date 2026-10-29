import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Bold,
  CalendarDays,
  Eye,
  FilePenLine,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  Loader2,
  Pencil,
  Plus,
  Quote,
  Save,
  Search,
  UploadCloud,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Article } from '../../types';
import {
  archiveArticle,
  createArticle,
  loadAdminArticles,
  updateArticle,
  uploadArticleMedia,
} from '../../lib/articleApi';

type EditorDraft = Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>;

const emptyDraft = (): EditorDraft => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverUrl: '',
  coverType: 'image',
  category: 'Tin tức',
  publicationStatus: 'draft',
});

const slugify = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Chưa đăng';

export const ArticlesSection: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [viewMode, setViewMode] = useState<'manager' | 'editor'>('manager');
  const [draft, setDraft] = useState<EditorDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Article['publicationStatus']>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const localPreviewUrl = useMemo(
    () => mediaFile ? URL.createObjectURL(mediaFile) : '',
    [mediaFile],
  );

  useEffect(() => () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      setArticles(await loadAdminArticles());
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể tải bài viết.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const resetEditor = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const editArticle = (article: Article) => {
    setMessage(null);
    setEditingId(article.id);
    setMediaFile(null);
    setDraft({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      coverUrl: article.coverUrl,
      coverType: article.coverType,
      category: article.category,
      publicationStatus: article.publicationStatus === 'archived' ? 'draft' : article.publicationStatus,
      publishedAt: article.publishedAt,
    });
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openNewArticle = () => {
    resetEditor();
    setMessage(null);
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showManager = () => {
    resetEditor();
    setViewMode('manager');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const insertFormatting = (before: string, after = before, fallback = 'nội dung') => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = draft.content.slice(start, end) || fallback;
    const content = `${draft.content.slice(0, start)}${before}${selected}${after}${draft.content.slice(end)}`;
    setDraft((current) => ({ ...current, content }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const handleMedia = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn tệp ảnh hoặc video.' });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Tệp đại diện không được vượt quá 25 MB.' });
      return;
    }
    setMediaFile(file);
    setDraft((current) => ({
      ...current,
      coverType: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setMessage(null);
  };

  const saveArticle = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedSlug = slugify(draft.slug || draft.title);
    if (!draft.title.trim() || !normalizedSlug || !draft.content.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.' });
      return;
    }
    if (!mediaFile && !draft.coverUrl) {
      setMessage({ type: 'error', text: 'Vui lòng tải ảnh hoặc video đại diện.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      let coverUrl = draft.coverUrl;
      let coverType = draft.coverType;
      if (mediaFile) {
        const upload = await uploadArticleMedia(mediaFile);
        coverUrl = upload.url;
        coverType = upload.type;
      }

      const payload: EditorDraft = {
        ...draft,
        title: draft.title.trim(),
        slug: normalizedSlug,
        excerpt: draft.excerpt.trim() || draft.content.trim().slice(0, 180),
        coverUrl,
        coverType,
      };
      const saved = editingId
        ? await updateArticle(editingId, payload)
        : await createArticle(payload);
      setArticles((current) => editingId
        ? current.map((article) => article.id === saved.id ? saved : article)
        : [saved, ...current]);
      setMessage({ type: 'success', text: editingId ? 'Đã cập nhật bài viết.' : 'Đã tạo bài viết mới.' });
      resetEditor();
      setViewMode('manager');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Không thể lưu bài viết.';
      setMessage({
        type: 'error',
        text: text.toLowerCase().includes('duplicate') || text.includes('23505')
          ? 'Đường dẫn bài viết đã tồn tại. Vui lòng đổi tiêu đề hoặc đường dẫn.'
          : text,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (article: Article) => {
    if (!window.confirm(`Lưu trữ bài “${article.title}”?`)) return;
    try {
      await archiveArticle(article.id);
      setArticles((current) => current.map((item) => item.id === article.id
        ? { ...item, publicationStatus: 'archived', publishedAt: undefined }
        : item));
      if (editingId === article.id) resetEditor();
      setMessage({ type: 'success', text: 'Đã chuyển bài viết vào lưu trữ.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể lưu trữ bài viết.' });
    }
  };

  const previewUrl = localPreviewUrl || draft.coverUrl;
  const filteredArticles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('vi');
    return articles.filter((article) => {
      const matchesSearch = !normalizedSearch
        || article.title.toLocaleLowerCase('vi').includes(normalizedSearch)
        || article.category.toLocaleLowerCase('vi').includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || article.publicationStatus === statusFilter;
      const articleDate = (article.publishedAt || article.updatedAt).slice(0, 10);
      const matchesDate = !dateFilter || articleDate === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [articles, dateFilter, searchTerm, statusFilter]);
  const formatButtons = [
    { label: 'In đậm', icon: Bold, action: () => insertFormatting('**') },
    { label: 'In nghiêng', icon: Italic, action: () => insertFormatting('_') },
    { label: 'Danh sách', icon: List, action: () => insertFormatting('\n- ', '', 'mục') },
    { label: 'Trích dẫn', icon: Quote, action: () => insertFormatting('\n> ', '', 'trích dẫn') },
    { label: 'Liên kết', icon: LinkIcon, action: () => insertFormatting('[', '](https://)', 'văn bản') },
  ];

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-[14px] border px-4 py-3 text-sm font-medium ${message.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-700'}`}
        >
          {message.text}
        </div>
      )}

      {viewMode === 'editor' ? (
      <form onSubmit={saveArticle} className="rounded-[20px] border border-[#E5E7EB] bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={showManager}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E7A32] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Quay lại quản lý bài viết
            </button>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#111827]">
              <FilePenLine className="h-5 w-5 text-[#0E7A32]" />
              {editingId ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">Bài đã đăng sẽ xuất hiện tại mục Tin tức trên website.</p>
          </div>
          <button type="button" onClick={openNewArticle} className="rounded-[10px] border border-[#D1D5DB] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-gray-50">
            <Plus className="mr-1 inline h-4 w-4" /> Soạn bài mới
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">Ảnh/Video đại diện <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleMedia(event.dataTransfer.files[0]);
                }}
                className="relative flex min-h-[260px] w-full items-center justify-center overflow-hidden rounded-[16px] border-2 border-dashed border-blue-300 bg-blue-50/60 text-center transition hover:border-blue-500 hover:bg-blue-50"
              >
                {previewUrl ? (
                  draft.coverType === 'video'
                    ? <video src={previewUrl} className="h-[300px] w-full object-cover" controls />
                    : <img src={previewUrl} alt="Xem trước ảnh đại diện" className="h-[300px] w-full object-cover" />
                ) : (
                  <div className="px-6 py-12">
                    <ImagePlus className="mx-auto h-11 w-11 text-blue-600" />
                    <p className="mt-4 text-base text-[#6B7280]">Kéo thả hoặc <span className="font-bold text-blue-600">tải ảnh/video</span> đại diện</p>
                    <p className="mt-2 text-xs text-[#9CA3AF]">JPG, PNG, WEBP, GIF, MP4, WEBM · tối đa 25 MB</p>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                className="hidden"
                onChange={(event) => handleMedia(event.target.files?.[0])}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="article-title" className="text-sm font-semibold text-[#111827]">Tiêu đề <span className="text-red-500">*</span></label>
                <span className="text-xs text-[#9CA3AF]">{draft.title.length}/150</span>
              </div>
              <input
                id="article-title"
                value={draft.title}
                maxLength={150}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                  slug: editingId ? current.slug : slugify(event.target.value),
                }))}
                placeholder="Nhập tiêu đề bài viết"
                className="h-12 w-full rounded-[12px] border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0E7A32] focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label htmlFor="article-excerpt" className="mb-2 block text-sm font-semibold text-[#111827]">Mô tả ngắn</label>
              <textarea
                id="article-excerpt"
                value={draft.excerpt}
                maxLength={300}
                rows={3}
                onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))}
                placeholder="Nội dung tóm tắt hiển thị tại danh sách tin tức"
                className="w-full resize-none rounded-[12px] border border-[#D1D5DB] px-4 py-3 text-sm outline-none focus:border-[#0E7A32] focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label htmlFor="article-content" className="mb-2 block text-sm font-semibold text-[#111827]">Nội dung <span className="text-red-500">*</span></label>
              <div className="overflow-hidden rounded-[14px] border border-[#D1D5DB] focus-within:border-[#0E7A32] focus-within:ring-2 focus-within:ring-emerald-100">
                <div className="flex items-center gap-1 border-b border-[#E5E7EB] bg-gray-50 px-3 py-2">
                  {formatButtons.map(({ label, icon: Icon, action }) => (
                    <button key={label} type="button" onClick={action} title={label} className="rounded-[8px] p-2 text-[#4B5563] hover:bg-white hover:text-[#0E7A32]">
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <textarea
                  ref={contentRef}
                  id="article-content"
                  value={draft.content}
                  onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                  placeholder="Nhập nội dung bài viết..."
                  rows={12}
                  className="w-full resize-y px-4 py-3 text-sm leading-7 outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-[#9CA3AF]">Thanh công cụ chèn cú pháp định dạng an toàn; nội dung không thực thi mã HTML.</p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[16px] border border-[#E5E7EB] bg-[#F8F9F5] p-4">
              <h3 className="mb-4 font-bold text-[#111827]">Thiết lập xuất bản</h3>
              <label htmlFor="article-category" className="mb-1.5 block text-xs font-semibold text-[#4B5563]">Chuyên mục</label>
              <select
                id="article-category"
                value={draft.category}
                onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                className="mb-4 h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#0E7A32]"
              >
                <option>Tin tức</option>
                <option>Khuyến mãi</option>
                <option>Mẹo hay</option>
                <option>Công thức</option>
                <option>Sống khỏe</option>
              </select>

              <label htmlFor="article-slug" className="mb-1.5 block text-xs font-semibold text-[#4B5563]">Đường dẫn</label>
              <div className="mb-4 flex h-11 items-center rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm">
                <span className="text-[#9CA3AF]">/news/</span>
                <input
                  id="article-slug"
                  value={draft.slug}
                  onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))}
                  className="min-w-0 flex-1 outline-none"
                  placeholder="duong-dan-bai-viet"
                />
              </div>

              <label className="mb-2 block text-xs font-semibold text-[#4B5563]">Trạng thái</label>
              <div className="grid grid-cols-2 gap-2">
                {(['draft', 'published'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, publicationStatus: status }))}
                    className={`rounded-[10px] border px-3 py-2.5 text-sm font-semibold ${draft.publicationStatus === status
                      ? 'border-[#0E7A32] bg-emerald-50 text-[#0E7A32]'
                      : 'border-[#D1D5DB] bg-white text-[#6B7280]'}`}
                  >
                    {status === 'draft' ? 'Bản nháp' : 'Đăng ngay'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0E7A32] font-bold text-white transition hover:bg-[#0A5C25] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {isSaving ? 'Đang lưu...' : draft.publicationStatus === 'published' ? 'Lưu và đăng bài' : 'Lưu bản nháp'}
            </button>

            <div className="rounded-[16px] border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
              <UploadCloud className="mb-2 h-5 w-5" />
              Media được lưu trên Supabase Storage. Chỉ tài khoản quản trị mới có quyền tải lên hoặc thay đổi.
            </div>
          </aside>
        </div>
      </form>
      ) : (
      <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Quản lý bài viết</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Theo dõi, chỉnh sửa và quản lý trạng thái các bài đã tạo.</p>
          </div>
          <button
            type="button"
            onClick={openNewArticle}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-[#0E7A32] px-5 text-sm font-bold text-white transition hover:bg-[#0A5C25]"
          >
            <Plus className="h-4 w-4" /> Đăng bài mới
          </button>
        </div>

        <div className="mb-5 grid gap-3 border-y border-[#E5E7EB] py-5 md:grid-cols-[minmax(240px,1fr)_220px_200px_auto]">
          <label className="relative block">
            <span className="sr-only">Tìm kiếm bài viết</span>
            <Search className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-[#9CA3AF]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm kiếm bài viết"
              className="h-11 w-full rounded-[10px] border border-[#D1D5DB] pl-11 pr-3 text-sm outline-none focus:border-[#0E7A32] focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label>
            <span className="sr-only">Lọc theo trạng thái</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#0E7A32]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đã đăng</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Lọc theo ngày</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#0E7A32]"
            />
          </label>
          <button type="button" onClick={() => void refresh()} className="h-11 px-3 text-sm font-semibold text-[#0E7A32] hover:underline">Làm mới dữ liệu</button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[#4B5563]">Tổng: {articles.length}</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">Đã đăng: {articles.filter((item) => item.publicationStatus === 'published').length}</span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">Bản nháp: {articles.filter((item) => item.publicationStatus === 'draft').length}</span>
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-600">Lưu trữ: {articles.filter((item) => item.publicationStatus === 'archived').length}</span>
        </div>

        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center text-[#6B7280]"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...</div>
        ) : articles.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#D1D5DB] py-12 text-center text-sm text-[#6B7280]">
            Chưa có bài viết. Bấm “Đăng bài mới” để bắt đầu.
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#D1D5DB] py-12 text-center text-sm text-[#6B7280]">Không tìm thấy bài viết phù hợp với bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-[#E5E7EB]">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className="bg-[#F8F9F5] text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3.5">Ngày cập nhật</th>
                  <th className="px-4 py-3.5">Bài viết</th>
                  <th className="px-4 py-3.5">Chuyên mục</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="bg-white transition hover:bg-emerald-50/30">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#6B7280]">{formatDate(article.publishedAt || article.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[300px] items-center gap-3">
                        <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-[8px] bg-gray-100">
                          {article.coverType === 'video'
                            ? <div className="flex h-full items-center justify-center text-[#0E7A32]"><Video className="h-6 w-6" /></div>
                            : <img src={article.coverUrl} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-semibold text-[#111827]">{article.title}</p>
                          <p className="mt-1 truncate text-xs text-[#9CA3AF]">/news/{article.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#4B5563]">{article.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${article.publicationStatus === 'published'
                        ? 'bg-emerald-100 text-emerald-700'
                        : article.publicationStatus === 'archived' ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {article.publicationStatus === 'published' ? 'Đã đăng' : article.publicationStatus === 'archived' ? 'Lưu trữ' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {article.publicationStatus === 'published' && (
                          <Link to={`/news/${article.slug}`} target="_blank" title="Xem bài" className="rounded-[9px] border border-[#D1D5DB] p-2 text-[#4B5563] hover:text-[#0E7A32]"><Eye className="h-4 w-4" /></Link>
                        )}
                        <button type="button" onClick={() => editArticle(article)} title="Chỉnh sửa" className="rounded-[9px] border border-[#D1D5DB] p-2 text-[#4B5563] hover:text-[#0E7A32]"><Pencil className="h-4 w-4" /></button>
                        {article.publicationStatus !== 'archived' && (
                          <button type="button" onClick={() => void handleArchive(article)} title="Lưu trữ" className="rounded-[9px] border border-[#D1D5DB] p-2 text-[#4B5563] hover:border-red-200 hover:text-red-600"><Archive className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}
    </div>
  );
};
