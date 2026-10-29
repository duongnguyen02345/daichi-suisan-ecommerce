import { BankAccount } from '../types';

const normalizeTransferReference = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, 50);

export const buildVietQrUrl = (
  bankAccount: BankAccount,
  amount: number,
  transferReference: string,
) => {
  const accountNumber = bankAccount.accountNumber.replace(/\s+/g, '');
  const reference = normalizeTransferReference(transferReference);
  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(amount))),
    addInfo: reference,
    accountName: bankAccount.accountName.trim(),
  });

  return `https://img.vietqr.io/image/${encodeURIComponent(bankAccount.bankId)}-${encodeURIComponent(accountNumber)}-compact2.png?${params.toString()}`;
};

export const createOrderCode = () => {
  const now = new Date();
  const date = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FM${date}${random}`;
};
