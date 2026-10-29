import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Calendar,
  Percent,
  Coins,
  Truck,
  PauseCircle,
  PlayCircle,
  Archive,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Clock,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Promotion } from '../../types';
import { formatPrice } from '../../lib/utils';

export const PromotionsSection: React.FC = () => {
  const { promotions, addPromotion, updatePromotion, pausePromotion, resumePromotion, archivePromotion } = useAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'paused' | 'expired' | 'archived'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<Promotion['discountType']>('fixed');
  const [discountAmount, setDiscountAmount] = useState<number>(30000);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(300000);
  const [maxDiscount, setMaxDiscount] = useState<number>(100000);
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [stackable, setStackable] = useState(false);

  const openCreateModal = () => {
    setEditingPromo(null);
    setTitle('');
    setCode('');
    setDescription('');
    setDiscountType('fixed');
    setDiscountAmount(30000);
    setDiscountPercent(10);
    setMinOrder(300000);
    setMaxDiscount(100000);
    setUsageLimit('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setStackable(false);
    setIsModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setTitle(promo.title);
    setCode(promo.code);
    setDescription(promo.description || '');
    setDiscountType(promo.discountType || 'fixed');
    setDiscountAmount(promo.discountAmount || 30000);
    setDiscountPercent(promo.discountPercent || 10);
    setMinOrder(promo.minOrder || 0);
    setMaxDiscount(promo.maxDiscount || 0);
    setUsageLimit(promo.usageLimit !== undefined && promo.usageLimit !== null ? promo.usageLimit : '');
    setStartDate(promo.startDate);
    setEndDate(promo.endDate);
    setStackable(Boolean(promo.stackable));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      setFeedback({ success: false, text: 'Vui lòng nhập mã và tên chương trình.' });
      return;
    }

    if (endDate < startDate) {
      setFeedback({ success: false, text: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload: Omit<Promotion, 'id'> = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || undefined,
      discountType,
      discountAmount: discountType === 'fixed' ? Number(discountAmount) : undefined,
      discountPercent: discountType === 'percentage' ? Number(discountPercent) : undefined,
      minOrder: Number(minOrder) || 0,
      maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit: usageLimit !== '' ? Number(usageLimit) : undefined,
      startDate,
      endDate,
      stackable,
      status: editingPromo ? editingPromo.status : 'active',
    };

    let result;
    if (editingPromo) {
      result = await updatePromotion(editingPromo.code, payload);
    } else {
      result = await addPromotion(payload);
    }

    setIsSubmitting(false);
    if (result.success) {
      setFeedback({ success: true, text: result.message });
      setIsModalOpen(false);
    } else {
      setFeedback({ success: false, text: result.message });
    }
  };

  const handleToggleStatus = async (promo: Promotion) => {
    if (promo.status === 'paused') {
      const res = await resumePromotion(promo.code);
      setFeedback({ success: res.success, text: res.message });
    } else {
      const res = await pausePromotion(promo.code);
      setFeedback({ success: res.success, text: res.message });
    }
  };

  const handleArchive = async (promo: Promotion) => {
    if (window.confirm(`Bạn có chắc chắn muốn lưu trữ chương trình khuyến mại "${promo.code}"?`)) {
      const res = await archivePromotion(promo.code);
      setFeedback({ success: res.success, text: res.message });
    }
  };

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      const matchesSearch =
        promo.code.toLowerCase().includes(search.toLowerCase()) ||
        promo.title.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') {
        return promo.status !== 'archived';
      }
      return promo.status === statusFilter;
    });
  }, [promotions, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#0E7A32]" />
            Quản lý mã ưu đãi &amp; Khuyến mại
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập mã giảm giá cố định, phần trăm, hoặc miễn phí vận chuyển cho khách mua sắm.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="h-10 px-4 bg-[#0E7A32] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#0c6b2b] transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mã ưu đãi mới</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
            feedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-4 h-4 flex-none" /> : <AlertCircle className="w-4 h-4 flex-none" />}
          <span className="flex-1">{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'Tất cả đang có' },
              { id: 'active', label: 'Đang diễn ra' },
              { id: 'scheduled', label: 'Sắp diễn ra' },
              { id: 'paused', label: 'Tạm dừng' },
              { id: 'expired', label: 'Hết hạn' },
              { id: 'archived', label: 'Lưu trữ' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-[#0E7A32] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hoặc tên..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          />
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Mã &amp; Tên chương trình</th>
                <th className="px-5 py-3.5">Mức giảm</th>
                <th className="px-5 py-3.5">Điều kiện áp dụng</th>
                <th className="px-5 py-3.5">Thời hạn</th>
                <th className="px-5 py-3.5">Lượt dùng</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Không tìm thấy chương trình khuyến mại nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => {
                  return (
                    <tr key={promo.id || promo.code} className="hover:bg-gray-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {promo.code}
                          </span>
                          {promo.stackable && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                              Cộng dồn
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-gray-900 mt-1">{promo.title}</div>
                        {promo.description && (
                          <div className="text-[11px] text-gray-400 mt-0.5 max-w-xs truncate">
                            {promo.description}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {promo.discountType === 'percentage' ? (
                          <div className="flex items-center gap-1 font-bold text-blue-700">
                            <Percent className="w-3.5 h-3.5" />
                            <span>Giảm {promo.discountPercent}%</span>
                            {promo.maxDiscount ? (
                              <span className="text-[10px] text-gray-400 font-normal">
                                (tối đa {formatPrice(promo.maxDiscount)})
                              </span>
                            ) : null}
                          </div>
                        ) : promo.discountType === 'free_shipping' ? (
                          <div className="flex items-center gap-1 font-bold text-teal-700">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Miễn phí vận chuyển</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 font-bold text-emerald-700">
                            <Coins className="w-3.5 h-3.5" />
                            <span>Giảm {formatPrice(promo.discountAmount || 0)}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {promo.minOrder > 0 ? (
                          <span>Đơn từ {formatPrice(promo.minOrder)}</span>
                        ) : (
                          <span className="text-gray-400">Không giới hạn đơn</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{promo.startDate}</span>
                          <span className="text-gray-300">→</span>
                          <span>{promo.endDate}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{promo.usageCount || 0}</span>
                          <span className="text-gray-400">/</span>
                          <span>{promo.usageLimit ? promo.usageLimit : '∞'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {promo.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang chạy
                          </span>
                        )}
                        {promo.status === 'scheduled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            Sắp bắt đầu
                          </span>
                        )}
                        {promo.status === 'paused' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <PauseCircle className="w-3 h-3" />
                            Tạm dừng
                          </span>
                        )}
                        {promo.status === 'expired' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">
                            Hết hạn
                          </span>
                        )}
                        {promo.status === 'archived' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">
                            Lưu trữ
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(promo)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {promo.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(promo)}
                              className={`p-1.5 rounded-lg border transition ${
                                promo.status === 'paused'
                                  ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                  : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              }`}
                              title={promo.status === 'paused' ? 'Tiếp tục chạy' : 'Tạm dừng'}
                            >
                              {promo.status === 'paused' ? (
                                <PlayCircle className="w-3.5 h-3.5" />
                              ) : (
                                <PauseCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {promo.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => handleArchive(promo)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                              title="Lưu trữ"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl relative animate-fadeIn my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#0E7A32]" />
                {editingPromo ? `Chỉnh sửa mã: ${editingPromo.code}` : 'Tạo chương trình khuyến mại mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mã khuyến mại *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingPromo)}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VÍ DỤ: DAICHI10"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl uppercase font-mono disabled:bg-gray-100 focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên chương trình *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ưu đãi hải sản Nhật tháng 10"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mô tả chi tiết
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Áp dụng cho mọi đơn hàng cá Saba và Hokke..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Hình thức giảm giá
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      discountType === 'fixed'
                        ? 'border-[#0E7A32] bg-emerald-50 text-[#0E7A32]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Số tiền cố định</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      discountType === 'percentage'
                        ? 'border-[#0E7A32] bg-emerald-50 text-[#0E7A32]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Theo phần trăm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('free_shipping')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      discountType === 'free_shipping'
                        ? 'border-[#0E7A32] bg-emerald-50 text-[#0E7A32]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Free ship</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Value inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {discountType === 'fixed' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Số tiền giảm (VNĐ) *
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      required
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                    />
                  </div>
                )}

                {discountType === 'percentage' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Phần trăm giảm (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Giảm tối đa (VNĐ, để trống nếu không giới hạn)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={maxDiscount || ''}
                        onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : 0)}
                        placeholder="Ví dụ: 100000"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giới hạn số lượt dùng (để trống nếu không giới hạn)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Không giới hạn"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>
              </div>

              {/* Date ranges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>
              </div>

              {/* Stackable */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="stackableCheck"
                  checked={stackable}
                  onChange={(e) => setStackable(e.target.checked)}
                  className="rounded border-gray-300 text-[#0E7A32] focus:ring-[#0E7A32]"
                />
                <label htmlFor="stackableCheck" className="text-xs text-gray-700 font-medium">
                  Cho phép áp dụng cộng dồn với các ưu đãi khác
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0E7A32] hover:bg-[#0c6b2b] rounded-xl transition flex items-center gap-2 shadow-xs disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingPromo ? 'Cập nhật mã' : 'Lưu chương trình'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
