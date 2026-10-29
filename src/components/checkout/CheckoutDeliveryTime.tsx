import React from 'react';
import { CalendarClock, Clock3, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const toLocalDateId = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultSchedule = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return { date: toLocalDateId(date), time: '09:00' };
};

export const CheckoutDeliveryTime: React.FC = () => {
  const {
    deliveryMode,
    setDeliveryMode,
    deliveryDate,
    setDeliveryDate,
    deliveryTimeSlot,
    setDeliveryTimeSlot,
  } = useCart();
  const today = toLocalDateId(new Date());
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  const selectImmediate = () => {
    setDeliveryMode('immediate');
    setDeliveryDate(today);
    setDeliveryTimeSlot('Giao ngay');
  };

  const selectScheduled = () => {
    setDeliveryMode('scheduled');
    if (deliveryTimeSlot === 'Giao ngay' || !deliveryTimeSlot) {
      const defaults = getDefaultSchedule();
      setDeliveryDate(defaults.date);
      setDeliveryTimeSlot(defaults.time);
    }
  };

  return (
    <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 shadow-card space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0E7A32] flex items-center justify-center font-bold text-sm">3</div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">Chọn thời gian giao hàng</h3>
          <p className="text-xs text-gray-500">Giao ngay hoặc hẹn ngày, giờ bạn muốn nhận hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={selectImmediate}
          aria-pressed={deliveryMode === 'immediate'}
          className={`p-4 rounded-2xl border text-left transition ${deliveryMode === 'immediate' ? 'border-[#0E7A32] bg-emerald-50 ring-1 ring-[#0E7A32]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
        >
          <span className="flex items-start gap-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${deliveryMode === 'immediate' ? 'bg-[#0E7A32] text-white' : 'bg-gray-100 text-gray-500'}`}><Truck className="w-5 h-5" /></span>
            <span>
              <strong className="block text-sm text-gray-900">Giao ngay</strong>
              <span className="block text-xs text-gray-500 mt-1">FreshMart chuẩn bị và giao hàng sớm nhất có thể.</span>
              <span className="block text-[11px] font-bold text-[#0E7A32] mt-2">Mặc định</span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={selectScheduled}
          aria-pressed={deliveryMode === 'scheduled'}
          className={`p-4 rounded-2xl border text-left transition ${deliveryMode === 'scheduled' ? 'border-[#0E7A32] bg-emerald-50 ring-1 ring-[#0E7A32]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
        >
          <span className="flex items-start gap-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${deliveryMode === 'scheduled' ? 'bg-[#0E7A32] text-white' : 'bg-gray-100 text-gray-500'}`}><CalendarClock className="w-5 h-5" /></span>
            <span>
              <strong className="block text-sm text-gray-900">Hẹn giờ</strong>
              <span className="block text-xs text-gray-500 mt-1">Chọn chính xác ngày và thời gian muốn nhận hàng.</span>
            </span>
          </span>
        </button>
      </div>

      {deliveryMode === 'scheduled' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-gray-50 border border-gray-200 p-4">
          <label className="text-xs font-bold text-gray-700">
            Ngày nhận hàng *
            <span className="relative block mt-1.5">
              <CalendarClock className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="date" required min={today} max={toLocalDateId(maxDate)} value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7A32]" />
            </span>
          </label>

          <label className="text-xs font-bold text-gray-700">
            Thời gian nhận hàng *
            <span className="relative block mt-1.5">
              <Clock3 className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="time" required value={deliveryTimeSlot === 'Giao ngay' ? '' : deliveryTimeSlot} onChange={(event) => setDeliveryTimeSlot(event.target.value)} className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7A32]" />
            </span>
          </label>
          <p className="sm:col-span-2 text-[11px] text-gray-500">Thời gian hẹn phải cách thời điểm đặt hàng ít nhất 30 phút và không quá 30 ngày.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs text-emerald-900 flex items-center gap-2">
          <Truck className="w-4 h-4 flex-none" />
          Đơn hàng sẽ được chuyển sang chuẩn bị ngay sau khi được xác nhận.
        </div>
      )}
    </div>
  );
};
