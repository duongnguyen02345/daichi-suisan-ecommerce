import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import { useOrders } from '../../context/OrderContext';

interface AccountOrdersProps {
  orders: Order[];
  activeFilter?: 'all' | 'pending' | 'shipping' | 'delivered' | 'returned';
}

export const AccountOrders: React.FC<AccountOrdersProps> = ({ orders, activeFilter = 'all' }) => {
  const { reportOrderPayment } = useOrders();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ orderId: string; success: boolean; text: string } | null>(null);
  const filtered = activeFilter === 'all' 
    ? orders 
    : orders.filter((o) => activeFilter === 'pending'
      ? o.status === 'pending' || o.status === 'awaiting_payment'
      : o.status === activeFilter);

  const reportPayment = async (order: Order) => {
    setWorkingId(order.id);
    const result = await reportOrderPayment(order.id);
    setMessage({ orderId: order.id, success: result.success, text: result.message });
    setWorkingId(null);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'awaiting_payment':
        return (
          <span className="bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Chờ chuyển khoản
          </span>
        );
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Chờ xác nhận
          </span>
        );
      case 'shipping':
        return (
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Đang giao
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã giao
          </span>
        );
      case 'returned':
        return (
          <span className="bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Đổi trả
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Đã hết hạn
          </span>
        );
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-[12px] p-8 text-center border border-[#E5E7EB] shadow-card">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-500">Chưa có đơn hàng nào trong mục này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 shadow-card hover:shadow-card-hover transition"
        >
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <span className="text-xs font-bold text-[#0E7A32]">Mã đơn: {order.code}</span>
              <span className="text-xs text-gray-400 ml-2">• {order.createdAt}</span>
            </div>
            <div className="flex items-center gap-2">
              {order.paymentStatus === 'paid' && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
                </span>
              )}
              {order.paymentStatus === 'review_required' && (
                <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">Cần đối soát</span>
              )}
              {order.paymentStatus === 'customer_reported' && (
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Đang xác minh thanh toán
                </span>
              )}
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Items Preview */}
          <div className="py-3 divide-y divide-gray-50 space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 pt-2">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-[12px] object-contain bg-gray-50 p-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-800 truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    Số lượng: x{item.quantity} | {item.product.unit}
                  </p>
                </div>
                <div className="text-xs font-bold text-gray-900">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {order.status === 'awaiting_payment' && order.qrUrl && (
            <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 flex flex-col sm:flex-row items-center gap-3">
              <img src={order.qrUrl} alt={`QR chuyển khoản đơn ${order.code}`} className="w-28 h-auto rounded-lg bg-white" />
              <div className="flex-1 text-center sm:text-left">
                <div className="text-xs font-bold text-blue-900">Đơn hàng đang chờ chuyển khoản</div>
                <p className="text-[11px] text-blue-700 mt-1">Quét QR với đúng số tiền và nội dung <strong>{order.transferReference}</strong>.</p>
                <p className="text-[10px] text-gray-500 mt-1">Hệ thống sẽ tự cập nhật khi webhook xác nhận tiền đã vào tài khoản.</p>
                {order.paymentStatus === 'awaiting_confirmation' ? (
                  <button
                    type="button"
                    onClick={() => void reportPayment(order)}
                    disabled={workingId === order.id}
                    className="mt-3 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {workingId === order.id ? 'Đang gửi...' : 'Đã thanh toán'}
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {order.paymentStatus === 'customer_reported' ? (
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              <strong>Đã báo thanh toán.</strong> Đơn hàng đang được xử lý và chờ SePay hoặc admin xác minh.
            </div>
          ) : null}

          {message?.orderId === order.id ? (
            <div role="status" className={`mb-3 rounded-xl border p-3 text-xs font-semibold ${
              message.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}>
              {message.text}
            </div>
          ) : null}

          {/* Footer of card */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-gray-500">
              Giao đến: <span className="font-semibold text-gray-700">{order.address}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-gray-500">Tổng thanh toán:</span>
              <span className="text-base font-bold text-[#E53935]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
