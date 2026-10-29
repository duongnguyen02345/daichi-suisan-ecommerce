import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);
export const isPaymentsBackendConfigured = isSupabaseConfigured;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const getPaymentsFunctionUrl = (functionName: string) => {
  if (!supabaseUrl) throw new Error('Supabase chưa được cấu hình.');
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`;
};

export const getPaymentsRequestHeaders = (extra?: HeadersInit): HeadersInit => ({
  'Content-Type': 'application/json',
  apikey: publishableKey || '',
  ...extra,
});
