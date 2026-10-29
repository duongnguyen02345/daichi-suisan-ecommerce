import { constantTimeEqual, handleOptions, jsonResponse, sha256 } from '../_shared/http.ts';
import {
  adminRestFetch,
  getSupabaseUrl,
  isKnownPublicKey,
  readRestResponse,
} from '../_shared/supabase-rest.ts';

type ChatAction = 'start' | 'history' | 'send';

interface ChatRequestBody {
  action?: ChatAction;
  conversationId?: string;
  guestToken?: string;
  name?: string;
  phone?: string;
  orderCode?: string;
  message?: string;
  website?: string;
}

interface AuthenticatedCustomer {
  id: string;
  name: string;
  phone: string;
}

interface ConversationRow {
  id: string;
  customer_id: string | null;
  guest_token_hash: string | null;
  guest_name: string;
  guest_phone: string;
  order_code: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
}

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const normalizePhone = (value: string) => {
  const compact = value.trim().replace(/[\s().-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
};

const isValidVietnamPhone = (value: string) => /^0\d{9,10}$/.test(value);
const encodeFilter = (value: string) => encodeURIComponent(value);

const getAuthenticatedCustomer = async (request: Request): Promise<AuthenticatedCustomer | null> => {
  const authorization = request.headers.get('authorization') || '';
  const apiKey = request.headers.get('apikey') || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) return null;

  const token = authorization.slice(7).trim();
  if (!token || constantTimeEqual(token, apiKey)) return null;

  const response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: apiKey },
  });
  if (!response.ok) return null;
  const user = await response.json() as Record<string, unknown>;
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  return {
    id: String(user.id || ''),
    name: String(metadata.full_name || metadata.name || ''),
    phone: String(user.phone || metadata.phone || ''),
  };
};

const checkRateLimit = async (request: Request) => {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const rateKey = await sha256(`freshmart-chat:${ip}`);
  const response = await adminRestFetch('rpc/consume_freshmart_chat_rate_limit', {
    method: 'POST',
    body: JSON.stringify({ p_rate_key: rateKey, p_limit: 30, p_window_seconds: 60 }),
  });
  return readRestResponse<boolean>(response);
};

const loadMessages = async (conversationId: string) => {
  const response = await adminRestFetch(
    `chat_messages?conversation_id=eq.${encodeFilter(conversationId)}`
      + '&select=id,conversation_id,sender_type,sender_user_id,body,read_at,created_at'
      + '&order=created_at.asc,id.asc&limit=200',
  );
  return readRestResponse<Array<Record<string, unknown>>>(response);
};

const findConversation = async (
  body: ChatRequestBody,
  customer: AuthenticatedCustomer | null,
): Promise<ConversationRow | null> => {
  if (!body.conversationId) return null;
  const response = await adminRestFetch(
    `chat_conversations?id=eq.${encodeFilter(body.conversationId)}`
      + '&select=id,customer_id,guest_token_hash,guest_name,guest_phone,order_code,status,last_message_at,created_at&limit=1',
  );
  const rows = await readRestResponse<ConversationRow[]>(response);
  const conversation = rows[0];
  if (!conversation) return null;
  if (customer?.id && conversation.customer_id === customer.id) return conversation;
  if (!body.guestToken || !conversation.guest_token_hash) return null;
  const suppliedHash = await sha256(body.guestToken);
  return constantTimeEqual(suppliedHash, conversation.guest_token_hash) ? conversation : null;
};

const markCustomerRead = async (conversationId: string) => {
  await adminRestFetch(`chat_conversations?id=eq.${encodeFilter(conversationId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ customer_last_read_at: new Date().toISOString() }),
  });
};

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Method not allowed' }, 405);
  if (!isKnownPublicKey(request)) return jsonResponse(request, { error: 'API key không hợp lệ' }, 401);

  try {
    if (!await checkRateLimit(request)) {
      return jsonResponse(request, { error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.' }, 429);
    }

    const body = await request.json() as ChatRequestBody;
    // Honeypot: legitimate clients never populate this field.
    if (body.website) return jsonResponse(request, { error: 'Yêu cầu không hợp lệ.' }, 400);
    const customer = await getAuthenticatedCustomer(request);

    if (body.action === 'start') {
      let conversation = await findConversation(body, customer);
      let issuedGuestToken = '';

      if (!conversation && customer?.id) {
        const existingResponse = await adminRestFetch(
          `chat_conversations?customer_id=eq.${encodeFilter(customer.id)}`
            + '&status=not.in.(resolved,spam)'
            + '&select=id,customer_id,guest_token_hash,guest_name,guest_phone,order_code,status,last_message_at,created_at'
            + '&order=last_message_at.desc&limit=1',
        );
        conversation = (await readRestResponse<ConversationRow[]>(existingResponse))[0] || null;
      }

      const name = (body.name || customer?.name || '').trim();
      const phone = normalizePhone(body.phone || customer?.phone || '');
      if (!conversation && (name.length < 2 || name.length > 80 || !isValidVietnamPhone(phone))) {
        return jsonResponse(request, { error: 'Vui lòng nhập họ tên và số điện thoại hợp lệ để bắt đầu chat.' }, 400);
      }

      if (!conversation) {
        issuedGuestToken = customer?.id ? '' : randomToken();
        const insertResponse = await adminRestFetch('chat_conversations?select=*', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            customer_id: customer?.id || null,
            guest_token_hash: issuedGuestToken ? await sha256(issuedGuestToken) : null,
            guest_name: name,
            guest_phone: phone,
            order_code: body.orderCode?.trim().slice(0, 40) || null,
          }),
        });
        conversation = (await readRestResponse<ConversationRow[]>(insertResponse))[0];

        await adminRestFetch('chat_messages', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            conversation_id: conversation.id,
            sender_type: 'system',
            body: 'Xin chào! Bạn đang chat trực tiếp với quản trị viên FreshMart ngay trên website. Admin sẽ phản hồi bạn sớm nhất có thể.',
          }),
        });
      }

      const messages = await loadMessages(conversation.id);
      await markCustomerRead(conversation.id);
      return jsonResponse(request, {
        conversation,
        messages,
        guestToken: issuedGuestToken || undefined,
      });
    }

    const conversation = await findConversation(body, customer);
    if (!conversation) return jsonResponse(request, { error: 'Phiên chat không hợp lệ hoặc đã hết hạn.' }, 403);

    if (body.action === 'history') {
      const messages = await loadMessages(conversation.id);
      await markCustomerRead(conversation.id);
      return jsonResponse(request, { conversation, messages });
    }

    if (body.action === 'send') {
      if (['resolved', 'spam'].includes(conversation.status)) {
        return jsonResponse(request, { error: 'Cuộc trò chuyện này đã đóng.' }, 409);
      }
      const message = body.message?.trim() || '';
      if (!message || message.length > 2000) {
        return jsonResponse(request, { error: 'Tin nhắn phải có từ 1 đến 2.000 ký tự.' }, 400);
      }
      const insertResponse = await adminRestFetch('chat_messages?select=*', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_type: 'customer',
          sender_user_id: customer?.id || null,
          body: message,
        }),
      });
      const messages = await readRestResponse<Array<Record<string, unknown>>>(insertResponse);
      return jsonResponse(request, { message: messages[0] }, 201);
    }

    return jsonResponse(request, { error: 'Hành động chat không hợp lệ.' }, 400);
  } catch (error) {
    console.error('chat-gateway failed', error);
    return jsonResponse(request, {
      error: error instanceof Error ? error.message : 'Không thể xử lý yêu cầu chat.',
    }, 500);
  }
});
