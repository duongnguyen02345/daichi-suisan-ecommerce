import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { mockOrders } from '../data/mockData';
import { Order } from '../types';
import {
  confirmRemoteOrderPayment,
  fetchRemoteOrderStatus,
  loadAdminOrders,
  reportRemoteOrderPayment,
  transitionRemoteOrder,
} from '../lib/ordersApi';
import { isPaymentsBackendConfigured, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface OrderActionResult {
  success: boolean;
  message: string;
}

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  dataSource: 'supabase' | 'local';
  lastError: string;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  refreshOrders: () => Promise<void>;
  transitionOrderStatus: (
    orderId: string,
    status: Order['status'],
    note?: string,
  ) => Promise<OrderActionResult>;
  confirmOrderPayment: (orderId: string, note?: string) => Promise<OrderActionResult>;
  reportOrderPayment: (orderId: string) => Promise<OrderActionResult>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const allowedTransitions: Record<Order['status'], Order['status'][]> = {
  awaiting_payment: ['cancelled'],
  pending: ['shipping', 'cancelled'],
  shipping: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
  cancelled: [],
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('freshmart_orders');
    if (saved) {
      try {
        const savedOrders = JSON.parse(saved) as Order[];
        const missingDemoOrders = mockOrders.filter(
          (mockOrder) => !savedOrders.some((order) => order.id === mockOrder.id),
        );
        return [...missingDemoOrders, ...savedOrders];
      } catch {
        localStorage.removeItem('freshmart_orders');
      }
    }
    return mockOrders;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [lastError, setLastError] = useState('');
  const ordersRef = useRef(orders);

  useEffect(() => {
    ordersRef.current = orders;
    if (isSupabaseConfigured && user?.role === 'admin') return;
    localStorage.setItem('freshmart_orders', JSON.stringify(orders));
  }, [orders, user?.role]);

  const refreshOrders = useCallback(async () => {
    if (!isSupabaseConfigured || user?.role !== 'admin') {
      setDataSource('local');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const remoteOrders = await loadAdminOrders();
      setOrders(remoteOrders);
      setDataSource('supabase');
      setLastError('');
    } catch (error) {
      setDataSource('local');
      setLastError(error instanceof Error ? error.message : 'Không thể tải danh sách đơn hàng.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void refreshOrders();
  }, [refreshOrders]);

  useEffect(() => {
    if (!isSupabaseConfigured || user?.role !== 'admin') return;
    const intervalId = window.setInterval(() => {
      void refreshOrders();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [refreshOrders, user?.role]);

  useEffect(() => {
    if (!isPaymentsBackendConfigured) return;
    let cancelled = false;

    const refreshPendingOrders = async () => {
      const pendingOrders = ordersRef.current.filter((order) =>
        order.paymentAccessToken &&
        ['awaiting_confirmation', 'customer_reported', 'review_required']
          .includes(order.paymentStatus || ''),
      );
      if (pendingOrders.length === 0) return;

      const results = await Promise.allSettled(
        pendingOrders.map((order) => fetchRemoteOrderStatus(order.id, order.paymentAccessToken!)),
      );
      if (cancelled) return;

      setOrders((current) => current.map((order) => {
        const index = pendingOrders.findIndex((pending) => pending.id === order.id);
        if (index < 0) return order;
        const result = results[index];
        if (result.status !== 'fulfilled' || !result.value) return order;
        return {
          ...order,
          status: result.value.status,
          paymentStatus: result.value.paymentStatus,
          paymentReportedAt: result.value.paymentReportedAt,
          providerTransactionId: result.value.providerTransactionId,
        };
      }));
    };

    const intervalId = window.setInterval(refreshPendingOrders, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const addOrder = useCallback((order: Order) => {
    setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
  }, []);

  const updateOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, ...updates } : order)),
    );
  }, []);

  const transitionOrderStatus = useCallback(async (
    orderId: string,
    status: Order['status'],
    note?: string,
  ): Promise<OrderActionResult> => {
    const currentOrder = ordersRef.current.find((order) => order.id === orderId);
    if (!currentOrder) return { success: false, message: 'Không tìm thấy đơn hàng.' };
    if (!allowedTransitions[currentOrder.status].includes(status)) {
      return { success: false, message: 'Trạng thái mới không hợp lệ với quy trình đơn hàng.' };
    }
    if (status === 'cancelled' && currentOrder.paymentStatus === 'paid') {
      return { success: false, message: 'Đơn đã thanh toán cần được hoàn tiền trước khi hủy.' };
    }
    if (
      status === 'shipping'
      && currentOrder.paymentMethod === 'bank_transfer'
      && currentOrder.paymentStatus !== 'paid'
    ) {
      return {
        success: false,
        message: 'Chưa thể giao đơn chuyển khoản khi thanh toán chưa được xác minh.',
      };
    }

    try {
      if (isSupabaseConfigured && user?.role === 'admin') {
        await transitionRemoteOrder(orderId, status, note);
        await refreshOrders();
      } else {
        setOrders((current) => current.map((order) => (
          order.id === orderId ? { ...order, status } : order
        )));
      }
      return { success: true, message: 'Đã cập nhật trạng thái đơn hàng.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật đơn hàng.';
      setLastError(message);
      return { success: false, message };
    }
  }, [refreshOrders, user?.role]);

  const confirmOrderPayment = useCallback(async (
    orderId: string,
    note?: string,
  ): Promise<OrderActionResult> => {
    const currentOrder = ordersRef.current.find((order) => order.id === orderId);
    if (!currentOrder) return { success: false, message: 'Không tìm thấy đơn hàng.' };
    if (
      currentOrder.paymentMethod !== 'bank_transfer'
      || !['awaiting_payment', 'pending'].includes(currentOrder.status)
      || !['awaiting_confirmation', 'customer_reported', 'review_required']
        .includes(currentOrder.paymentStatus || '')
    ) {
      return { success: false, message: 'Đơn hàng không ở trạng thái chờ xác nhận chuyển khoản.' };
    }

    try {
      if (isSupabaseConfigured && user?.role === 'admin') {
        await confirmRemoteOrderPayment(orderId, note);
        await refreshOrders();
      } else {
        setOrders((current) => current.map((order) => (
          order.id === orderId
            ? { ...order, paymentStatus: 'paid', status: 'pending' }
            : order
        )));
      }
      return { success: true, message: 'Đã xác nhận thanh toán và chuyển đơn sang chờ xử lý.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xác nhận thanh toán.';
      setLastError(message);
      return { success: false, message };
    }
  }, [refreshOrders, user?.role]);

  const reportOrderPayment = useCallback(async (
    orderId: string,
  ): Promise<OrderActionResult> => {
    const currentOrder = ordersRef.current.find((order) => order.id === orderId);
    if (!currentOrder) return { success: false, message: 'Không tìm thấy đơn hàng.' };
    if (
      currentOrder.paymentMethod !== 'bank_transfer'
      || currentOrder.status !== 'awaiting_payment'
      || currentOrder.paymentStatus !== 'awaiting_confirmation'
    ) {
      return { success: false, message: 'Đơn hàng không còn chờ khách báo đã chuyển khoản.' };
    }

    try {
      if (isPaymentsBackendConfigured && currentOrder.paymentAccessToken) {
        const result = await reportRemoteOrderPayment(orderId, currentOrder.paymentAccessToken);
        if (!result) throw new Error('Máy chủ thanh toán chưa được cấu hình.');
        setOrders((current) => current.map((order) => (
          order.id === orderId
            ? {
                ...order,
                status: result.status,
                paymentStatus: result.paymentStatus,
                paymentReportedAt: result.paymentReportedAt,
              }
            : order
        )));
      } else {
        setOrders((current) => current.map((order) => (
          order.id === orderId
            ? {
                ...order,
                status: 'pending',
                paymentStatus: 'customer_reported',
                paymentReportedAt: new Date().toISOString(),
              }
            : order
        )));
      }
      return {
        success: true,
        message: 'Đã báo thanh toán. FreshMart đang chờ SePay hoặc admin xác minh.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể báo đã thanh toán.';
      setLastError(message);
      return { success: false, message };
    }
  }, []);

  return (
    <OrderContext.Provider value={{
      orders,
      isLoading,
      dataSource,
      lastError,
      addOrder,
      updateOrder,
      refreshOrders,
      transitionOrderStatus,
      confirmOrderPayment,
      reportOrderPayment,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};
