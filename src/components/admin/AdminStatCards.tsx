import React from 'react';
import { AlertTriangle, CircleDollarSign, CreditCard, ShoppingBag } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useOrders } from '../../context/OrderContext';
import { formatPrice } from '../../lib/utils';

export const AdminStatCards: React.FC = () => {
  const { products } = useAdmin();
  const { orders } = useOrders();

  const completedRevenue = orders
    .filter((order) => order.status === 'delivered')
    .reduce((total, order) => total + order.total, 0);
  const ordersToProcess = orders.filter((order) => (
    order.status === 'awaiting_payment' || order.status === 'pending'
  )).length;
  const paymentsToReview = orders.filter((order) => (
    order.paymentStatus === 'awaiting_confirmation'
    || order.paymentStatus === 'customer_reported'
    || order.paymentStatus === 'review_required'
  )).length;
  const inventoryAlerts = products.filter((product) => (
    product.status === 'low_stock' || product.status === 'out_of_stock'
  )).length;

  const cards = [
    {
      title: 'Doanh thu hoàn tất',
      value: formatPrice(completedRevenue),
      note: `${orders.filter((order) => order.status === 'delivered').length} đơn hoàn thành`,
      icon: CircleDollarSign,
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Đơn cần xử lý',
      value: ordersToProcess,
      note: 'Chờ thanh toán hoặc đóng gói',
      icon: ShoppingBag,
      iconBg: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Cần đối soát',
      value: paymentsToReview,
      note: 'Giao dịch chuyển khoản',
      icon: CreditCard,
      iconBg: 'bg-rose-50 text-rose-700',
    },
    {
      title: 'Cảnh báo tồn kho',
      value: inventoryAlerts,
      note: 'Sắp hết hoặc đã hết hàng',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      {/* Dashboard cards: 260x120px, Radius 12px */}
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-[12px] p-4 lg:p-5 min-h-[120px] border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-[12px] ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#6B7280]">{card.title}</p>
                <h3 className="text-[22px] font-bold text-[#111827] leading-tight mt-0.5 truncate">
                  {card.value}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">{card.note}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
