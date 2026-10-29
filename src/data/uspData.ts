import React from 'react';
import { Award, ShieldCheck, Leaf, Truck, Headphones } from 'lucide-react';

export interface UspItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  detail?: string;
}

export const usps: UspItem[] = [
  {
    icon: Award,
    title: '100% Nhập khẩu chính ngạch',
    desc: 'Minh bạch nguồn gốc xuất xứ',
    detail: 'Hải sản đánh bắt từ Hokkaido, Sanriku & Bò Wagyu A5 Miyazaki có đầy đủ chứng nhận VSATTP.',
  },
  {
    icon: ShieldCheck,
    title: 'Chuẩn tươi Sashimi Grade',
    desc: 'Bảo quản tiêu chuẩn ăn sống',
    detail: 'Quy trình kiểm soát độ tươi nghiêm ngặt, giữ trọn vị ngọt tự nhiên chuẩn món Nhật thượng hạng.',
  },
  {
    icon: Leaf,
    title: 'Cấp đông sâu công nghệ Nhật',
    desc: 'Công nghệ IQF âm sâu -60°C',
    detail: 'Khóa chặt dưỡng chất và độ ẩm tế bào, khi rã đông thực phẩm giữ nguyên độ tươi ngon nguyên bản.',
  },
  {
    icon: Truck,
    title: 'Giao nhanh 2H nội thành',
    desc: 'Thùng xốp & đá gel chuyên dụng',
    detail: 'Đóng gói bảo ôn đa lớp, nhiệt độ ổn định suốt hành trình trao tận tay căn bếp gia đình bạn.',
  },
  {
    icon: Headphones,
    title: 'Tư vấn & Sơ chế tận tâm',
    desc: 'Đồng hành cùng bữa tiệc gia đình',
    detail: 'Hỗ trợ phi lê, cắt lát Sashimi, tẩm ướp lẩu nướng theo yêu cầu và tư vấn thực đơn tiệc trọn gói.',
  },
];
