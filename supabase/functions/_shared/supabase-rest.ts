const parseDefaultKey = (value?: string) => {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value) as Record<string, string>;
    return parsed.default || Object.values(parsed)[0] || '';
  } catch {
    return value;
  }
};

export const getSupabaseUrl = () => {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('Thiếu SUPABASE_URL');
  return url.replace(/\/$/, '');
};

export const getAdminKey = () => {
  const modern = parseDefaultKey(Deno.env.get('SUPABASE_SECRET_KEYS'));
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const key = modern || legacy;
  if (!key) throw new Error('Thiếu Supabase secret key');
  return key;
};

export const getPublishableKeys = () => {
  const value = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  let keys: string[] = [];
  if (value) {
    try {
      keys = Object.values(JSON.parse(value) as Record<string, string>);
    } catch {
      keys = [value];
    }
  }
  const legacy = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacy) keys.push(legacy);
  return keys.filter(Boolean);
};

export const isKnownPublicKey = (request: Request) => {
  const supplied = request.headers.get('apikey') || '';
  return getPublishableKeys().includes(supplied);
};

export const adminRestFetch = async (path: string, init: RequestInit = {}) => {
  const key = getAdminKey();
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  headers.set('Content-Type', 'application/json');
  if (!key.startsWith('sb_secret_')) headers.set('Authorization', `Bearer ${key}`);
  return fetch(`${getSupabaseUrl()}/rest/v1/${path.replace(/^\//, '')}`, { ...init, headers });
};

export const readRestResponse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message || payload.error_description || payload.hint || 'Lỗi database';
    throw new Error(message);
  }
  return payload as T;
};
