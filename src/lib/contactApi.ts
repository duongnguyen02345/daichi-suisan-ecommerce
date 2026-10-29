import {
  ChatConversation,
  ChatConversationStatus,
  ChatMessage,
  ContactChannel,
} from '../types';
import { getPaymentsFunctionUrl, getPaymentsRequestHeaders, isSupabaseConfigured, supabase } from './supabase';

type ContactChannelRow = {
  id: ContactChannel['id'];
  label: string;
  contact_value: string;
  target_url: string;
  is_active: boolean;
  sort_order: number;
  available_from: string | null;
  available_to: string | null;
};

type ConversationRow = {
  id: string;
  customer_id: string | null;
  guest_name: string;
  guest_phone: string;
  order_code: string | null;
  status: ChatConversationStatus;
  assigned_admin_id: string | null;
  last_message_at: string;
  customer_last_read_at: string | null;
  admin_last_read_at: string | null;
  created_at: string;
};

type MessageRow = {
  id: string | number;
  conversation_id: string;
  sender_type: ChatMessage['senderType'];
  sender_user_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

const mapChannel = (row: ContactChannelRow): ContactChannel => ({
  id: row.id,
  label: row.label,
  contactValue: row.contact_value,
  targetUrl: row.target_url,
  isActive: row.is_active,
  sortOrder: row.sort_order,
  availableFrom: row.available_from || undefined,
  availableTo: row.available_to || undefined,
});

const mapConversation = (row: ConversationRow): ChatConversation => ({
  id: row.id,
  customerId: row.customer_id || undefined,
  guestName: row.guest_name,
  guestPhone: row.guest_phone,
  orderCode: row.order_code || undefined,
  status: row.status,
  assignedAdminId: row.assigned_admin_id || undefined,
  lastMessageAt: row.last_message_at,
  customerLastReadAt: row.customer_last_read_at || undefined,
  adminLastReadAt: row.admin_last_read_at || undefined,
  createdAt: row.created_at,
});

const mapMessage = (row: MessageRow): ChatMessage => ({
  id: String(row.id),
  conversationId: row.conversation_id,
  senderType: row.sender_type,
  senderUserId: row.sender_user_id || undefined,
  body: row.body,
  readAt: row.read_at || undefined,
  createdAt: row.created_at,
});

const fallbackChannels: ContactChannel[] = [
  {
    id: 'internal_chat',
    label: 'Chat trực tiếp với admin',
    contactValue: 'Trao đổi ngay trên website',
    targetUrl: '',
    isActive: true,
    sortOrder: 40,
  },
];

export const getContactChannelHref = (channel: ContactChannel) => {
  if (channel.id === 'phone' && !channel.targetUrl && channel.contactValue) {
    return `tel:${channel.contactValue.replace(/[^+\d]/g, '')}`;
  }
  if (!channel.targetUrl) return '';
  try {
    const url = new URL(channel.targetUrl);
    return ['https:', 'http:', 'tel:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

export const loadPublicContactChannels = async () => {
  if (!supabase) return fallbackChannels;
  const { data, error } = await supabase
    .from('contact_channels')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) return fallbackChannels;
  const channels = (data as ContactChannelRow[]).map(mapChannel);
  const configuredInternalChat = channels.find((channel) => channel.id === 'internal_chat');
  const internalChat: ContactChannel = {
    ...fallbackChannels[0],
    ...configuredInternalChat,
    isActive: true,
    targetUrl: '',
  };
  return [
    ...channels.filter((channel) => channel.id !== 'internal_chat'),
    internalChat,
  ].sort((left, right) => left.sortOrder - right.sortOrder);
};

export const loadAdminContactChannels = async () => {
  if (!supabase) return fallbackChannels;
  const { data, error } = await supabase.from('contact_channels').select('*').order('sort_order');
  if (error) throw error;
  return (data as ContactChannelRow[]).map(mapChannel);
};

export const saveAdminContactChannel = async (channel: ContactChannel) => {
  if (!supabase) return channel;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Phiên quản trị đã hết hạn.');
  if (channel.targetUrl && !getContactChannelHref(channel)) {
    throw new Error(`Đường dẫn của ${channel.label} phải bắt đầu bằng https://, http:// hoặc tel:.`);
  }
  const { data, error } = await supabase
    .from('contact_channels')
    .update({
      label: channel.label.trim(),
      contact_value: channel.contactValue.trim(),
      target_url: channel.targetUrl.trim(),
      is_active: channel.id === 'internal_chat' ? true : channel.isActive,
      sort_order: channel.sortOrder,
      available_from: channel.availableFrom || null,
      available_to: channel.availableTo || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', channel.id)
    .select('*')
    .single();
  if (error) throw error;
  return mapChannel(data as ContactChannelRow);
};

const functionHeaders = async () => {
  const { data } = await supabase?.auth.getSession() || { data: { session: null } };
  return getPaymentsRequestHeaders(data.session?.access_token
    ? { Authorization: `Bearer ${data.session.access_token}` }
    : undefined);
};

const readResponse = async <T,>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Không thể kết nối trung tâm hỗ trợ.');
  return payload as T;
};

interface GatewayResponse {
  conversation: ConversationRow;
  messages: MessageRow[];
  guestToken?: string;
  message?: MessageRow;
}

export const chatGateway = async (body: Record<string, unknown>) => {
  if (!isSupabaseConfigured) throw new Error('Trung tâm hỗ trợ chưa được kết nối.');
  const response = await fetch(getPaymentsFunctionUrl('chat-gateway'), {
    method: 'POST',
    headers: await functionHeaders(),
    body: JSON.stringify(body),
  });
  const result = await readResponse<GatewayResponse>(response);
  return {
    conversation: result.conversation ? mapConversation(result.conversation) : undefined,
    messages: (result.messages || []).map(mapMessage),
    guestToken: result.guestToken,
    message: result.message ? mapMessage(result.message) : undefined,
  };
};

export const loadAdminConversations = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .order('last_message_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as ConversationRow[]).map(mapConversation);
};

export const loadAdminMessages = async (conversationId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at')
    .limit(300);
  if (error) throw error;
  return (data as MessageRow[]).map(mapMessage);
};

export const sendAdminChatMessage = async (
  conversationId: string,
  adminId: string,
  body: string,
) => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'admin',
      sender_user_id: adminId,
      body: body.trim(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapMessage(data as MessageRow);
};

export const updateAdminConversation = async (
  conversationId: string,
  fields: Partial<Pick<ChatConversation, 'status' | 'assignedAdminId' | 'adminLastReadAt'>>,
) => {
  if (!supabase) return;
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.status) payload.status = fields.status;
  if (fields.assignedAdminId !== undefined) payload.assigned_admin_id = fields.assignedAdminId || null;
  if (fields.adminLastReadAt !== undefined) payload.admin_last_read_at = fields.adminLastReadAt || null;
  const { error } = await supabase.from('chat_conversations').update(payload).eq('id', conversationId);
  if (error) throw error;
};
