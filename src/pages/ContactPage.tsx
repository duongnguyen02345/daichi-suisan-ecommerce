import React, { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock3, Facebook, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { getContactChannelHref, loadPublicContactChannels } from '../lib/contactApi';
import { ContactChannel } from '../types';
import { useSiteProfile } from '../context/SiteProfileContext';

export const ContactPage: React.FC = () => {
  const [channels, setChannels] = useState<ContactChannel[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Tư vấn sản phẩm');
  const [orderCode, setOrderCode] = useState('');
  const [message, setMessage] = useState('');
  const { profile } = useSiteProfile();

  useEffect(() => {
    void loadPublicContactChannels().then(setChannels);
  }, []);

  const openChat = (event: FormEvent) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('freshmart:open-chat', {
      detail: {
        name,
        phone,
        orderCode,
        message: `[${topic}]${orderCode ? ` Đơn ${orderCode}.` : ''} ${message}`.trim(),
      },
    }));
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-[#0E7A32]">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900">Liên hệ</span>
      </nav>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-start">
        <section>
          <span className="inline-flex px-3 py-1.5 rounded-full bg-emerald-100 text-[#0E7A32] text-xs font-bold mb-4">{profile.brandName} luôn sẵn sàng hỗ trợ</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-950 tracking-tight">Bạn cần {profile.brandName} hỗ trợ điều gì?</h1>
          <p className="mt-4 text-sm md:text-base leading-7 text-slate-600">
            Liên hệ với chúng tôi về sản phẩm, tư vấn thực đơn gia đình, báo giá nhà hàng/khách sạn hoặc đơn hàng của bạn qua kênh thuận tiện nhất.
          </p>

          <div className="mt-5 p-4 rounded-[16px] bg-white border border-slate-200 text-xs text-slate-700 space-y-2">
            <div><strong>Công ty:</strong> {profile.legalName}</div>
            <div><strong>Địa chỉ:</strong> {profile.address}</div>
            <div><strong>Hotline:</strong> <a href={`tel:${profile.hotline.replace(/[^\d+]/g, '')}`} className="text-[#0E7A32] font-bold hover:underline">{profile.hotline}</a></div>
            {profile.email ? <div><strong>Email:</strong> <a href={`mailto:${profile.email}`} className="text-[#0E7A32] hover:underline">{profile.email}</a></div> : null}
            <div><strong>Mã số thuế:</strong> {profile.taxCode}</div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-7">
            {channels.map((channel) => {
              const href = getContactChannelHref(channel);
              const icon = channel.id === 'phone'
                ? <Phone className="w-5 h-5" />
                : channel.id === 'facebook'
                  ? <Facebook className="w-5 h-5" />
                  : <MessageCircle className="w-5 h-5" />;
              const content = (
                <>
                  <span className="w-10 h-10 rounded-[12px] bg-emerald-100 text-[#0E7A32] flex items-center justify-center">{icon}</span>
                  <span>
                    <strong className="block text-sm text-slate-900">{channel.label}</strong>
                    <small className="text-xs text-slate-500">{channel.contactValue || 'Hỗ trợ trực tuyến'}</small>
                  </span>
                </>
              );
              return channel.id === 'internal_chat' ? (
                <button key={channel.id} type="button" onClick={() => window.dispatchEvent(new CustomEvent('freshmart:open-chat'))} className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white p-4 text-left hover:border-emerald-300 hover:shadow-sm transition">
                  {content}
                </button>
              ) : href ? (
                <a key={channel.id} href={href} target={channel.id === 'phone' ? undefined : '_blank'} rel="noopener noreferrer" className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm transition">
                  {content}
                </a>
              ) : null;
            })}
          </div>

          <div className="mt-6 rounded-[18px] bg-[#064E3B] text-white p-5 space-y-3">
            <div className="flex gap-3"><Clock3 className="w-5 h-5 text-emerald-300" /><div><p className="text-sm font-bold">Thời gian hỗ trợ</p><p className="text-xs text-emerald-100 mt-1">{profile.businessHours}</p></div></div>
            <div className="flex gap-3"><MapPin className="w-5 h-5 text-emerald-300" /><div><p className="text-sm font-bold">Đơn hàng đang giao</p><p className="text-xs text-emerald-100 mt-1">Vui lòng cung cấp mã đơn để được kiểm tra nhanh hơn.</p></div></div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-5 md:p-7">
          <h2 className="text-xl font-bold text-slate-950">Gửi yêu cầu hỗ trợ</h2>
          <p className="text-xs text-slate-500 mt-1.5">Nội dung sẽ mở trong hộp chat trực tiếp giữa bạn và quản trị viên {profile.brandName}.</p>
          <form onSubmit={openChat} className="mt-6 grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-slate-700">Họ và tên<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} className="mt-1.5 w-full h-11 rounded-[12px] border border-slate-200 px-3 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <label className="text-xs font-semibold text-slate-700">Số điện thoại<input value={phone} onChange={(event) => setPhone(event.target.value)} required inputMode="tel" className="mt-1.5 w-full h-11 rounded-[12px] border border-slate-200 px-3 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <label className="text-xs font-semibold text-slate-700">Chủ đề<select value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-1.5 w-full h-11 rounded-[12px] border border-slate-200 px-3 font-normal bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"><option>Tư vấn sản phẩm</option><option>Thanh toán</option><option>Giao hàng</option><option>Đổi trả</option><option>Khiếu nại</option><option>Khác</option></select></label>
            <label className="text-xs font-semibold text-slate-700">Mã đơn hàng <span className="font-normal text-slate-400">(nếu có)</span><input value={orderCode} onChange={(event) => setOrderCode(event.target.value)} maxLength={40} className="mt-1.5 w-full h-11 rounded-[12px] border border-slate-200 px-3 font-normal uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <label className="sm:col-span-2 text-xs font-semibold text-slate-700">Nội dung<textarea value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={1900} rows={6} className="mt-1.5 w-full rounded-[12px] border border-slate-200 px-3 py-2.5 font-normal resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <button className="sm:col-span-2 h-11 rounded-[12px] bg-[#0E7A32] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0A5C25] transition"><Send className="w-4 h-4" />Mở chat để gửi yêu cầu</button>
          </form>
        </section>
      </div>
    </div>
  );
};
