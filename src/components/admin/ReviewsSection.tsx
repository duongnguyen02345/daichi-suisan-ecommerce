import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Search,
  CheckCircle2,
  EyeOff,
  AlertTriangle,
  Trash2,
  MessageSquare,
  Reply,
  ShieldCheck,
  Loader2,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { ProductReview, ReviewStatus } from '../../types';
import {
  fetchReviews,
  updateReviewStatus,
  replyToReview,
  deleteReview,
  seedInitialReviewsIfEmpty,
} from '../../lib/reviewsApi';

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');

  // Reply modal
  const [replyingReview, setReplyingReview] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await seedInitialReviewsIfEmpty();
      const data = await fetchReviews();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đánh giá.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleStatusChange = async (reviewId: string, status: ReviewStatus) => {
    try {
      await updateReviewStatus(reviewId, status);
      setReviews((current) =>
        current.map((r) => (r.id === reviewId ? { ...r, status } : r))
      );
      setFeedback({ success: true, text: `Đã đổi trạng thái sang "${status}".` });
    } catch (err) {
      setFeedback({ success: false, text: err instanceof Error ? err.message : 'Thao tác thất bại.' });
    }
  };

  const handleDelete = async (review: ProductReview) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đánh giá của khách "${review.customerName}"?`)) return;

    try {
      await deleteReview(review.id);
      setReviews((current) => current.filter((r) => r.id !== review.id));
      setFeedback({ success: true, text: 'Đã xóa đánh giá thành công.' });
    } catch (err) {
      setFeedback({ success: false, text: err instanceof Error ? err.message : 'Xóa thất bại.' });
    }
  };

  const openReplyModal = (review: ProductReview) => {
    setReplyingReview(review);
    setReplyText(review.adminReply || '');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      await replyToReview(replyingReview.id, replyText);
      setReviews((current) =>
        current.map((r) =>
          r.id === replyingReview.id
            ? {
                ...r,
                adminReply: replyText.trim(),
                adminRepliedAt: new Date().toISOString(),
                status: 'approved',
              }
            : r
        )
      );
      setFeedback({ success: true, text: 'Đã lưu và xuất bản câu trả lời của quản trị viên.' });
      setReplyingReview(null);
    } catch (err) {
      setFeedback({ success: false, text: err instanceof Error ? err.message : 'Gửi phản hồi thất bại.' });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (r.productName && r.productName.toLowerCase().includes(search.toLowerCase())) ||
        r.comment.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      return true;
    });
  }, [reviews, search, ratingFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const avgRating = total ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : '5.0';
    return { total, pending, avgRating };
  }, [reviews]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tổng số đánh giá</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E7A32] flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-700 font-bold uppercase tracking-wider">Chờ kiểm duyệt</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Điểm hài lòng TB</div>
            <div className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-1.5">
              <span>{stats.avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
            feedback.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-4 h-4 flex-none" /> : <AlertCircle className="w-4 h-4 flex-none" />}
          <span className="flex-1">{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-4 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all' as const, label: 'Tất cả' },
                { id: 'pending' as const, label: 'Chờ duyệt', badge: stats.pending },
                { id: 'approved' as const, label: 'Đã duyệt' },
                { id: 'hidden' as const, label: 'Đã ẩn' },
                { id: 'spam' as const, label: 'Spam' },
              ] as Array<{ id: ReviewStatus | 'all'; label: string; badge?: number }>
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-[#0E7A32] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="px-1.5 py-0.2 bg-amber-400 text-gray-900 rounded-full text-[10px] font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm khách, món, nội dung..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
              />
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Rating filter pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span className="font-bold">Lọc theo số sao:</span>
          {(['all', 5, 4, 3, 2, 1] as const).map((r) => (
            <button
              key={String(r)}
              onClick={() => setRatingFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1 ${
                ratingFilter === r
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {r === 'all' ? (
                'Tất cả sao'
              ) : (
                <>
                  <span>{r}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0E7A32]" />
            Đang tải danh sách đánh giá từ hệ thống...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">
            {error}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Không tìm thấy đánh giá nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((review) => {
              return (
                <div key={review.id} className="p-5 hover:bg-gray-50/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Customer info & Product */}
                    <div className="flex items-start gap-3 flex-1">
                      {review.productImage ? (
                        <img
                          src={review.productImage}
                          alt={review.productName || 'Ảnh sản phẩm'}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-none"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-none">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{review.customerName}</span>
                          {review.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" />
                              Đã mua hàng
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="text-xs text-[#0E7A32] font-semibold">
                          Sản phẩm: {review.productName}
                        </div>

                        {/* Rating Stars */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                          {review.title && (
                            <span className="text-xs font-bold text-gray-800 ml-2">
                              {review.title}
                            </span>
                          )}
                        </div>

                        {/* Comment Body */}
                        <p className="text-xs text-gray-700 mt-2 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                          {review.comment}
                        </p>

                        {/* Admin Reply */}
                        {review.adminReply ? (
                          <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
                            <div className="flex items-center justify-between text-emerald-900 font-bold mb-1 text-[11px]">
                              <span className="flex items-center gap-1.5">
                                <Reply className="w-3 h-3" />
                                Phản hồi từ Quản trị viên
                              </span>
                              {review.adminRepliedAt && (
                                <span className="text-emerald-700 font-normal">
                                  {new Date(review.adminRepliedAt).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                            <p className="text-emerald-950 leading-relaxed">{review.adminReply}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col sm:items-end gap-2 flex-none">
                      {/* Status badge */}
                      <div>
                        {review.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã hiển thị
                          </span>
                        )}
                        {review.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Chờ duyệt
                          </span>
                        )}
                        {review.status === 'hidden' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">
                            <EyeOff className="w-3 h-3" />
                            Đã ẩn
                          </span>
                        )}
                        {review.status === 'spam' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">
                            Spam
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openReplyModal(review)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 text-xs font-bold flex items-center gap-1 transition"
                          title="Trả lời khách hàng"
                        >
                          <Reply className="w-3 h-3 text-[#0E7A32]" />
                          <span>{review.adminReply ? 'Sửa phản hồi' : 'Trả lời'}</span>
                        </button>

                        {review.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(review.id, 'approved')}
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="Duyệt hiển thị"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {review.status !== 'hidden' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(review.id, 'hidden')}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                            title="Ẩn đánh giá"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {review.status !== 'spam' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(review.id, 'spam')}
                            className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition"
                            title="Đánh dấu Spam"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(review)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Reply */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Reply className="w-4 h-4 text-[#0E7A32]" />
                Phản hồi đánh giá của {replyingReview.customerName}
              </h3>
              <button
                onClick={() => setReplyingReview(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-100">
              <div className="font-bold text-gray-800">{replyingReview.productName}</div>
              <div className="italic mt-1 text-gray-500">"{replyingReview.comment}"</div>
            </div>

            <form onSubmit={handleSendReply} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung phản hồi từ DAICHI SUISAN *
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Dạ cảm ơn quý khách đã tin tưởng và thưởng thức sản phẩm..."
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0E7A32] hover:bg-[#0c6b2b] rounded-xl transition flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Lưu &amp; Xuất bản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
