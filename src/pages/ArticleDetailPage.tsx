import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { loadPublishedArticle } from '../lib/articleApi';
import { Article } from '../types';

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(value))
  : '';

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('_') && part.endsWith('_')) return <em key={index}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="font-semibold text-[#0E7A32] underline">{link[1]}</a>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const ArticleContent: React.FC<{ content: string }> = ({ content }) => (
  <div className="space-y-4 text-[16px] leading-8 text-[#374151]">
    {content.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-2" />;
      if (trimmed.startsWith('> ')) return <blockquote key={index} className="border-l-4 border-[#0E7A32] bg-emerald-50 px-5 py-3 italic">{renderInline(trimmed.slice(2))}</blockquote>;
      if (trimmed.startsWith('- ')) return <div key={index} className="flex gap-3 pl-2"><span className="font-bold text-[#0E7A32]">•</span><p>{renderInline(trimmed.slice(2))}</p></div>;
      return <p key={index}>{renderInline(trimmed)}</p>;
    })}
  </div>
);

export const ArticleDetailPage: React.FC = () => {
  const { slug = '' } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    loadPublishedArticle(slug)
      .then((data) => { if (active) setArticle(data); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải bài viết.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (isLoading) return <div className="flex min-h-[420px] items-center justify-center text-[#6B7280]"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải bài viết...</div>;

  if (!article || error) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-[#111827]">Không tìm thấy bài viết</h1>
      <p className="mt-3 text-[#6B7280]">Bài viết có thể chưa được đăng hoặc đã được lưu trữ.</p>
      <Link to="/news" className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-[#0E7A32] px-5 py-3 font-semibold text-white"><ArrowLeft className="h-4 w-4" /> Quay lại Tin tức</Link>
    </div>
  );

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <Link to="/news" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#0E7A32] hover:underline"><ArrowLeft className="h-4 w-4" /> Tất cả tin tức</Link>
      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-[#0E7A32]">{article.category}</span>
          <span className="flex items-center gap-1.5 text-[#6B7280]"><CalendarDays className="h-4 w-4" /> {formatDate(article.publishedAt)}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-[#111827] md:text-5xl">{article.title}</h1>
        {article.excerpt && <p className="mt-5 text-lg leading-8 text-[#6B7280]">{article.excerpt}</p>}
      </header>
      <div className="mb-9 overflow-hidden rounded-[22px] bg-gray-100">
        {article.coverType === 'video'
          ? <video src={article.coverUrl} controls className="max-h-[560px] w-full bg-black object-contain" />
          : <img src={article.coverUrl} alt={article.title} className="max-h-[560px] w-full object-cover" />}
      </div>
      <ArticleContent content={article.content} />
    </article>
  );
};
