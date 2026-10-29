import { Product } from '../types';

export type VatCalculation = 'exclusive' | 'inclusive';

export interface VatBreakdown {
  netPrice: number;
  vatAmount: number;
  grossPrice: number;
}

const normalizeMoney = (value: number) => Math.max(0, Math.round(Number(value) || 0));

export const normalizeVatRate = (value: number | undefined) =>
  Math.min(100, Math.max(0, Number(value) || 0));

export const getVatBreakdown = (
  price: number,
  vatRate = 0,
  calculation: VatCalculation = 'inclusive',
): VatBreakdown => {
  const normalizedPrice = normalizeMoney(price);
  const normalizedRate = normalizeVatRate(vatRate);

  if (normalizedRate === 0) {
    return { netPrice: normalizedPrice, vatAmount: 0, grossPrice: normalizedPrice };
  }

  if (calculation === 'exclusive') {
    const vatAmount = Math.round(normalizedPrice * normalizedRate / 100);
    return {
      netPrice: normalizedPrice,
      vatAmount,
      grossPrice: normalizedPrice + vatAmount,
    };
  }

  const netPrice = Math.round(normalizedPrice * 100 / (100 + normalizedRate));
  return {
    netPrice,
    vatAmount: normalizedPrice - netPrice,
    grossPrice: normalizedPrice,
  };
};

export const getProductVatBreakdown = (product: Product, price = product.price) =>
  getVatBreakdown(price, product.vatRate, product.vatCalculation);
