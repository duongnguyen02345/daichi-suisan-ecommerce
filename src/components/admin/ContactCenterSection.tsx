import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  loadAdminContactChannels,
  loadAdminConversations,
  loadAdminMessages,
  saveAdminContactChannel,
  sendAdminChatMessage,
  updateAdminConversation,
} from '../../lib/contactApi';
import { supabase } from '../../lib/supabase';
import { ChatConversation, ChatConversationStatus, ChatMessage, ContactChannel } from '../../types';

const statusLabels: Record<ChatConversationStatus, string> = {
  open: 'Đang xử lý',
  waiting_admin: 'Chờ admin',
  waiting_customer: 'Chờ khách',
  resolved: 'Đã giải quyết',
  spam: 'Spam',
};

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));

const isUnread = (conversation: ChatConversation) => !conversation.adminLastReadAt
  || new Date(conversation.lastMessageAt).getTime() > new Date(conversation.adminLastReadAt).getTime();

export const ContactCenterSection: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox');
  const [channels, setChannels] = useState<ContactChannel[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filter, setFilter] = useState<'all' | ChatConversationStatus>('all');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refreshConversations = useCallback(async () => {
    try {
      const data = await loadAdminConversations();
      setConversations(data);
      setSelectedId((current) => current || data[0]?.id || '');
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải hộp thư.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    try {
      const data = await loadAdminMessages(conversationId);
      setMessages(data);
      const readAt = new Date().toISOString();
      await updateAdminConversation(conversationId, { adminLastReadAt: readAt });
      setConversations((current) => current.map((item) => (
        item.id === conversationId ? { ...item, adminLastReadAt: readAt } : item
      )));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải tin nhắn.');
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
    void loadAdminContactChannels().then(setChannels).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải cấu hình liên hệ.');
    });
  }, [refreshConversations]);

  useEffect(() => {
    if (selectedId) void refreshMessages(selectedId);
  }, [selectedId, refreshMessages]);

  useEffect(() => {
    const client = supabase;
    if (!client) return undefined;
    const channel = client
      .channel('freshmart-admin-contact-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        void refreshConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const row = payload.new as { conversation_id?: string };
        void refreshConversations();
        if (row.conversation_id === selectedId) void refreshMessages(selectedId);
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [refreshConversations, refreshMessages, selectedId]);

  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const unreadCount = conversations.filter(isUnread).length;
  const visibleConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesFilter = filter === 'all' || conversation.status === filter;
      const matchesSearch = !keyword || [
        conversation.guestName,
        conversation.guestPhone,
        conversation.orderCode || '',
      ].some((value) => value.toLowerCase().includes(keyword));
      return matchesFilter && matchesSearch;
    });
  }, [conversations, filter, search]);

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !user || !reply.trim() || isSaving) return;
    setIsSaving(true);
    setError('');
    try {
      const message = await sendAdminChatMessage(selected.id, user.id, reply);
      setMessages((current) => [...current, message]);
      setReply('');
      await updateAdminConversation(selected.id, {
        assignedAdminId: selected.assignedAdminId || user.id,
        adminLastReadAt: new Date().toISOString(),
      });
      await refreshConversations();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.');
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (status: ChatConversationStatus) => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await updateAdminConversation(selected.id, {
        status,
        assignedAdminId: selected.assignedAdminId || user?.id,
      });
      await refreshConversations();
      setNotice(`Đã chuyển trạng thái: ${statusLabels[status]}.`);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Không thể đổi trạng thái.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveChannels = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      for (const channel of channels) {
        if (channel.isActive && channel.id !== 'internal_chat' && !channel.targetUrl && !channel.contactValue) {
          throw new Error(`${channel.label} đang bật nhưng chưa có thông tin liên hệ.`);
        }
        await saveAdminContactChannel(channel);
      }
      setChannels(await loadAdminContactChannels());
      setNotice('Đã lưu cấu hình liên hệ trên website.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[12px] border border-slate-200 bg-white p-1">
          <button type="button" onClick={() => setTab('inbox')} className={`h-9 px-4 rounded-[9px] text-xs font-semibold flex items-center gap-2 ${tab === 'inbox' ? 'bg-[#0E7A32] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <MessageCircle className="w-4 h-4" />Hộp thư {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
          <button type="button" onClick={() => setTab('settings')} className={`h-9 px-4 rounded-[9px] text-xs font-semibold flex items-center gap-2 ${tab === 'settings' ? 'bg-[#0E7A32] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Settings2 className="w-4 h-4" />Kênh liên hệ
          </button>
        </div>
        <button type="button" onClick={() => void refreshConversations()} className="h-10 px-3 rounded-[12px] border border-slate-200 bg-white text-xs font-semibold text-slate-600 flex items-center gap-2 hover:border-emerald-300">
          <RefreshCw className="w-4 h-4" />Làm mới
        </button>
      </div>

      {notice ? <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{notice}</div> : null}
      {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div> : null}

      {tab === 'settings' ? (
        <section className="bg-white border border-slate-200 rounded-[16px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Kênh liên hệ hiển thị trên website</h2>
            <p className="text-xs text-slate-500 mt-1">Chat trực tiếp với admin luôn hiển thị; các kênh còn lại chỉ xuất hiện khi được bật và có thông tin hợp lệ.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {channels.map((channel, index) => (
              <div key={channel.id} className="p-5 grid lg:grid-cols-[170px_1fr_1.2fr_92px] gap-3 items-end">
                <div>
                  <div className="flex items-center gap-2 mb-2"><span className="w-8 h-8 rounded-[10px] bg-emerald-50 text-[#0E7A32] flex items-center justify-center">{channel.id === 'phone' ? <Phone className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}</span><strong className="text-sm text-slate-800">{channel.label}</strong></div>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={channel.id === 'internal_chat' ? true : channel.isActive} disabled={channel.id === 'internal_chat'} onChange={(event) => setChannels((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item))} className="w-4 h-4 rounded accent-emerald-700 disabled:opacity-60" />{channel.id === 'internal_chat' ? 'Luôn hiển thị' : 'Hiển thị'}</label>
                </div>
                <label className="text-xs font-semibold text-slate-600">Thông tin hiển thị<input value={channel.contactValue} disabled={channel.id === 'internal_chat'} onChange={(event) => setChannels((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, contactValue: event.target.value } : item))} placeholder={channel.id === 'phone' ? 'Ví dụ: 0901 234 567' : channel.id === 'zalo' ? 'Số Zalo hoặc tên OA' : 'Tên trang Facebook'} className="mt-1.5 w-full h-10 rounded-[12px] border border-slate-200 px-3 font-normal disabled:bg-slate-50" /></label>
                <label className="text-xs font-semibold text-slate-600">Đường dẫn mở nhanh<input value={channel.targetUrl} disabled={channel.id === 'internal_chat'} onChange={(event) => setChannels((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, targetUrl: event.target.value } : item))} placeholder={channel.id === 'phone' ? 'Để trống để dùng số điện thoại' : 'https://...'} className="mt-1.5 w-full h-10 rounded-[12px] border border-slate-200 px-3 font-normal disabled:bg-slate-50" /></label>
                <label className="text-xs font-semibold text-slate-600">Thứ tự<input type="number" min={0} max={100} value={channel.sortOrder} onChange={(event) => setChannels((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, sortOrder: Number(event.target.value) } : item))} className="mt-1.5 w-full h-10 rounded-[12px] border border-slate-200 px-3 font-normal" /></label>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button type="button" disabled={isSaving} onClick={() => void saveChannels()} className="h-10 px-5 rounded-[12px] bg-[#0E7A32] text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-60"><Save className="w-4 h-4" />{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</button>
          </div>
        </section>
      ) : (
        <section className="bg-white border border-slate-200 rounded-[16px] overflow-hidden min-h-[620px] grid lg:grid-cols-[330px_1fr]">
          <aside className="border-r border-slate-200 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative"><Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, số điện thoại, mã đơn..." className="w-full h-10 rounded-[12px] border border-slate-200 pl-9 pr-3 text-xs" /></div>
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="w-full h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-xs"><option value="all">Tất cả hội thoại</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {isLoading ? <p className="p-4 text-xs text-slate-500">Đang tải hộp thư...</p> : null}
              {!isLoading && visibleConversations.length === 0 ? <p className="p-5 text-center text-xs text-slate-500">Chưa có hội thoại phù hợp.</p> : null}
              {visibleConversations.map((conversation) => (
                <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`w-full p-4 text-left hover:bg-emerald-50/60 transition ${selectedId === conversation.id ? 'bg-emerald-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2"><strong className="text-sm text-slate-900 truncate">{conversation.guestName || 'Khách hàng'}</strong><span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDateTime(conversation.lastMessageAt)}</span></div>
                  <div className="mt-1 flex items-center justify-between gap-2"><span className="text-xs text-slate-500 truncate">{conversation.guestPhone || conversation.orderCode || 'Khách đã đăng nhập'}</span>{isUnread(conversation) ? <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /> : null}</div>
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{statusLabels[conversation.status]}</span>
                </button>
              ))}
            </div>
          </aside>

          {selected ? (
            <div className="min-w-0 flex flex-col">
              <header className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-emerald-100 text-[#0E7A32] flex items-center justify-center"><UserRound className="w-5 h-5" /></span><div><h3 className="text-sm font-bold text-slate-900">{selected.guestName || 'Khách hàng'}</h3><p className="text-xs text-slate-500">{selected.guestPhone || 'Tài khoản thành viên'}{selected.orderCode ? ` · Đơn ${selected.orderCode}` : ''}</p></div></div>
                <div className="flex items-center gap-2"><select value={selected.status} disabled={isSaving} onChange={(event) => void changeStatus(event.target.value as ChatConversationStatus)} className="h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-xs font-semibold">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{selected.guestPhone ? <a href={`tel:${selected.guestPhone}`} title="Gọi khách hàng" className="w-9 h-9 rounded-[10px] border border-slate-200 flex items-center justify-center text-slate-600 hover:text-emerald-700"><Phone className="w-4 h-4" /></a> : null}{selected.orderCode ? <button type="button" title="Mã đơn hàng liên quan" className="w-9 h-9 rounded-[10px] border border-slate-200 flex items-center justify-center text-slate-600"><ExternalLink className="w-4 h-4" /></button> : null}</div>
              </header>
              <div className="flex-1 overflow-y-auto bg-[#F8FAF8] p-4 space-y-3">
                {messages.map((message) => message.senderType === 'system' ? <p key={message.id} className="text-center text-[11px] text-slate-400">{message.body}</p> : <div key={message.id} className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] rounded-[14px] px-3 py-2 ${message.senderType === 'admin' ? 'bg-[#0E7A32] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}><p className="text-xs leading-5 whitespace-pre-wrap">{message.body}</p><p className={`text-[9px] mt-1 ${message.senderType === 'admin' ? 'text-emerald-100' : 'text-slate-400'}`}>{formatDateTime(message.createdAt)}</p></div></div>)}
              </div>
              {selected.status === 'resolved' || selected.status === 'spam' ? (
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Cuộc trò chuyện đã đóng.</p><button type="button" onClick={() => void changeStatus('open')} className="h-9 px-3 rounded-[10px] bg-white border border-slate-200 text-xs font-semibold">Mở lại</button></div>
              ) : (
                <form onSubmit={handleReply} className="p-3 border-t border-slate-200 flex items-end gap-2"><textarea value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={2000} rows={2} placeholder="Nhập nội dung trả lời..." className="flex-1 resize-none rounded-[12px] border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" /><button disabled={!reply.trim() || isSaving} className="h-10 px-4 rounded-[12px] bg-[#0E7A32] text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40"><Send className="w-4 h-4" />Gửi</button></form>
              )}
              <div className="px-4 pb-3 flex justify-end gap-2 bg-white"><button type="button" onClick={() => void changeStatus('resolved')} className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Đã giải quyết</button><button type="button" onClick={() => void changeStatus('spam')} className="text-[11px] font-semibold text-rose-600 flex items-center gap-1"><Ban className="w-3.5 h-3.5" />Đánh dấu spam</button></div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-center"><div><MessageCircle className="w-10 h-10 text-slate-300 mx-auto" /><p className="mt-3 text-sm font-semibold text-slate-700">Chọn một cuộc trò chuyện</p><p className="text-xs text-slate-400 mt-1">Tin nhắn của khách sẽ xuất hiện tại đây.</p></div></div>
          )}
        </section>
      )}
    </div>
  );
};
