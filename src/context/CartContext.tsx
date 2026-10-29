import React, { createContext, useContext, useState } from 'react';
import { CartItem, Product, Promotion } from '../types';
import { mockProducts, mockPromotions } from '../data/mockData';
import { getProductVatBreakdown } from '../lib/vat';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  removeSelectedItems: () => void;
  toggleSelect: (productId: string) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  appliedCoupon: Promotion | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  orderNote: string;
  setOrderNote: (note: string) => void;
  deliveryMode: 'immediate' | 'scheduled';
  setDeliveryMode: (mode: 'immediate' | 'scheduled') => void;
  deliveryDate: string;
  setDeliveryDate: (date: string) => void;
  deliveryTimeSlot: string;
  setDeliveryTimeSlot: (slot: string) => void;
  clearCart: () => void;
  // Computed values
  totalItemsCount: number;
  selectedItemsCount: number;
  subtotal: number;
  netSubtotal: number;
  vatTotal: number;
  grossProductTotal: number;
  productDiscount: number;
  couponDiscount: number;
  shippingFee: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const toLocalDateId = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parsePromotionDate = (value: string, endOfDay = false) => {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with the 4 items shown in the Shopping Cart screenshot
  const [items, setItems] = useState<CartItem[]>(() => {
    return [
      {
        product: {
          ...mockProducts[8], // Cà chua
          name: 'Cà chua tươi',
          unit: 'Gói 1kg | Nguồn gốc: Đà Lạt',
          tags: ['Tươi ngon'],
        },
        quantity: 2,
        selected: true,
      },
      {
        product: {
          ...mockProducts[1], // Chuối tiêu
          name: 'Chuối tiêu',
          unit: '1kg | Nguồn gốc: Tiền Giang',
          price: 25000,
          originalPrice: 28000,
          tags: ['Tươi ngon', 'Giảm 10%'],
        },
        quantity: 1,
        selected: true,
      },
      {
        product: {
          ...mockProducts[2], // Thịt bò thăn
          name: 'Thịt bò thăn',
          unit: '500g | Nguồn gốc: Úc',
          price: 285000,
          originalPrice: 285000,
          tags: ['Tươi ngon', 'Đông lạnh'],
        },
        quantity: 1,
        selected: true,
      },
      {
        product: {
          ...mockProducts[4], // Súp lơ xanh
          name: 'Súp lơ xanh',
          unit: '1kg | Nguồn gốc: Đà Lạt',
          tags: ['Tươi ngon', 'Hữu cơ'],
        },
        quantity: 1,
        selected: true,
      },
    ].filter((item) => item.product.stock > 0 && !item.product.temporarilyUnavailable);
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Promotion | null>(null);
  const [orderNote, setOrderNote] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [deliveryDate, setDeliveryDate] = useState(() => toLocalDateId(new Date()));
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('Giao ngay');

  const addItem = (product: Product, quantity = 1): boolean => {
    if (product.stock <= 0 || product.temporarilyUnavailable || quantity > product.stock) {
      return false;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity, selected: true }];
    });
    return true;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(item.product.stock, quantity) }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const removeSelectedItems = () => {
    setItems((prev) => prev.filter((item) => !item.selected));
  };

  const toggleSelect = (productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const isAllSelected = items.length > 0 && items.every((item) => item.selected);

  const toggleSelectAll = () => {
    const nextState = !isAllSelected;
    setItems((prev) => prev.map((item) => ({ ...item, selected: nextState })));
  };

  const applyCoupon = (code: string) => {
    const found = mockPromotions.find(
      (p) => p.code.toUpperCase() === code.trim().toUpperCase() && p.status === 'active'
    );
    if (!found) {
      return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' };
    }
    const now = new Date();
    if (now < parsePromotionDate(found.startDate) || now > parsePromotionDate(found.endDate, true)) {
      return { success: false, message: 'Mã giảm giá chưa bắt đầu hoặc đã hết hạn.' };
    }
    if (currentTotal < found.minOrder) {
      return {
        success: false,
        message: `Đơn hàng cần đạt tối thiểu ${found.minOrder.toLocaleString('vi-VN')}đ để áp dụng mã này.`,
      };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Áp dụng thành công mã ${found.code}!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setOrderNote('');
    setDeliveryMode('immediate');
    setDeliveryDate(toLocalDateId(new Date()));
    setDeliveryTimeSlot('Giao ngay');
  };

  // Calculations ONLY for selected items
  const selectedItems = items.filter((item) => item.selected);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const selectedItemsCount = selectedItems.length;

  const subtotal = selectedItems.reduce((sum, item) => {
    const original = getProductVatBreakdown(
      item.product,
      item.product.originalPrice || item.product.price,
    );
    return sum + original.grossPrice * item.quantity;
  }, 0);

  const totals = selectedItems.reduce((result, item) => {
    const breakdown = getProductVatBreakdown(item.product);
    result.netSubtotal += breakdown.netPrice * item.quantity;
    result.vatTotal += breakdown.vatAmount * item.quantity;
    result.grossProductTotal += breakdown.grossPrice * item.quantity;
    return result;
  }, { netSubtotal: 0, vatTotal: 0, grossProductTotal: 0 });
  const { netSubtotal, vatTotal, grossProductTotal } = totals;
  const currentTotal = grossProductTotal;

  const productDiscount = Math.max(0, subtotal - currentTotal);

  let couponDiscount = 0;
  let shippingFee = selectedItems.length > 0 ? (currentTotal >= 500000 ? 0 : 25000) : 0;

  if (appliedCoupon && selectedItems.length > 0) {
    if (appliedCoupon.code === 'FREESHIP') {
      shippingFee = 0;
    } else if (appliedCoupon.discountAmount) {
      couponDiscount = Math.min(appliedCoupon.discountAmount, currentTotal);
    } else if (appliedCoupon.discountPercent) {
      couponDiscount = Math.min(currentTotal, Math.round(currentTotal * appliedCoupon.discountPercent / 100));
    }
  }

  const finalTotal = selectedItems.length > 0
    ? Math.max(0, currentTotal - couponDiscount + shippingFee)
    : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        removeSelectedItems,
        toggleSelect,
        toggleSelectAll,
        isAllSelected,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        orderNote,
        setOrderNote,
        deliveryMode,
        setDeliveryMode,
        deliveryDate,
        setDeliveryDate,
        deliveryTimeSlot,
        setDeliveryTimeSlot,
        clearCart,
        totalItemsCount,
        selectedItemsCount,
        subtotal,
        netSubtotal,
        vatTotal,
        grossProductTotal,
        productDiscount,
        couponDiscount,
        shippingFee,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
