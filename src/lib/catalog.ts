import { Product } from '../types';

export const PROMOTION_CATEGORY_SLUG = 'khuyen-mai';

export const isPublishedProduct = (product: Product) =>
  product.publicationStatus !== 'draft' && product.publicationStatus !== 'archived';

export const isDiscountedProduct = (product: Product) =>
  isPublishedProduct(product) &&
  product.originalPrice > product.price &&
  product.price >= 0;

export const normalizeCatalogText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .trim();

export const productMatchesSearch = (product: Product, query: string) => {
  const normalizedQuery = normalizeCatalogText(query);
  if (!normalizedQuery) return true;

  return normalizeCatalogText([
    product.name,
    product.sku,
    product.categoryName,
    product.brand || '',
    product.origin,
    ...(product.tags || []),
  ].join(' ')).includes(normalizedQuery);
};
