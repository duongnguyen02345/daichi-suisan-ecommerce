import React, { useEffect, useState } from 'react';
import {
  Menu,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Compass,
} from 'lucide-react';
import { MenuLocation, SiteNavigationItem } from '../../types';
import {
  defaultNavigationItems,
  deleteNavigationItem,
  isSafeUrl,
  loadNavigationItems,
  saveNavigationItem,
} from '../../lib/navigationApi';

interface LocationTab {
  id: MenuLocation;
  label: string;
  description: string;
}

const LOCATION_TABS: LocationTab[] = [
  { id: 'header', label: 'Menu Header chính', description: 'Các liên kết điều hướng xuất hiện trên thanh menu chính của trang web.' },
  { id: 'footer_quick_links', label: 'Footer: Liên kết nhanh', description: 'Cột liên kết nhanh tại chân trang (Trang chủ, Về chúng tôi, Sản phẩm...).' },
  { id: 'footer_policy', label: 'Footer: Chính sách & Hướng dẫn', description: 'Cột chính sách, giao hàng, đổi trả và hướng dẫn mua hàng.' },
];

export const NavigationSection: React.FC = () => {
  const [activeLocation, setActiveLocation] = useState<MenuLocation>('header');
  const [items, setItems] = useState<SiteNavigationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<SiteNavigationItem> | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await loadNavigationItems(activeLocation);
      setItems(data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi tải menu điều hướng.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
    setEditingItem(null);
  }, [activeLocation]);

  const handleCreateNew = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;
    setEditingItem({
      menuLocation: activeLocation,
      label: '',
      url: '/',
      sortOrder: nextOrder,
      isExternal: false,
      openInNewTab: false,
      isActive: true,
    });
    setNotification(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.label?.trim() || !editingItem.url?.trim()) {
      setNotification({ type: 'error', message: 'Vui lòng nhập đầy đủ tên nhãn và đường dẫn liên kết.' });
      return;
    }

    if (!isSafeUrl(editingItem.url)) {
      setNotification({ type: 'error', message: 'Đường dẫn liên kết chứa tiền tố không an toàn (javascript:, data:).' });
      return;
    }

    setIsSaving(true);
    setNotification(null);
    try {
      const saved = await saveNavigationItem({
        id: editingItem.id,
        menuLocation: activeLocation,
        label: editingItem.label,
        url: editingItem.url,
        sortOrder: editingItem.sortOrder ?? 1,
        isExternal: Boolean(editingItem.isExternal),
        openInNewTab: Boolean(editingItem.openInNewTab),
        isActive: editingItem.isActive !== false,
      });

      setNotification({
        type: 'success',
        message: `Đã lưu thành công mục menu "${saved.label}".`,
      });
      setEditingItem(null);
      void fetchItems();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lưu mục menu thất bại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, label: string) => {
    if (!window.confirm(`Xóa mục menu "${label}"?`)) return;

    try {
      await deleteNavigationItem(id);
      setNotification({ type: 'success', message: `Đã xóa mục "${label}".` });
      void fetchItems();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Xóa mục menu thất bại.',
      });
    }
  };

  const handleMoveOrder = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const currentItem = items[index];
    const targetItem = items[targetIdx];

    const currentOrder = currentItem.sortOrder;
    const targetOrder = targetItem.sortOrder;

    try {
      await Promise.all([
        saveNavigationItem({ ...currentItem, sortOrder: targetOrder }),
        saveNavigationItem({ ...targetItem, sortOrder: currentOrder }),
      ]);
      void fetchItems();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể đổi thứ tự.',
      });
    }
  };

  const activeTabMeta = LOCATION_TABS.find((t) => t.id === activeLocation) || LOCATION_TABS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#0E7A32]" />
              Quản lý menu & điều hướng
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Tùy chỉnh các liên kết điều hướng trên thanh Header, menu chân trang và các trang chính sách.
              Kiểm soát thứ tự, nhãn hiển thị và mở tab mới an toàn.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2.5 bg-[#0E7A32] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm liên kết mới</span>
          </button>
        </div>

        {/* Location Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-gray-100 pt-4">
          {LOCATION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLocation(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeLocation === tab.id
                  ? 'bg-[#0E7A32] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Menu className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Editor Modal / Inline Form if editing */}
      {editingItem && (
        <form
          onSubmit={handleSaveItem}
          className="bg-white rounded-[16px] border-2 border-emerald-500/40 p-6 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">
              {editingItem.id ? `Chỉnh sửa liên kết: ${editingItem.label}` : 'Thêm liên kết điều hướng mới'}
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">Vị trí: {activeTabMeta.label}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tên nhãn hiển thị *
              </label>
              <input
                type="text"
                required
                value={editingItem.label || ''}
                onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                placeholder="Ví dụ: Trang chủ, Khuyến mại..."
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Đường dẫn liên kết (URL) *
              </label>
              <input
                type="text"
                required
                value={editingItem.url || ''}
                onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                placeholder="Ví dụ: /products hoặc https://..."
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={editingItem.openInNewTab || false}
                onChange={(e) => setEditingItem({ ...editingItem, openInNewTab: e.target.checked })}
                className="rounded text-[#0E7A32] focus:ring-[#0E7A32] h-4 w-4"
              />
              <span>Mở trong tab mới (target=&quot;_blank&quot;)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={editingItem.isExternal || false}
                onChange={(e) => setEditingItem({ ...editingItem, isExternal: e.target.checked })}
                className="rounded text-[#0E7A32] focus:ring-[#0E7A32] h-4 w-4"
              />
              <span>Liên kết ngoài (External link)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={editingItem.isActive !== false}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                className="rounded text-[#0E7A32] focus:ring-[#0E7A32] h-4 w-4"
              />
              <span>Kích hoạt (Hiển thị)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#0E7A32] text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu liên kết'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Navigation List Table */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{activeTabMeta.label}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{activeTabMeta.description}</p>
          </div>
          <span className="text-xs text-gray-400 font-semibold">{items.length} liên kết</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0E7A32]" />
            <span className="text-xs">Đang tải danh sách menu...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Compass className="w-10 h-10 mx-auto stroke-[1.5] mb-2" />
            <p className="text-xs font-semibold">Chưa có liên kết nào cho vị trí này</p>
            <button
              type="button"
              onClick={handleCreateNew}
              className="mt-3 px-3 py-1.5 bg-emerald-50 text-[#0E7A32] rounded-xl text-xs font-bold"
            >
              + Tạo liên kết đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Thứ tự</th>
                  <th className="py-3 px-4">Tên nhãn</th>
                  <th className="py-3 px-4">Đường dẫn (URL)</th>
                  <th className="py-3 px-4">Thuộc tính</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4 text-center font-bold text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => void handleMoveOrder(idx, -1)}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 rounded"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span>{idx + 1}</span>
                        <button
                          type="button"
                          disabled={idx === items.length - 1}
                          onClick={() => void handleMoveOrder(idx, 1)}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 rounded"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900">
                      {item.label}
                    </td>

                    <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <span>{item.url}</span>
                        {item.openInNewTab && (
                          <ExternalLink className="w-3 h-3 text-gray-400 flex-none" />
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {item.openInNewTab && (
                          <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            Tab mới
                          </span>
                        )}
                        {item.isExternal && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            URL ngoài
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.isActive ? 'Đang bật' : 'Đang tắt'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="text-xs text-[#0E7A32] font-bold hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteItem(item.id, item.label)}
                          className="text-xs text-rose-600 hover:underline p-1"
                          title="Xóa mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
