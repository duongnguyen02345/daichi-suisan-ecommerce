import { BankAccount } from '../types';
import {
  getPaymentsFunctionUrl,
  getPaymentsRequestHeaders,
  isPaymentsBackendConfigured,
} from './supabase';

const readResponse = async <T,>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Không thể lưu cấu hình ngân hàng.');
  return payload as T;
};

export const getRemoteBankAccount = async () => {
  if (!isPaymentsBackendConfigured) return null;
  const response = await fetch(getPaymentsFunctionUrl('bank-settings'), {
    headers: getPaymentsRequestHeaders(),
  });
  const payload = await readResponse<{ bankAccount: BankAccount | null }>(response);
  return payload.bankAccount;
};

export const saveRemoteBankAccount = async (
  account: Omit<BankAccount, 'id' | 'updatedAt'>,
  adminKey: string,
) => {
  if (!isPaymentsBackendConfigured) return null;
  const response = await fetch(getPaymentsFunctionUrl('bank-settings'), {
    method: 'PUT',
    headers: getPaymentsRequestHeaders({ 'X-Admin-Key': adminKey }),
    body: JSON.stringify(account),
  });
  return readResponse<{ bankAccount: BankAccount }>(response);
};
