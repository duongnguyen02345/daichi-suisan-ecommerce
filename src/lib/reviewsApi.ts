import { supabase } from './supabase';
import { ProductReview, ReviewStatus } from '../types';

interface ReviewDbRow {
  id: string;
  product_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string;
  rating: number;
  title?: string;
  comment: string;
  status: string;
  admin_reply?: string;
  admin_replied_at?: string | null;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  catalog_products?: {
    name: string;
    image_url?: string;
  } | null;
}

const mapRowToReview = (row: ReviewDbRow): ProductReview => ({
  id: row.id,
  productId: row.product_id,
  productName: row.catalog_products?.name || 'Sản phẩm',
  productImage: row.catalog_products?.image_url || '',
  customerId: row.customer_id || undefined,
  customerName: row.customer_name || 'Khách hàng',
  customerEmail: row.customer_email || '',
  rating: Number(row.rating) || 5,
  title: row.title || '',
  comment: row.comment || '',
  status: (row.status as ReviewStatus) || 'approved',
  adminReply: row.admin_reply || undefined,
  adminRepliedAt: row.admin_replied_at || undefined,
  verifiedPurchase: Boolean(row.verified_purchase),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const fetchReviews = async (): Promise<ProductReview[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      *,
      catalog_products:product_id (
        name,
        image_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Tải danh sách đánh giá thất bại: ${error.message}`);
  }

  return (data || []).map((r: any) => mapRowToReview(r as ReviewDbRow));
};

export const updateReviewStatus = async (
  reviewId: string,
  status: ReviewStatus
): Promise<void> => {
  if (!supabase) throw new Error('Supabase chưa cấu hình.');

  const { error } = await supabase
    .from('product_reviews')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    throw new Error(`Cập nhật trạng thái đánh giá thất bại: ${error.message}`);
  }
};

export const replyToReview = async (
  reviewId: string,
  replyText: string
): Promise<void> => {
  if (!supabase) throw new Error('Supabase chưa cấu hình.');

  const { error } = await supabase
    .from('product_reviews')
    .update({
      admin_reply: replyText.trim(),
      admin_replied_at: new Date().toISOString(),
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    throw new Error(`Gửi phản hồi thất bại: ${error.message}`);
  }
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase chưa cấu hình.');

  const { error } = await supabase
    .from('product_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    throw new Error(`Xóa đánh giá thất bại: ${error.message}`);
  }
};

export const seedInitialReviewsIfEmpty = async (): Promise<void> => {
  if (!supabase) return;

  const { count, error } = await supabase
    .from('product_reviews')
    .select('id', { count: 'exact', head: true });

  if (error || (count !== null && count > 0)) return;

  // Insert realistic initial reviews for test/preview
  await supabase.from('product_reviews').insert([
    {
      product_id: 'p-1',
      customer_name: 'Nguyễn Văn Minh',
      customer_email: 'minh.nguyen@gmail.com',
      rating: 5,
      title: 'Cá Saba ngâm giấm rất ngon, chuẩn vị Nhật',
      comment: 'Cá Saba Shime rất vừa vị, độ chua thanh dịu và béo ngậy. Ăn sashimi hoặc cuốn cơm đều tuyệt vời. Đóng gói bảo quản lạnh rất cẩn thận!',
      status: 'approved',
      admin_reply: 'Dạ cảm ơn anh Minh đã tin tưởng và thưởng thức hải sản tại DAICHI SUISAN. Chúc anh và gia đình ngon miệng ạ!',
      admin_replied_at: new Date().toISOString(),
      verified_purchase: true,
    },
    {
      product_id: 'p-3',
      customer_name: 'Trần Thị Thu Hà',
      customer_email: 'thuha.tran@outlook.com',
      rating: 5,
      title: 'Hokke nướng than thơm lừng',
      comment: 'Cá một nắng dày mình, nướng trên vỉ than tỏa mùi thơm ngậy đặc trưng. Ăn kèm củ cải mài và nước tương cực kỳ hợp.',
      status: 'approved',
      verified_purchase: true,
    },
    {
      product_id: 'p-4',
      customer_name: 'Lê Hoàng Nam',
      customer_email: 'nam.le@gmail.com',
      rating: 4,
      title: 'Thịt cá Hamachi giòn ngọt',
      comment: 'Cá rất tươi, cắt lát dày làm sashimi rất đã miệng. Giao hàng nhanh trong 2 tiếng.',
      status: 'pending',
      verified_purchase: true,
    },
  ]);
};
