import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Loader2, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadPublishedArticles } from '../lib/articleApi';
import { Article } from '../types';

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(value))
  : '';

export const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadPublishedArticles()
      .then((data) => {
        if (active) setArticles(data);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải bài viết.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
      <nav className="mb-7 text-sm text-[#6B7280]">
        <Link to="/" className="hover:text-[#0E7A32]">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-[#111827]">Tin tức</span>
      </nav>

      <header className="mb-9 rounded-[24px] bg-gradient-to-br from-[#064E3B] to-[#0E7A32] px-6 py-10 text-white md:px-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/15">
          <Newspaper className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">Tin tức FreshMart</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 md:text-base">Cập nhật chương trình ưu đãi, mẹo chọn thực phẩm và những gợi ý sống khỏe mỗi ngày.</p>
      </header>

      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center text-[#6B7280]"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải bài viết...</div>
      ) : error ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-5 py-8 text-center text-red-700">{error}</div>
      ) : articles.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#D1D5DB] bg-white px-5 py-16 text-center">
          <Newspaper className="mx-auto h-10 w-10 text-[#9CA3AF]" />
          <h2 className="mt-4 text-lg font-bold text-[#111827]">Chưa có bài viết được đăng</h2>
          <p className="mt-2 text-sm text-[#6B7280]">Các bài viết mới từ FreshMart sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="group overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <Link to={`/news/${article.slug}`} className="block">
                <div className="h-52 overflow-hidden bg-gray-100">
                  {article.coverType === 'video'
                    ? <video src={article.coverUrl} muted preload="metadata" className="h-full w-full object-cover" />
                    : <img src={article.coverUrl} alt={article.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-[#0E7A32]">{article.category}</span>
                    <span className="flex items-center gap-1 text-[#9CA3AF]"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(article.publishedAt)}</span>
                  </div>
                  <h2 className="text-lg font-bold leading-7 text-[#111827] group-hover:text-[#0E7A32]">{article.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6B7280]">{article.excerpt}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-bold text-[#0E7A32]">Đọc bài viết <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
