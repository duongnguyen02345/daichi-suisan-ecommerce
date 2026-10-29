import React, { useMemo, useState } from 'react';
import { BarChart3, Search, ShoppingBag, Users } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useOrders } from '../../context/OrderContext';
import { formatPrice } from '../../lib/utils';
import { Order } from '../../types';

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  orderCount: number;
  completedOrders: number;
  totalSpent: number;
  lastOrderCode: string;
  lastOrderAt: string;
}

const buildCustomers = (orders: Order[]) => {
  const customers = new Map<string, CustomerSummary>();
  orders.forEach((order) => {
    const id = order.phone.replace(/\s+/g, '') || order.email || order.recipientName;
    const current = customers.get(id);
    const isCompleted = order.status === 'delivered';
    if (!current) {
      customers.set(id, {
        id,
        name: order.recipientName,
        phone: order.phone,
        email: order.email,
        address: order.address,
        orderCount: 1,
        completedOrders: isCompleted ? 1 : 0,
        totalSpent: isCompleted ? order.total : 0,
        lastOrderCode: order.code,
        lastOrderAt: order.createdAt,
      });
      return;
    }
    current.orderCount += 1;
    current.completedOrders += isCompleted ? 1 : 0;
    current.totalSpent += isCompleted ? order.total : 0;
  });
  return Array.from(customers.values());
};

export const CustomersSection: React.FC = () => {
  const { orders } = useOrders();
  const [search, setSearch] = useState('');
  const customers = useMemo(() => buildCustomers(orders), [orders]);
  const visibleCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter((customer) => (
      `${customer.name} ${customer.phone} ${customer.email || ''}`.toLowerCase().includes(keyword)
    ));
  }, [customers, search]);

  return (
    <section className="bg-white rounded-[12px] border border-gray-200 shadow-card overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0E7A32]" /> Danh sách khách hàng
          </h2>
          <p className="text-xs text-gray-500 mt-1">Tổng hợp từ thông tin nhận hàng; không hiển thị dữ liệu thanh toán nhạy cảm.</p>
        </div>
        <div className="relative sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên, điện thoại hoặc email"
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[820px]">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
            <tr>
              <th className="text-left p-4">Khách hàng</th>
              <th className="text-left p-4">Địa chỉ gần nhất</th>
              <th className="text-center p-4">Đơn hàng</th>
              <th className="text-right p-4">Đã chi</th>
              <th className="text-left p-4">Đơn gần nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-emerald-50/20">
                <td className="p-4">
                  <div className="font-bold text-gray-900">{customer.name}</div>
                  <div className="text-gray-500 mt-1">{customer.phone}</div>
                  {customer.email ? <div className="text-gray-400 mt-0.5">{customer.email}</div> : null}
                </td>
                <td className="p-4 text-gray-600 max-w-xs"><p className="line-clamp-2">{customer.address}</p></td>
                <td className="p-4 text-center">
                  <div className="font-bold text-gray-900">{customer.orderCount}</div>
                  <div className="text-[10px] text-gray-400">{customer.completedOrders} hoàn tất</div>
                </td>
                <td className="p-4 text-right font-black text-[#0E7A32]">{formatPrice(customer.totalSpent)}</td>
                <td className="p-4">
                  <div className="font-bold text-gray-800">{customer.lastOrderCode}</div>
                  <div className="text-gray-400 mt-1">{customer.lastOrderAt}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleCustomers.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-500">Không có khách hàng phù hợp.</div>
      ) : null}
    </section>
  );
};

const reportStatusLabels: Record<Order['status'], string> = {
  awaiting_payment: 'Chờ thanh toán',
  pending: 'Chờ xử lý',
  shipping: 'Đang giao',
  delivered: 'Hoàn thành',
  returned: 'Hoàn hàng',
  cancelled: 'Đã hủy',
};

export const ReportsSection: React.FC = () => {
  const { orders } = useOrders();
  const { products } = useAdmin();

  const report = useMemo(() => {
    const completedOrders = orders.filter((order) => order.status === 'delivered');
    const completedRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = completedOrders.length > 0
      ? Math.round(completedRevenue / completedOrders.length)
      : 0;
    const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.price, 0);
    const statusCounts = Object.keys(reportStatusLabels).reduce((result, key) => {
      const status = key as Order['status'];
      result[status] = orders.filter((order) => order.status === status).length;
      return result;
    }, {} as Record<Order['status'], number>);

    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productSales.get(item.product.id) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity;
        current.revenue += item.quantity * item.price;
        productSales.set(item.product.id, current);
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5);
    return { completedRevenue, averageOrderValue, inventoryValue, statusCounts, topProducts };
  }, [orders, products]);

  const maxStatusCount = Math.max(1, ...Object.values(report.statusCounts));
  const maxProductQuantity = Math.max(1, ...report.topProducts.map((product) => product.quantity));

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ['Doanh thu hoàn tất', formatPrice(report.completedRevenue)],
          ['Giá trị đơn trung bình', formatPrice(report.averageOrderValue)],
          ['Giá trị tồn kho ước tính', formatPrice(report.inventoryValue)],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-[12px] border border-gray-200 p-5 shadow-card">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-black text-gray-900 mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-[12px] border border-gray-200 p-5 shadow-card">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0E7A32]" /> Phân bổ trạng thái đơn
          </h2>
          <div className="mt-5 space-y-4">
            {Object.entries(report.statusCounts).map(([key, count]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">{reportStatusLabels[key as Order['status']]}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0E7A32]"
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[12px] border border-gray-200 p-5 shadow-card">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" /> Sản phẩm bán chạy
          </h2>
          {report.topProducts.length > 0 ? (
            <div className="mt-5 space-y-4">
              {report.topProducts.map((product) => (
                <div key={product.name}>
                  <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                    <span className="font-semibold text-gray-700 truncate">{product.name}</span>
                    <span className="font-bold text-gray-900 flex-none">{product.quantity} · {formatPrice(product.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${(product.quantity / maxProductQuantity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-5">Chưa có đơn hoàn thành để tính sản phẩm bán chạy.</p>
          )}
        </section>
      </div>
    </div>
  );
};
