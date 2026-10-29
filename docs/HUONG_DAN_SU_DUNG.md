# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG WEBSITE & TRANG QUẢN TRỊ (CMS)
## THƯƠNG HIỆU HẢI SẢN NHẬT BẢN DAICHI SUISAN

---

## MỤC LỤC
1. [Giới thiệu hệ thống](#1-giới-thiệu-hệ-thống)
2. [Hướng dẫn dành cho khách mua sắm (Storefront)](#2-hướng-dẫn-dành-cho-khách-mua-sắm-storefront)
   - [2.1 Tìm kiếm và lọc sản phẩm hải sản](#21-tìm-kiếm-và-lọc-sản-phẩm-hải-sản)
   - [2.2 Giỏ hàng & Áp dụng mã ưu đãi](#22-giỏ-hàng--áp-dụng-mã-ưu-đãi)
   - [2.3 Đặt hàng và thanh toán VietQR tự động](#23-đặt-hàng-và-thanh-toán-vietqr-tự-động)
   - [2.4 Đánh giá sản phẩm sau khi mua](#24-đánh-giá-sản-phẩm-sau-khi-mua)
3. [Hướng dẫn chi tiết dành cho Quản trị viên (Admin Portal)](#3-hướng-dẫn-chi-tiết-dành-cho-quản-trị-viên-admin-portal)
   - [3.1 Đăng nhập & Cơ chế bảo mật phân quyền](#31-đăng-nhập--cơ-chế-bảo-mật-phân-quyền)
   - [3.2 Thanh tìm kiếm toàn cục (Global Search) & Phím tắt](#32-thanh-tìm-kiếm-toàn-cục-global-search--phím-tắt)
   - [3.3 Dashboard tổng quan & "Việc cần xử lý ngay"](#33-dashboard-tổng-quan--việc-cần-xử-lý-ngay)
   - [3.4 Quản lý Sản phẩm (Products)](#34-quản-lý-sản-phẩm-products)
   - [3.5 Quản lý Danh mục (Categories)](#35-quản-lý-danh-mục-categories)
   - [3.6 Quản lý Tồn kho (Inventory)](#36-quản-lý-tồn-kho-inventory)
   - [3.7 Quản lý Đơn hàng & Đối soát thanh toán VietQR (Orders)](#37-quản-lý-đơn-hàng--đối-soát-thanh-toán-vietqr-orders)
   - [3.8 Quản lý Mã ưu đãi & Khuyến mại (Promotions)](#38-quản-lý-mã-ưu-đãi--khuyến-mại-promotions)
   - [3.9 Quản lý Banner quảng cáo (Banners)](#39-quản-lý-banner-quảng-cáo-banners)
   - [3.10 Quản lý Bài viết & Tin tức ẩm thực (Articles)](#310-quản-lý-bài-viết--tin-tức-ẩm-thực-articles)
   - [3.11 Kiểm duyệt Đánh giá sản phẩm (Product Reviews)](#311-kiểm-duyệt-đánh-giá-sản-phẩm-product-reviews)
   - [3.12 Thư viện hình ảnh tập trung (Media Assets Library)](#312-thư-viện-hình-ảnh-tập-trung-media-assets-library)
   - [3.13 CMS Quản lý nội dung các trang (Page Sections CMS)](#313-cms-quản-lý-nội-dung-các-trang-page-sections-cms)
   - [3.14 Quản lý Menu & Điều hướng Footer (Site Navigation)](#314-quản-lý-menu--điều-hướng-footer-site-navigation)
   - [3.15 Cấu hình SEO & Thẻ chia sẻ mạng xã hội (SEO & Meta)](#315-cấu-hình-seo--thẻ-chia-sẻ-mạng-xã-hội-seo--meta)
   - [3.16 Thông tin thương hiệu & Logo (Site Profile)](#316-thông-tin-thương-hiệu--logo-site-profile)
   - [3.17 Trung tâm liên hệ & Hỗ trợ khách hàng (Contact Center)](#317-trung-tâm-liên-hệ--hỗ-trợ-khách-hàng-contact-center)
   - [3.18 Cài đặt tài khoản ngân hàng & VietQR](#318-cài-đặt-tài-khoản-ngân-hàng--vietqr)
   - [3.19 Nhật ký hoạt động kiểm toán (Admin Audit Logs)](#319-nhật-ký-hoạt-động-kiểm-toán-admin-audit-logs)
4. [Hướng dẫn triển khai (Deployment Guide) & Biến môi trường](#4-hướng-dẫn-triển-khai-deployment-guide--biến-môi-trường)

---

## 1. GIỚI THIỆU HỆ THỐNG

Website thương mại điện tử **DAICHI SUISAN** là nền tảng bán lẻ và phân phối hải sản cao cấp nhập khẩu từ Nhật Bản (Cá Saba, Cá Hokke, Cá Hamachi Sashimi, Đầu cá Kanpachi, v.v.). Hệ thống được xây dựng với kiến trúc hiện đại:
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite.
- **Backend**: Supabase (Database PostgreSQL, Authentication, Storage S3-compatible, Edge Functions).
- **Hệ thống quản trị (CMS)**: Được thiết kế khép kín, phân quyền nghiêm ngặt, cho phép người quản trị vận hành 100% nội dung (sản phẩm, hình ảnh, bài viết, banner, thông tin doanh nghiệp, menu, chính sách, thẻ SEO) mà **không cần chỉnh sửa mã nguồn**.

---

## 2. HƯỚNG DẪN DÀNH CHO KHÁCH MUA SẮM (STOREFRONT)

### 2.1 Tìm kiếm và lọc sản phẩm hải sản
- Truy cập trang chủ hoặc mục **Sản phẩm** (`/products`).
- Sử dụng bộ lọc thông minh: Lọc theo danh mục (Cá Saba, Cá Hokke, Cá Hamachi...), khoảng giá, hoặc trạng thái còn hàng.
- Bấm vào sản phẩm để xem ảnh chi tiết, quy cách đóng gói, giá trị dinh dưỡng và hướng dẫn chế biến chuẩn Nhật.

### 2.2 Giỏ hàng & Áp dụng mã ưu đãi
- Thêm sản phẩm vào giỏ hàng với số lượng mong muốn.
- Mở giỏ hàng (`/cart`): Kiểm tra danh sách món ăn, số lượng và tổng tiền tạm tính.
- **Nhập mã khuyến mại**: Nhập mã voucher hợp lệ (ví dụ: `DAICHI10`, `FREESHIP`). Hệ thống sẽ tự động kiểm tra điều kiện đơn hàng tối thiểu và chiết khấu ngay trên màn hình.

### 2.3 Đặt hàng và thanh toán VietQR tự động
- Tại trang Thanh toán (`/checkout`): Nhập tên người nhận, số điện thoại, địa chỉ nhận hàng và thời gian giao hàng mong muốn.
- Chọn phương thức:
  1. **Chuyển khoản VietQR**: Hệ thống tự động tạo mã QR có sẵn số tiền và nội dung chuyển khoản duy nhất. Khách hàng mở ứng dụng ngân hàng quét mã để thanh toán tức thì.
  2. **Thanh toán khi nhận hàng (COD)**.
- Sau khi thanh toán, khách hàng có thể bấm nút **"Tôi đã chuyển khoản"** để gửi tín hiệu xác minh đến hệ thống.

### 2.4 Đánh giá sản phẩm sau khi mua
- Khách hàng có thể viết cảm nhận, chấm điểm số sao (1 đến 5 sao) và gửi feedback cho từng món ăn. Đánh giá sẽ được chuyển đến Admin để kiểm duyệt trước khi hiển thị công khai.

---

## 3. HƯỚNG DẪN CHI TIẾT DÀNH CHO QUẢN TRỊ VIÊN (ADMIN PORTAL)

### 3.1 Đăng nhập & Cơ chế bảo mật phân quyền
- **Đường dẫn truy cập**: `/admin` hoặc các route lồng nhau như `/admin/dashboard`, `/admin/products`...
- **Điều kiện truy cập**:
  - Người dùng phải đăng nhập tài khoản.
  - Trường `app_metadata.role` trong hệ thống xác thực Supabase phải là `admin`.
  - Nếu tài khoản không có quyền admin hoặc chưa đăng nhập, hệ thống sẽ tự động chuyển hướng về trang đăng nhập và bảo vệ dữ liệu tuyệt đối.

---

### 3.2 Thanh tìm kiếm toàn cục (Global Search) & Phím tắt
- Nằm ngay chính giữa **Admin Header**.
- **Cách dùng**: Nhập từ khóa bất kỳ (ví dụ: `Saba`, `Hokke`, `banner`, `kho`, `seo`, mã đơn `DH...`).
- **3 nhóm kết quả trả về tức thì**:
  1. **Chức năng quản trị**: Chuyển thẳng đến 18 module làm việc.
  2. **Sản phẩm**: Xem nhanh giá và SKU.
  3. **Đơn hàng**: Xem mã đơn, tên khách và tổng tiền.
- **Phím tắt hỗ trợ**:
  - `Phím mũi tên lên / xuống`: Di chuyển chọn kết quả.
  - `Phím Enter`: Mở nhanh kết quả đang chọn.
  - `Phím Esc`: Đóng bảng tìm kiếm.

---

### 3.3 Dashboard tổng quan & "Việc cần xử lý ngay"
- **Đường dẫn**: `/admin/dashboard`
- **Các chỉ số chính**:
  - Doanh thu trong ngày, số đơn hàng mới, sản phẩm bán chạy.
- **Khối "Việc cần xử lý ngay" (Tự động cập nhật thời gian thực)**:
  - **Xác minh thanh toán**: Hiển thị số đơn khách vừa báo chuyển khoản VietQR. Nhấp vào thẻ để chuyển thẳng sang danh sách đơn cần đối soát.
  - **Kiểm tra tồn kho thấp**: Đếm số sản phẩm đã chạm ngưỡng cảnh báo sắp hết hàng.
  - **Rà soát khuyến mại**: Nhắc nhở các chương trình ưu đãi đang chạy hoặc sắp hết hạn.

---

### 3.4 Quản lý Sản phẩm (Products)
- **Đường dẫn**: `/admin/products`
- **Thêm sản phẩm mới**:
  1. Bấm nút **"Thêm sản phẩm"** ở góc trên bên phải.
  2. Nhập tên sản phẩm, mã SKU, danh mục hải sản, đơn vị tính (gói, con, kg).
  3. Nhập giá bán, giá gốc (nếu có giảm giá), % thuế VAT và ngưỡng cảnh báo tồn kho.
  4. **Tải ảnh sản phẩm**:
     - Có thể chọn ảnh có sẵn từ **Thư viện hình ảnh (Media Picker)**.
     - Hoặc tải tệp từ máy tính. Công cụ cắt ảnh tích hợp (Crop 1:1) sẽ xuất hiện để đảm bảo ảnh vuông chuẩn nét. Sau khi cắt, ảnh được đẩy thẳng lên bucket `site-media` của Supabase (không lưu Base64).
  5. Bấm **"Lưu sản phẩm"**.
- **Chỉnh sửa / Ẩn sản phẩm**:
  - Nhấp vào biểu tượng bút chì để sửa thông tin.
  - Có thể chuyển trạng thái sang: "Tạm ngừng bán" hoặc "Còn hàng".

---

### 3.5 Quản lý Danh mục (Categories)
- **Đường dẫn**: `/admin/categories`
- Sắp xếp thứ tự hiển thị các nhóm sản phẩm ngoài trang chủ bằng thao tác kéo-thả hoặc nút tăng giảm thứ tự.
- Đặt tên tiếng Việt, tên tiếng Nhật phụ đề, đường dẫn thân thiện (slug) và ảnh đại diện cho danh mục.

---

### 3.6 Quản lý Tồn kho (Inventory)
- **Đường dẫn**: `/admin/inventory`
- Hiển thị bảng tổng hợp toàn bộ sản phẩm cùng số lượng tồn kho thực tế.
- **Cập nhật nhanh**: Nhập số lượng tồn mới vào ô và bấm **Lưu**. Hệ thống sẽ tự động cập nhật nhãn trạng thái:
  - `> 10`: Còn hàng (xanh lá).
  - `<= 10`: Sắp hết (vàng cam).
  - `= 0`: Hết hàng (đỏ).

---

### 3.7 Quản lý Đơn hàng & Đối soát thanh toán VietQR (Orders)
- **Đường dẫn**: `/admin/orders`
- **Bộ lọc đơn**: Lọc theo trạng thái giao hàng (`pending`, `shipping`, `delivered`, `cancelled`) và trạng thái thanh toán.
- **Quy trình đối soát VietQR**:
  1. Khi khách chuyển khoản và bấm "Tôi đã thanh toán", đơn hàng sẽ có nhãn nổi bật màu cam `Khách báo đã chuyển khoản`. Chuông thông báo trên Header sẽ hiển thị số đơn chờ.
  2. Quản trị viên đối chiếu với thông báo biến động số dư ngân hàng.
  3. Bấm **"Xác nhận đã nhận tiền"** -> Trạng thái thanh toán tự động chuyển thành `paid`.
  4. Bấm chuyển trạng thái đơn hàng sang **"Đang giao hàng"** -> **"Đã giao thành công"**.

---

### 3.8 Quản lý Mã ưu đãi & Khuyến mại (Promotions)
- **Đường dẫn**: `/admin/promotions`
- **Tạo mã ưu đãi mới**:
  1. Nhập mã code (tự động viết hoa, ví dụ `SEAFOOD20`).
  2. Chọn hình thức:
     - **Số tiền cố định (VNĐ)**: Ví dụ giảm ngay 50.000đ.
     - **Theo phần trăm (%)**: Ví dụ giảm 15%, có thể đặt trần giảm tối đa (ví dụ tối đa 100.000đ).
     - **Miễn phí vận chuyển (Free shipping)**.
  3. Nhập giá trị đơn hàng tối thiểu được áp dụng.
  4. Đặt ngày bắt đầu và ngày kết thúc chương trình.
  5. Tùy chọn giới hạn số lượt sử dụng (ví dụ: chỉ dành cho 100 khách đầu tiên).
- **Thao tác nhanh**: Có nút **Tạm dừng**, **Tiếp tục chạy**, hoặc **Lưu trữ** mã ưu đãi.

---

### 3.9 Quản lý Banner quảng cáo (Banners)
- **Đường dẫn**: `/admin/banners`
- **Khu vực quản lý banner**:
  - Banner chính trang chủ (Home Hero).
  - Banner trang Về chúng tôi (About Hero).
  - Banner chân trang (Footer Banner).
  - Ảnh món ăn mục DAICHI SUISAN ONLINE.
- **Bộ kích thước ảnh chuẩn**:
  - **Desktop**: 1600 × 700 px (tỉ lệ 16:7).
  - **Mobile**: 750 × 900 px (tỉ lệ 5:6).
- **Tính năng nổi bật**:
  - Hỗ trợ bộ ảnh luân phiên tự động (Carousel Gallery).
  - Chọn ảnh trực tiếp từ Thư viện hình ảnh hoặc tải ảnh mới với công cụ cắt ảnh chuẩn tỉ lệ.
  - Đặt tiêu đề, nội dung phụ, nhãn nhỏ và link điều hướng cho nút bấm CTA.

---

### 3.10 Quản lý Bài viết & Tin tức ẩm thực (Articles)
- **Đường dẫn**: `/admin/articles`
- Soạn thảo cẩm nang văn hóa ẩm thực Nhật Bản, cách bảo quản cá ngừ đại dương, hướng dẫn nấu canh chua đầu cá Hamachi.
- Tùy chọn ảnh bìa, tóm tắt bài viết, nội dung chi tiết.
- Quản lý trạng thái: Lưu nháp (Draft), Xuất bản ngay (Published), hoặc Lưu trữ (Archived).

---

### 3.11 Kiểm duyệt Đánh giá sản phẩm (Product Reviews)
- **Đường dẫn**: `/admin/reviews`
- Xem toàn bộ bình luận của khách hàng đối với từng sản phẩm.
- **Hành động kiểm duyệt**:
  - **Duyệt hiển thị (Approve)**: Đưa đánh giá ra ngoài trang chi tiết sản phẩm.
  - **Ẩn (Hide)**: Tạm ẩn đánh giá chưa phù hợp.
  - **Đánh dấu Spam**: Loại bỏ bình luận quảng cáo hoặc nội dung rác.
  - **Phản hồi từ Admin**: Nhập lời cảm ơn hoặc giải đáp thắc mắc của khách. Phản hồi sẽ hiển thị trang trọng kèm huy hiệu "Phản hồi từ DAICHI SUISAN".

---

### 3.12 Thư viện hình ảnh tập trung (Media Assets Library)
- **Đường dẫn**: `/admin/website/media`
- **Chức năng**:
  - Quản lý toàn bộ tài nguyên ảnh của website tại một nơi duy nhất.
  - Kéo-thả tải nhiều ảnh cùng lúc: Hỗ trợ WebP, JPG, PNG, GIF, SVG, ICO (tối đa 6MB/ảnh).
  - Tự động đo kích thước ảnh (width × height) và dung lượng tệp.
  - **Bảo vệ an toàn dữ liệu**: Hệ thống tự động quét kiểm tra xem ảnh có đang được dùng ở Logo, Banner, Sản phẩm, Bài viết hay Nội dung các trang hay không. Nếu ảnh đang được sử dụng, hệ thống sẽ **khóa nút xóa** để chống sự cố làm hỏng giao diện website.

---

### 3.13 CMS Quản lý nội dung các trang (Page Sections CMS)
- **Đường dẫn**: `/admin/website/pages`
- Quản lý nội dung dạng form có cấu trúc cho 4 trang:
  1. **Trang chủ (`home`)**: Lời ngỏ thương hiệu, triết lý nghệ nhân, cam kết chất lượng 100% tươi sống, khối CTA.
  2. **Về chúng tôi (`about`)**: Lịch sử hình thành, sứ mệnh, giá trị cốt lõi, công nghệ cấp đông IQF.
  3. **Liên hệ (`contact`)**: Lời chào, thông tin đường dây nóng, cam kết phản hồi 24/7.
  4. **Dùng chung (`common`)**: Thông báo đầu trang (Top notice bar).
- **Quyền năng**: Quản trị viên có thể đổi tiêu đề, mô tả, thay ảnh và bật/tắt từng section tức thì. Có sẵn nút **"Xem trước (Live Preview)"** để kiểm tra giao diện trước khi xuất bản.

---

### 3.14 Quản lý Menu & Điều hướng Footer (Site Navigation)
- **Đường dẫn**: `/admin/website/navigation`
- Quản lý liên kết tại 3 vị trí:
  - **Menu Header**: Các mục trên thanh điều hướng chính.
  - **Footer - Liên kết nhanh**: Về chúng tôi, Hướng dẫn mua hàng, Tin tức...
  - **Footer - Chính sách**: Chính sách giao hàng, đổi trả, bảo mật...
- **Bảo mật**: Hệ thống tự động kiểm tra và ngăn chặn các đường dẫn độc hại như `javascript:` hoặc URL lừa đảo.

---

### 3.15 Cấu hình SEO & Thẻ chia sẻ mạng xã hội (SEO & Meta)
- **Đường dẫn**: `/admin/website/seo`
- Thiết lập thông số tìm kiếm theo từng trang:
  - Tiêu đề SEO (`Title Tag`).
  - Mô tả Meta (`Meta Description`).
  - Thẻ từ khóa (`Keywords`).
  - Đường dẫn chuẩn (`Canonical URL`).
  - Ảnh đại diện khi chia sẻ lên mạng xã hội (`OG Image`).
- **Mô phỏng trực quan**: Xem trước kết quả xuất hiện trên Google Search và Facebook / Zalo Card ngay khi đang gõ phím.

---

### 3.16 Thông tin thương hiệu & Logo (Site Profile)
- **Đường dẫn**: `/admin/website/profile`
- Quản lý toàn bộ thông tin nền tảng của thương hiệu:
  - Tên thương hiệu: `DAICHI SUISAN`.
  - Tên công ty pháp lý, giấy phép kinh doanh.
  - Logo chính, Favicon trình duyệt.
  - Số điện thoại Hotline, Email hỗ trợ, Địa chỉ kho hàng và cửa hàng.
  - Liên kết mạng xã hội: Facebook, Zalo, YouTube, TikTok.
- Khi cập nhật tại đây, Header, Footer và Trang Liên hệ trên toàn bộ website sẽ tự động đồng bộ theo.

---

### 3.17 Trung tâm liên hệ & Hỗ trợ khách hàng (Contact Center)
- **Đường dẫn**: `/admin/contact`
- Tiếp nhận các yêu cầu tư vấn, đặt tiệc hoặc phản hồi dịch vụ từ form liên hệ của khách hàng.
- Đánh dấu trạng thái xử lý: Mới tiếp nhận, Đang xử lý, Đã hoàn tất.

---

### 3.18 Cài đặt tài khoản ngân hàng & VietQR
- **Đường dẫn**: `/admin/settings`
- Cấu hình số tài khoản ngân hàng nhận tiền chuyển khoản:
  - Ngân hàng (Vietcombank, MB Bank, Techcombank, ACB, v.v.).
  - Số tài khoản và tên chủ tài khoản.
- Sau khi kích hoạt, toàn bộ đơn hàng thanh toán chuyển khoản trên website sẽ tạo mã VietQR theo đúng số tài khoản này.

---

### 3.19 Nhật ký hoạt động kiểm toán (Admin Audit Logs)
- **Đường dẫn**: `/admin/audit-logs`
- Ghi vết tự động mọi hành vi can thiệp vào cơ sở dữ liệu: Tạo mới sản phẩm, sửa giá, đổi banner, xóa khuyến mại, chỉnh sửa nội dung trang...
- Có chức năng **So sánh JSON (Old Data vs New Data)** để đối chiếu chính xác giá trị trước và sau khi chỉnh sửa.

---

## 4. HƯỚNG DẪN TRIỂN KHAI (DEPLOYMENT GUIDE) & BIẾN MÔI TRƯỜNG

### 4.1 Quy tắc bảo mật biến môi trường
> [!IMPORTANT]
> **Tuyệt đối không đẩy tệp `.env` hoặc `.env.local` lên GitHub!**
> Tệp `.gitignore` của dự án đã được cấu hình chặt chẽ để loại trừ tất cả các tệp nhạy cảm.

### 4.2 Các biến môi trường cần thiết
Khi cấu hình trên môi trường máy chủ (Vercel, Netlify, Cloudflare Pages hoặc Docker), hãy thiết lập các biến môi trường sau:

```env
# 1. Khóa Google Maps (Hiển thị bản đồ trang Liên hệ)
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# 2. Supabase URL và Publishable Anon Key
VITE_SUPABASE_URL=https://hbvwrmohwnziydvyrsif.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
```

### 4.3 Các lệnh thực thi chính
```bash
# Cài đặt thư viện
npm install

# Chạy máy chủ phát triển cục bộ
npm run dev

# Kiểm tra lỗi kiểu dữ liệu TypeScript
npx tsc --noEmit

# Đóng gói sản phẩm cho môi trường Production
npm run build

# Chạy thử bản build production
npm run preview
```
