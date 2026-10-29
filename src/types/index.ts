export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  vatRate?: number;
  vatCalculation?: 'exclusive' | 'inclusive';
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  soldCount?: string;
  image: string;
  gallery: string[];
  category: string; // e.g. 'rau-cu-qua'
  categoryName: string;
  subcategory?: string;
  unit: string;
  origin: string;
  storage: string;
  expiry: string;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'temporarily_unavailable';
  publicationStatus?: 'draft' | 'published' | 'archived';
  lowStockThreshold?: number;
  temporarilyUnavailable?: boolean;
  isOrganic?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  brand?: string;
  tags?: string[];
  description?: string;
  benefits?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  count: number;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
}

export interface UserAddress {
  id: string;
  label: string;
  isDefault: boolean;
  recipientName: string;
  phone: string;
  address: string;
}

export interface BankAccount {
  id: string;
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
  updatedAt: string;
}

export interface DeliveryLocation {
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  accuracyMeters?: number;
  source: 'saved' | 'gps' | 'autocomplete' | 'manual';
}

export type PaymentMethod = 'cod' | 'bank_transfer' | 'card';
export type PaymentStatus =
  | 'cash_on_delivery'
  | 'awaiting_confirmation'
  | 'customer_reported'
  | 'paid'
  | 'review_required'
  | 'failed'
  | 'expired'
  | 'refunded';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'customer' | 'admin';
  memberTier: string;
  addresses: UserAddress[];
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  netSubtotal?: number;
  vatTotal?: number;
  discount: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  status: 'awaiting_payment' | 'pending' | 'shipping' | 'delivered' | 'returned' | 'cancelled';
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transferReference?: string;
  qrUrl?: string;
  paymentAccessToken?: string;
  paymentExpiresAt?: string;
  paymentReportedAt?: string;
  paymentProvider?: 'sepay';
  providerTransactionId?: string;
  recipientName: string;
  phone: string;
  email?: string;
  address: string;
  deliveryMode?: 'immediate' | 'scheduled';
  deliveryDate: string;
  deliveryTimeSlot: string;
  note?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  gallery?: string[];
  ctaText: string;
  ctaLink: string;
  badge?: string;
  colorScheme?: 'green' | 'orange' | 'red';
  active: boolean;
  mobileImage?: string;
  placement?: 'home_hero' | 'home_secondary' | 'home_footer' | 'about_hero' | 'about_digital' | 'category' | 'checkout';
  sortOrder?: number;
  publicationStatus?: 'draft' | 'scheduled' | 'published' | 'archived';
  startsAt?: string;
  endsAt?: string;
}

export interface Promotion {
  id: string;
  title: string;
  code: string;
  discountAmount?: number;
  discountPercent?: number;
  minOrder: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'archived';
  description?: string;
  discountType?: 'fixed' | 'percentage' | 'free_shipping';
  maxDiscount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  usageCount?: number;
  stackable?: boolean;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  coverType: 'image' | 'video';
  category: string;
  publicationStatus: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteProfile {
  id: 'primary';
  brandName: string;
  legalName: string;
  tagline: string;
  companyDescription: string;
  taxCode: string;
  hotline: string;
  supportLabel: string;
  email: string;
  address: string;
  businessHours: string;
  logoUrl: string;
  faviconUrl: string;
  copyrightText: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaAsset {
  id: string;
  bucketId: string;
  objectPath: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  altText: string;
  uploadedBy?: string;
  archivedAt?: string;
  createdAt: string;
}

export type ContactChannelType = 'phone' | 'zalo' | 'facebook' | 'internal_chat';

export interface ContactChannel {
  id: ContactChannelType;
  label: string;
  contactValue: string;
  targetUrl: string;
  isActive: boolean;
  sortOrder: number;
  availableFrom?: string;
  availableTo?: string;
}

export type ChatConversationStatus =
  | 'open'
  | 'waiting_admin'
  | 'waiting_customer'
  | 'resolved'
  | 'spam';

export interface ChatConversation {
  id: string;
  customerId?: string;
  guestName: string;
  guestPhone: string;
  orderCode?: string;
  status: ChatConversationStatus;
  assignedAdminId?: string;
  lastMessageAt: string;
  customerLastReadAt?: string;
  adminLastReadAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'admin' | 'system';
  senderUserId?: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

export interface FilterState {
  category: string;
  priceRange: string;
  brands: string[];
  certifications: string[];
  deals: string[];
  rating: number;
  search: string;
  sortBy: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating_desc';
  viewMode: 'grid' | 'list';
  cardSize?: 'large' | 'medium' | 'small';
}

export type PublicationStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface PageSection {
  id: string;
  pageKey: string;
  sectionKey: string;
  title: string;
  subtitle: string;
  body: Record<string, any>;
  mediaAssetId?: string;
  ctaText: string;
  ctaLink: string;
  sortOrder: number;
  isVisible: boolean;
  publicationStatus: PublicationStatus;
  publishedAt?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MenuLocation = 'header' | 'footer' | 'footer_quick_links' | 'footer_policy' | 'mobile';

export interface SiteNavigationItem {
  id: string;
  menuLocation: MenuLocation;
  label: string;
  url: string;
  sortOrder: number;
  isExternal: boolean;
  openInNewTab: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSeoSetting {
  id: string;
  pagePath: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  keywords: string;
  isIndexable: boolean;
  updatedAt?: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'hidden' | 'spam';

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  status: ReviewStatus;
  adminReply?: string;
  adminRepliedAt?: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: number | string;
  adminUserId?: string;
  adminEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  createdAt: string;
}

