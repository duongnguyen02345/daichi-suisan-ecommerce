import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Headphones, MessageCircle, Phone, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, ContactChannel, ContactChannelType } from '../../types';
import { chatGateway, getContactChannelHref, loadPublicContactChannels } from '../../lib/contactApi';

const CHAT_SESSION_KEY = 'freshmart_chat_session_v1';

interface ChatSession {
  conversationId: string;
  guestToken?: string;
}

interface OpenChatDetail {
  name?: string;
  phone?: string;
  message?: string;
  orderCode?: string;
}

const readSession = (): ChatSession | null => {
  try {
    return JSON.parse(sessionStorage.getItem(CHAT_SESSION_KEY) || 'null') as ChatSession | null;
  } catch {
    return null;
  }
};

const channelStyle: Record<ContactChannelType, string> = {
  zalo: 'bg-[#0A68FE] ring-blue-200',
  phone: 'bg-[#FF7A1A] ring-orange-200',
  facebook: 'bg-[#1877F2] ring-blue-200',
  internal_chat: 'bg-[#0E7A32] ring-emerald-200',
};

const ChannelIcon: React.FC<{ type: ContactChannelType }> = ({ type }) => {
  if (type === 'phone') return <Phone className="w-5 h-5" />;
  if (type === 'internal_chat') return <MessageCircle className="w-5 h-5" />;
  if (type === 'facebook') return <span className="text-xl font-black leading-none">f</span>;
  return <span className="text-[10px] font-black">Zalo</span>;
};

