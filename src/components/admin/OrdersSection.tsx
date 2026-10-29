import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  MoreHorizontal,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  Undo2,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { formatPrice } from '../../lib/utils';
import { Order, PaymentStatus } from '../../types';

const statusLabels: Record<Order['status'], string> = {
  awaiting_payment: 'Chờ thanh toán',
  pending: 'Chờ xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã hoàn thành',
  returned: 'Đã hoàn hàng',
  cancelled: 'Đã hủy',
};

const paymentLabels: Record<PaymentStatus, string> = {
  cash_on_delivery: 'COD',
  awaiting_confirmation: 'Chờ chuyển khoản',
  customer_reported: 'Khách báo đã chuyển',
  paid: 'Đã thanh toán',
  review_required: 'Cần đối soát',
  failed: 'Thanh toán thất bại',
  expired: 'Đã hết hạn',
  refunded: 'Đã hoàn tiền',
};

const statusStyles: Record<Order['status'], string> = {
  awaiting_payment: 'bg-amber-50 text-amber-700 border-amber-100',
  pending: 'bg-orange-50 text-orange-700 border-orange-100',
  shipping: 'bg-sky-50 text-sky-700 border-sky-100',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  returned: 'bg-violet-50 text-violet-700 border-violet-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
};

const paymentStyles: Record<PaymentStatus, string> = {
  cash_on_delivery: 'bg-orange-50 text-orange-700 border-orange-100',
  awaiting_confirmation: 'bg-amber-50 text-amber-700 border-amber-100',
  customer_reported: 'bg-blue-50 text-blue-700 border-blue-100',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  review_required: 'bg-violet-50 text-violet-700 border-violet-100',
  failed: 'bg-rose-50 text-rose-700 border-rose-100',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  refunded: 'bg-slate-100 text-slate-700 border-slate-200',
};

const nextActions: Record<Order['status'], Array<{
  status: Order['status'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}>> = {
  awaiting_payment: [
    { status: 'cancelled', label: 'Hủy đơn', icon: XCircle, className: 'bg-rose-50 text-rose-700' },
  ],
  pending: [
    { status: 'shipping', label: 'Bắt đầu giao', icon: Truck, className: 'bg-sky-50 text-sky-700' },
    { status: 'cancelled', label: 'Hủy đơn', icon: XCircle, className: 'bg-rose-50 text-rose-700' },
  ],
  shipping: [
    { status: 'delivered', label: 'Hoàn thành', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
    { status: 'returned', label: 'Hoàn hàng', icon: Undo2, className: 'bg-orange-50 text-orange-700' },
  ],
  delivered: [
    { status: 'returned', label: 'Hoàn hàng', icon: Undo2, className: 'bg-orange-50 text-orange-700' },
  ],
  returned: [],
  cancelled: [],
};

type DateFilter = 'all' | 'today' | '7days' | '30days';
type PaymentFilter = 'all' | 'cod' | 'bank_transfer' | 'needs_review' | 'paid';

const parseOrderDate = (value: string) => {
  const localeMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?/);
  if (localeMatch) {
    return new Date(
      Number(localeMatch[3]),
      Number(localeMatch[2]) - 1,
      Number(localeMatch[1]),
      Number(localeMatch[4] || 0),
      Number(localeMatch[5] || 0),
    );
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDateParts = (value: string) => {
  const date = parseOrderDate(value);
  if (!date) return { date: value, time: '' };
  return {
    date: date.toLocaleDateString('vi-VN'),
    time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
};

const getInitials = (name: string) => name
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'KH';

const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const RoundCheckbox: React.FC<{
  checked: boolean;
  label: string;
  onChange: () => void;
  className?: string;
}> = ({ checked, label, onChange, className = '' }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E7A32]/30 focus:ring-offset-1 ${
      checked
        ? 'border-[#0E7A32] bg-[#0E7A32] text-white'
        : 'border-gray-300 bg-white text-transparent hover:border-[#0E7A32]'
    } ${className}`}
  >
    <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
  </button>
);

export const OrdersSection: React.FC = () => {
  const {
    orders,
    isLoading,
    dataSource,
    lastError,
    refreshOrders,
    transitionOrderStatus,
    confirmOrderPayment,
  } = useOrders();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | Order['status']>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  const summary = useMemo(() => ({
    total: orders.length,
    waiting: orders.filter((order) => ['awaiting_payment', 'pending'].includes(order.status)).length,
    completed: orders.filter((order) => order.status === 'delivered').length,
    revenue: orders
      .filter((order) => order.status === 'delivered')
      .reduce((sum, order) => sum + order.total, 0),
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const now = new Date();
    const fromDate = new Date(now);
    if (dateFilter === 'today') fromDate.setHours(0, 0, 0, 0);
    if (dateFilter === '7days') fromDate.setDate(now.getDate() - 7);
    if (dateFilter === '30days') fromDate.setDate(now.getDate() - 30);

    return orders.filter((order) => {
      const matchesStatus = status === 'all' || order.status === status;
      const matchesSearch = !keyword || `${order.code} ${order.recipientName} ${order.phone}`
        .toLowerCase()
        .includes(keyword);
      const matchesPayment = paymentFilter === 'all'
        || (paymentFilter === 'cod' && order.paymentMethod === 'cod')
        || (paymentFilter === 'bank_transfer' && order.paymentMethod === 'bank_transfer')
        || (paymentFilter === 'needs_review' && ['customer_reported', 'review_required'].includes(order.paymentStatus || ''))
        || (paymentFilter === 'paid' && order.paymentStatus === 'paid');
      const orderDate = parseOrderDate(order.createdAt);
      const matchesDate = dateFilter === 'all' || Boolean(orderDate && orderDate >= fromDate);
      return matchesStatus && matchesSearch && matchesPayment && matchesDate;
    }).sort((left, right) => {
      const priority = Number(right.paymentStatus === 'customer_reported')
        - Number(left.paymentStatus === 'customer_reported');
      if (priority !== 0) return priority;
      return (parseOrderDate(right.createdAt)?.getTime() || 0)
        - (parseOrderDate(left.createdAt)?.getTime() || 0);
    });
  }, [dateFilter, orders, paymentFilter, search, status]);

  useEffect(() => {
    setPage(1);
  }, [dateFilter, pageSize, paymentFilter, search, status]);

  const pageCount = Math.max(1, Math.ceil(visibleOrders.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedOrders = visibleOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allOnPageSelected = paginatedOrders.length > 0
    && paginatedOrders.every((order) => selectedIds.has(order.id));

  const changeStatus = async (order: Order, nextStatus: Order['status']) => {
    if (['cancelled', 'returned'].includes(nextStatus)) {
      const confirmed = window.confirm(`Chuyển đơn ${order.code} sang “${statusLabels[nextStatus]}”?`);
      if (!confirmed) return;
    }
    setWorkingId(order.id);
    const result = await transitionOrderStatus(
      order.id,
      nextStatus,
      `Admin chuyển trạng thái sang ${statusLabels[nextStatus]}`,
    );
    setMessage({ success: result.success, text: result.message });
    setWorkingId(null);
  };

  const confirmPayment = async (order: Order) => {
    const confirmed = window.confirm(
      `Xác nhận đã nhận đủ ${formatPrice(order.total)} cho đơn ${order.code}?`,
    );
    if (!confirmed) return;
    setWorkingId(order.id);
    const result = await confirmOrderPayment(order.id, 'Admin đối soát và xác nhận thủ công');
    setMessage({ success: result.success, text: result.message });
    setWorkingId(null);
  };

  const toggleSelected = (orderId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const togglePage = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      paginatedOrders.forEach((order) => {
        if (allOnPageSelected) next.delete(order.id);
        else next.add(order.id);
      });
      return next;
    });
  };

  const exportOrders = () => {
    const selectedOrders = visibleOrders.filter((order) => selectedIds.has(order.id));
    const rows = selectedOrders.length > 0 ? selectedOrders : visibleOrders;
    const csv = [
      ['Mã đơn hàng', 'Ngày đặt', 'Khách hàng', 'Số điện thoại', 'Địa chỉ', 'Tổng tiền', 'Thanh toán', 'Trạng thái'],
      ...rows.map((order) => [
        order.code,
        order.createdAt,
        order.recipientName,
        order.phone,
        order.address,
        order.total,
        order.paymentStatus ? paymentLabels[order.paymentStatus] : 'Chưa cập nhật',
        statusLabels[order.status],
      ]),
    ].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `freshmart-don-hang-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderActions = (order: Order) => {
    const canConfirmPayment = order.paymentMethod === 'bank_transfer'
      && ['awaiting_payment', 'pending'].includes(order.status)
      && ['awaiting_confirmation', 'customer_reported', 'review_required']
        .includes(order.paymentStatus || '');
    const availableActions = nextActions[order.status].filter((action) => (
      action.status !== 'shipping'
      || order.paymentMethod !== 'bank_transfer'
      || order.paymentStatus === 'paid'
    ));
    const isWorking = workingId === order.id;

    return (
      <div className="flex flex-wrap gap-2">
        {canConfirmPayment ? (
          <button
            type="button"
            onClick={() => void confirmPayment(order)}
            disabled={isWorking}
            className="h-9 px-3 rounded-lg bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2"
          >
            <PackageCheck className="w-4 h-4" /> Đã thanh toán thành công
          </button>
        ) : null}
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.status}
              type="button"
              onClick={() => void changeStatus(order, action.status)}
              disabled={isWorking}
              className={`h-9 px-3 rounded-lg disabled:opacity-60 text-xs font-bold flex items-center gap-2 ${action.className}`}
            >
              <Icon className="w-4 h-4" /> {action.label}
            </button>
          );
        })}
      </div>
    );
  };

  const statCards = [
    { label: 'Tổng đơn hàng', value: summary.total.toLocaleString('vi-VN'), note: 'Tất cả đơn trên hệ thống', icon: ShoppingCart, style: 'bg-emerald-50 text-emerald-700' },
    { label: 'Chờ xử lý', value: summary.waiting.toLocaleString('vi-VN'), note: 'Cần kiểm tra và xác nhận', icon: Clock3, style: 'bg-orange-50 text-orange-600' },
    { label: 'Đã hoàn thành', value: summary.completed.toLocaleString('vi-VN'), note: 'Đơn giao thành công', icon: CheckCircle2, style: 'bg-green-50 text-green-700' },
    { label: 'Doanh thu', value: formatPrice(summary.revenue), note: 'Từ các đơn đã hoàn thành', icon: CircleDollarSign, style: 'bg-blue-50 text-blue-700' },
  ];

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="bg-white rounded-[16px] border border-gray-200 p-4 shadow-card flex items-center gap-4 min-h-[116px]">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-none ${card.style}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-600">{card.label}</p>
                <p className="text-xl lg:text-2xl font-black text-gray-950 mt-1 truncate">{card.value}</p>
                <p className="text-[11px] text-gray-400 mt-1 truncate">{card.note}</p>
              </div>
            </article>
          );
        })}
      </section>

      {message ? (
        <div role="status" className={`rounded-xl border p-3 text-xs font-semibold ${
          message.success
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.text}
        </div>
      ) : null}
      {lastError ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Không thể đồng bộ đơn hàng: {lastError}
        </div>
      ) : null}

      <section className="bg-white rounded-[16px] border border-gray-200 shadow-card overflow-visible">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
            <label className="relative sm:col-span-2 lg:col-span-1">
              <span className="sr-only">Tìm đơn hàng</span>
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mã đơn, tên khách hàng..."
                className="w-full h-10 pl-9 pr-3 text-xs border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="relative">
              <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                aria-label="Lọc theo thời gian"
                className="w-full h-10 pl-9 pr-8 appearance-none text-xs border border-gray-200 rounded-xl bg-white outline-none focus:border-emerald-500"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="7days">7 ngày gần đây</option>
                <option value="30days">30 ngày gần đây</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </label>
            <label className="relative">
              <Truck className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as 'all' | Order['status'])}
                aria-label="Lọc theo trạng thái đơn hàng"
                className="w-full h-10 pl-9 pr-8 appearance-none text-xs border border-gray-200 rounded-xl bg-white outline-none focus:border-emerald-500"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </label>
            <label className="relative">
              <WalletCards className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
                aria-label="Lọc theo thanh toán"
                className="w-full h-10 pl-9 pr-8 appearance-none text-xs border border-gray-200 rounded-xl bg-white outline-none focus:border-emerald-500"
              >
                <option value="all">Tất cả thanh toán</option>
                <option value="cod">COD</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="needs_review">Cần đối soát</option>
                <option value="paid">Đã thanh toán</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </label>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={exportOrders}
              disabled={visibleOrders.length === 0}
              className="h-10 px-3 rounded-xl border border-gray-200 disabled:opacity-50 text-gray-700 text-xs font-bold flex items-center gap-2 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Xuất file
            </button>
            <button
              type="button"
              onClick={() => void refreshOrders()}
              disabled={isLoading}
              className="h-10 px-3 rounded-xl bg-[#0E7A32] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto px-4 pt-3">
          <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-xs">
            <thead className="text-gray-700 font-bold tracking-wide text-[11px]">
              <tr>
                <th className="w-12 rounded-l-[12px] bg-[#EAF7EE] py-3 px-4 text-center">
                  <RoundCheckbox
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    label="Chọn tất cả đơn trên trang"
                  />
                </th>
                <th className="w-14 bg-[#EAF7EE] py-3 px-2 text-center font-bold">STT</th>
                <th className="bg-[#EAF7EE] py-3 px-3 text-left font-bold">Ngày đặt</th>
                <th className="bg-[#EAF7EE] py-3 px-3 text-left font-bold">Mã đơn hàng</th>
                <th className="bg-[#EAF7EE] py-3 px-3 text-left font-bold">Khách hàng</th>
                <th className="bg-[#EAF7EE] py-3 px-3 text-right font-bold">Tổng tiền</th>
                <th className="bg-[#EAF7EE] py-3 px-3 text-left font-bold">Thanh toán</th>
                <th className="bg-[#EAF7EE] py-3 px-3 text-left font-bold">Trạng thái</th>
                <th className="w-28 rounded-r-[12px] bg-[#EAF7EE] py-3 px-3 text-center font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="[&_tr_td]:border-b [&_tr_td]:border-gray-200">
              {paginatedOrders.map((order, index) => {
                const dateParts = getDateParts(order.createdAt);
                const paymentStatus = order.paymentStatus || (order.paymentMethod === 'cod' ? 'cash_on_delivery' : 'awaiting_confirmation');
                const isExpanded = expandedId === order.id;
                const needsReview = ['customer_reported', 'review_required'].includes(paymentStatus);
                return (
                  <React.Fragment key={order.id}>
                    <tr className={`border-b border-gray-100 hover:bg-emerald-50/30 transition-colors ${needsReview ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <RoundCheckbox
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelected(order.id)}
                          label={`Chọn đơn ${order.code}`}
                        />
                      </td>
                      <td className="px-2 py-3 text-center text-gray-500">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-bold text-gray-800">{dateParts.date}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{dateParts.time}</div>
                      </td>
                      <td className="px-3 py-3"><button type="button" onClick={() => setExpandedId(isExpanded ? null : order.id)} className="font-black text-blue-600 hover:text-blue-800">{order.code}</button></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black flex-none">{getInitials(order.recipientName)}</div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate max-w-[180px]">{order.recipientName}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">{order.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-black text-gray-900 whitespace-nowrap">{formatPrice(order.total)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${paymentStyles[paymentStatus]}`}>
                          {order.paymentMethod === 'cod' ? <Banknote className="w-3.5 h-3.5" /> : <WalletCards className="w-3.5 h-3.5" />}
                          {paymentLabels[paymentStatus]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${statusStyles[order.status]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => setExpandedId(isExpanded ? null : order.id)} aria-label={`Xem đơn ${order.code}`} title="Xem chi tiết" className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${isExpanded ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Eye className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setExpandedId(isExpanded ? null : order.id)} aria-label={`Mở thao tác đơn ${order.code}`} title="Thao tác" className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className="bg-[#FBFCFA] border-b border-gray-200">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="grid lg:grid-cols-4 gap-4">
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Địa chỉ giao hàng</p><p className="text-xs text-gray-700 mt-1.5 leading-relaxed">{order.address}</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Thời gian giao</p><p className="text-xs font-semibold text-gray-700 mt-1.5">{order.deliveryMode === 'immediate' || order.deliveryTimeSlot === 'Giao ngay' ? 'Giao ngay' : `${order.deliveryDate} · ${order.deliveryTimeSlot}`}</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Chi tiết thanh toán</p><p className="text-xs text-gray-700 mt-1.5">{order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng'}</p>{order.transferReference ? <p className="text-[11px] text-gray-500 mt-1">Nội dung: <strong>{order.transferReference}</strong></p> : null}</div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Cập nhật đơn hàng</p>{renderActions(order)}</div>
                          </div>
                          {needsReview ? <p className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[11px] font-semibold text-blue-800">Khách đã báo chuyển khoản{order.paymentReportedAt ? ` lúc ${new Date(order.paymentReportedAt).toLocaleString('vi-VN')}` : ''}. Vui lòng đối soát giao dịch trước khi xác nhận.</p> : null}
                          {order.note ? <p className="mt-3 text-[11px] text-gray-500"><strong>Ghi chú:</strong> {order.note}</p> : null}
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100">
          {paginatedOrders.map((order) => {
            const paymentStatus = order.paymentStatus || (order.paymentMethod === 'cod' ? 'cash_on_delivery' : 'awaiting_confirmation');
            const isExpanded = expandedId === order.id;
            return (
              <article key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <RoundCheckbox checked={selectedIds.has(order.id)} onChange={() => toggleSelected(order.id)} label={`Chọn đơn ${order.code}`} className="mt-1 flex-shrink-0" />
                    <div className="min-w-0"><button type="button" onClick={() => setExpandedId(isExpanded ? null : order.id)} className="font-black text-blue-600">{order.code}</button><p className="font-bold text-gray-900 mt-1 truncate">{order.recipientName}</p><p className="text-[11px] text-gray-400">{order.phone} · {order.createdAt}</p></div>
                  </div>
                  <p className="font-black text-gray-900 whitespace-nowrap">{formatPrice(order.total)}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 ml-7"><span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${paymentStyles[paymentStatus]}`}>{paymentLabels[paymentStatus]}</span><span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusStyles[order.status]}`}>{statusLabels[order.status]}</span></div>
                <button type="button" onClick={() => setExpandedId(isExpanded ? null : order.id)} className="mt-3 ml-7 text-xs font-bold text-emerald-700 flex items-center gap-1">{isExpanded ? 'Thu gọn' : 'Xem chi tiết'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button>
                {isExpanded ? <div className="mt-3 ml-7 rounded-xl bg-gray-50 p-3 space-y-3 text-xs text-gray-600"><p><strong>Địa chỉ:</strong> {order.address}</p><p><strong>Giao hàng:</strong> {order.deliveryMode === 'immediate' || order.deliveryTimeSlot === 'Giao ngay' ? 'Giao ngay' : `${order.deliveryDate} · ${order.deliveryTimeSlot}`}</p>{renderActions(order)}</div> : null}
              </article>
            );
          })}
        </div>

        {!isLoading && visibleOrders.length === 0 ? (
          <div className="p-12 text-center border-t border-gray-100">
            <PackageCheck className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-800 mt-3">Không có đơn hàng phù hợp</p>
            <p className="text-xs text-gray-500 mt-1">Hãy đổi từ khóa hoặc bộ lọc đang chọn.</p>
          </div>
        ) : null}

        <footer className="px-4 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-gray-900">Tổng cộng: <span className="text-[#0E7A32]">{formatPrice(visibleOrders.reduce((sum, order) => sum + order.total, 0))}</span></p>
            <p className="text-[11px] text-gray-400 mt-0.5">Hiển thị {visibleOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleOrders.length)} trong tổng số {visibleOrders.length} đơn · {dataSource === 'supabase' ? 'Supabase' : 'Dữ liệu demo'}</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Trang trước" className="w-9 h-9 rounded-lg border border-gray-200 disabled:opacity-40 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <span className="h-9 min-w-9 px-3 rounded-lg bg-[#0E7A32] text-white text-xs font-bold flex items-center justify-center">{currentPage}/{pageCount}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} aria-label="Trang sau" className="w-9 h-9 rounded-lg border border-gray-200 disabled:opacity-40 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
            <label className="ml-2 flex items-center gap-2 text-[11px] text-gray-500">
              Hiển thị
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Số đơn hàng mỗi trang" className="h-9 px-2 rounded-lg border border-gray-200 bg-white font-bold text-gray-700"><option value={8}>8</option><option value={16}>16</option><option value={24}>24</option></select>
            </label>
          </div>
        </footer>
      </section>
    </div>
  );
};