export const ContactFloatingWidget: React.FC = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ContactChannel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(() => readSession());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [orderCode, setOrderCode] = useState('');
  const [draft, setDraft] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void loadPublicContactChannels().then(setChannels);
  }, []);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.phone) setPhone(user.phone);
  }, [user?.name, user?.phone]);

  const externalChannels = useMemo(
    () => channels.filter((channel) => channel.id !== 'internal_chat' && getContactChannelHref(channel)),
    [channels],
  );

  const startChat = async (detail?: OpenChatDetail) => {
    setIsBusy(true);
    setError('');
    try {
      const result = await chatGateway({
        action: 'start',
        conversationId: session?.conversationId,
        guestToken: session?.guestToken,
        name: detail?.name || name,
        phone: detail?.phone || phone,
        orderCode: detail?.orderCode || orderCode,
      });
      if (!result.conversation) throw new Error('Không thể khởi tạo cuộc trò chuyện.');
      const nextSession = {
        conversationId: result.conversation.id,
        guestToken: result.guestToken || session?.guestToken,
      };
      setSession(nextSession);
      sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(nextSession));
      setMessages(result.messages);
      if (detail?.message) setDraft(detail.message);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Không thể mở chat.');
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const detail = (event as CustomEvent<OpenChatDetail>).detail;
      setIsOpen(true);
      if (detail?.name) setName(detail.name);
      if (detail?.phone) setPhone(detail.phone);
      if (detail?.orderCode) setOrderCode(detail.orderCode);
      if (detail?.message) setDraft(detail.message);
    };
    window.addEventListener('freshmart:open-chat', handleOpenChat);
    return () => window.removeEventListener('freshmart:open-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (!isOpen || !session) return undefined;
    let cancelled = false;
    const refresh = async () => {
      try {
        const result = await chatGateway({
          action: 'history',
          conversationId: session.conversationId,
          guestToken: session.guestToken,
        });
        if (!cancelled) setMessages(result.messages);
      } catch {
        // Keep the current conversation visible during a temporary network interruption.
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOpen, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleStart = async (event: FormEvent) => {
    event.preventDefault();
    await startChat();
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!session || !message || isBusy) return;
    setIsBusy(true);
    setError('');
    try {
      const result = await chatGateway({
        action: 'send',
        conversationId: session.conversationId,
        guestToken: session.guestToken,
        message,
      });
      if (result.message) setMessages((current) => [...current, result.message!]);
      setDraft('');
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Không thể gửi tin nhắn.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <div id="contact-floating-widget" className="fixed right-3 md:right-5 bottom-20 md:bottom-6 z-[60] flex flex-col items-end gap-3">
        {externalChannels.map((channel, index) => {
          const href = getContactChannelHref(channel);
          const upwardDelay = (externalChannels.length - index - 1) * 70;
          return (
            <a
              key={channel.id}
              href={href}
              target={channel.id === 'phone' ? undefined : '_blank'}
              rel={channel.id === 'phone' ? undefined : 'noopener noreferrer'}
              aria-label={channel.label}
              aria-hidden={!isOpen}
              tabIndex={isOpen ? 0 : -1}
              title={channel.label}
              style={{ transitionDelay: isOpen ? `${upwardDelay}ms` : `${index * 40}ms` }}
              className={`group w-12 h-12 rounded-full text-white ring-8 shadow-lg flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 focus:outline-none focus-visible:ring-4 ${channelStyle[channel.id]} ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-75 pointer-events-none'}`}
            >
              <ChannelIcon type={channel.id} />
              <span className="absolute right-16 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 pointer-events-none transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {channel.label}
              </span>
            </a>
          );
        })}

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls="freshmart-admin-chat-panel"
          aria-label={isOpen ? 'Đóng chat và thu gọn các kênh liên hệ' : 'Mở chat trực tiếp và các kênh liên hệ'}
          className={`w-12 h-12 rounded-full text-white ring-8 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-4 ${channelStyle.internal_chat}`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </button>
      </div>

      {isOpen ? (
        <section
          id="freshmart-admin-chat-panel"
          aria-label="Chat trực tiếp với admin"
          className="fixed z-50 right-[76px] md:right-20 bottom-20 md:bottom-6 w-[calc(100vw-88px)] max-w-[380px] h-[min(580px,calc(100vh-110px))] bg-white border border-slate-200 rounded-[20px] shadow-2xl overflow-hidden flex flex-col animate-fadeIn"
        >
          <header className="bg-[#064E3B] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Chat trực tiếp với Admin</h2>
                <p className="text-[10px] text-emerald-100">Trao đổi ngay trong website FreshMart</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat" className="p-1.5 rounded-lg hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </header>

          {!session ? (
            <form onSubmit={handleStart} className="p-4 flex-1 space-y-4 overflow-y-auto">
              <div className="rounded-[12px] bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                Nhập thông tin để bắt đầu trò chuyện trực tiếp với quản trị viên FreshMart ngay trên website.
              </div>
              <label className="block text-xs font-semibold text-slate-700">
                Họ và tên
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required className="mt-1.5 w-full h-10 rounded-[12px] border border-slate-200 px-3 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Số điện thoại
                <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" required placeholder="09xxxxxxxx" className="mt-1.5 w-full h-10 rounded-[12px] border border-slate-200 px-3 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Mã đơn hàng <span className="font-normal text-slate-400">(nếu có)</span>
                <input value={orderCode} onChange={(event) => setOrderCode(event.target.value)} maxLength={40} className="mt-1.5 w-full h-10 rounded-[12px] border border-slate-200 px-3 font-normal uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              {error ? <p className="text-xs text-rose-600">{error}</p> : null}
              <button disabled={isBusy} className="w-full h-11 rounded-[12px] bg-[#0E7A32] text-white text-sm font-semibold disabled:opacity-60">
                {isBusy ? 'Đang kết nối...' : 'Bắt đầu trò chuyện'}
              </button>
            </form>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-[#F8FAF8] p-3 space-y-2.5" aria-live="polite">
                {messages.map((message) => {
                  const isCustomer = message.senderType === 'customer';
                  const isSystem = message.senderType === 'system';
                  if (isSystem) {
                    return <p key={message.id} className="mx-auto max-w-[90%] text-center text-[11px] leading-4 text-slate-500 py-1">{message.body}</p>;
                  }
                  return (
                    <div key={message.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-[14px] px-3 py-2 text-xs leading-5 ${isCustomer ? 'bg-[#0E7A32] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                        {message.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-3">
                {error ? <p className="mb-2 text-[11px] text-rose-600">{error}</p> : null}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    maxLength={2000}
                    rows={2}
                    placeholder="Nhập tin nhắn..."
                    className="min-h-[42px] max-h-24 flex-1 resize-none rounded-[12px] border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button disabled={!draft.trim() || isBusy} aria-label="Gửi tin nhắn" className="w-10 h-10 rounded-[12px] bg-[#0E7A32] text-white flex items-center justify-center disabled:opacity-40">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      ) : null}
    </>
  );
};
