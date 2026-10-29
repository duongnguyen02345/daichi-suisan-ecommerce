# DAICHI SUISAN - Nền tảng Thương Mại Điện Tử & Hệ Thống Quản Trị CMS Hải Sản Nhật Bản

Website thương mại điện tử và hệ thống quản trị nội dung (CMS) vận hành thực tế cho thương hiệu **DAICHI SUISAN** (Hải sản & Thực phẩm cao cấp nhập khẩu từ Nhật Bản).

> 📖 **Xem tài liệu hướng dẫn chi tiết:** [Hướng dẫn sử dụng website & trang Quản trị (CMS)](docs/HUONG_DAN_SU_DUNG.md)

---

## 🌟 Tính năng nổi bật & Bám sát thiết kế mẫu

### 1. Bảng màu & Phong cách chuẩn Brand FreshMart
- **Primary Color:** `#0E7A32` (Xanh lá đậm đặc trưng)
- **Accent Color:** `#FF9F1C` (Cam rực rỡ cho ưu đãi/khuyến mãi)
- **Background:** `#F8F9F5` (Nền sáng nhẹ, sạch sẽ, êm mắt)
- **Soft Cream:** `#FFF7E9` (Khối ưu đãi & thông báo thân thiện)

### 2. Các trang được xây dựng hoàn chỉnh (Desktop & Mobile)
1. **Trang chủ (`/`):**
   - Hero Banner slider lớn + 2 banner phụ bên phải (`Home_desktop page.png`).
   - Khối 5 lợi ích (USP bar): 100% tươi ngon, Giao nhanh 2h, Chuẩn VietGAP, Nguồn gốc rõ ràng, Hỗ trợ 24/7.
   - Danh mục nổi bật (10 circular category badges).
   - Sản phẩm bán chạy với phân trang/carousel và nút "Thêm vào giỏ" tiện lợi.
   - Banner Freeship đơn từ 300K và Combo gia đình tiết kiệm.
   - Chân trang (Footer) đầy đủ thông tin, form đăng ký ưu đãi và các chứng nhận bảo mật/VietGAP.
   - Responsive thân thiện (`Home mobile page.png`).

2. **Trang danh mục / Listing sản phẩm (`/category/:slug` hoặc `/products`):**
   - Breadcrumb điều hướng phân cấp.
   - Banner danh mục tươi sạch kèm 3 tiêu chí cam kết.
   - Sidebar bộ lọc đa tiêu chí (`Home_filter page.png`): Danh mục, Khoảng giá, Thương hiệu (Vinamit, CP, Đà Lạt Farm...), Chứng nhận (Hữu cơ Organic, VietGAP...), Ưu đãi, Đánh giá sao.
   - Thanh sắp xếp (Phổ biến nhất, Mới nhất, Giá tăng/giảm, Đánh giá cao nhất) & Chuyển đổi Grid/List view.

3. **Trang chi tiết sản phẩm (`/product/:slug`):**
   - Bám sát `Detail product page.png`.
   - Ribbon cam kết giao hàng 2h, đổi trả 7 ngày, an toàn thực phẩm.
   - Gallery ảnh lớn kèm 6 thumbnail chuyển đổi linh hoạt.
   - Bộ chọn số lượng stepper `[-] [1] [+]`, hiển thị tồn kho `Còn hàng (152 sản phẩm)`.
   - Nút **Thêm vào giỏ hàng** & **Mua ngay**.
   - Bảng thông tin chi tiết: Xuất xứ, Đơn vị tính, Bảo quản, Hạn sử dụng, Danh mục.
   - Danh sách sản phẩm liên quan.

4. **Trang giỏ hàng (`/cart`):**
   - Bám sát `Shopping cart page.png`.
   - Danh sách sản phẩm trong giỏ với ảnh, tên, quy cách, nhãn tươi ngon, số lượng, thành tiền, thao tác xóa.
   - Chọn tất cả / bỏ chọn / xóa nhiều / chuyển vào yêu thích.
   - Box mã giảm giá (Gợi ý sẵn `FRESH30`, `FREESHIP`, `FRESH50`) & Ghi chú đơn hàng.
   - Tóm tắt đơn hàng, dự kiến thời gian giao hàng, tính phí vận chuyển và tổng tiền.
   - **Xử lý đăng nhập bắt buộc:** Banner và modal cảnh báo khi người dùng chưa đăng nhập.

5. **Trang thanh toán (`/checkout`):**
   - Bám sát `Pament page.png`.
   - Thanh tiến trình 4 bước: Thông tin giao hàng → Phương thức thanh toán → Xác nhận đơn hàng → Hoàn tất.
   - Chọn khung giờ giao hàng (Tabs chọn ngày: Hôm nay, Ngày mai, Thứ 5... và khung giờ: 08:00 - 10:00, 10:00 - 12:00...).
   - Phương thức thanh toán: COD, Ví điện tử (MoMo, ZaloPay, VNPay, ShopeePay), Thẻ ngân hàng (Visa, Master, Napas).
   - Tóm tắt đơn hàng bên phải & Modal thông báo đặt hàng thành công.

6. **Trang đăng nhập / tạo tài khoản (`/login`):**
   - Bám sát layout `Login page.png`.
   - Cột trái: Khối giới thiệu đặc quyền thành viên, hình ảnh nông sản tươi ngon.
   - Cột phải: Form tab Đăng nhập / Tạo tài khoản, đăng nhập mạng xã hội và nút đăng nhập nhanh 1-click Demo.

7. **Trang tài khoản khách hàng (`/account`):**
   - Bám sát `Account mobile page.png` và tương thích cả desktop.
   - Thẻ hồ sơ thành viên (Họ tên, SĐT, Email, Hạng Bạc, ảnh đại diện).
   - 4 ô trạng thái đơn hàng: Chờ xác nhận (1), Đang giao (2), Đã giao (12), Đổi trả (0).
   - Danh sách đơn hàng chi tiết, địa chỉ giao hàng, sản phẩm yêu thích (Wishlist).

8. **Trang Quản trị Admin (`/admin`):**
   - Bám sát `Admin page.png`.
   - Sidebar xanh rêu chuyên nghiệp, menu 11 danh mục quản lý.
   - 4 thẻ thống kê KPI: Tổng sản phẩm (128), Sắp hết hàng (12), Hết hàng (4), Đang khuyến mãi (28).
   - Bảng quản lý sản phẩm với tìm kiếm, lọc danh mục, lọc trạng thái, phân trang.
   - CRUD sản phẩm: Thêm sản phẩm mới và Chỉnh sửa sản phẩm qua Modal.
   - Cột widget bên phải: Quản lý banner (carousel preview), Sản phẩm nổi bật (gắp thả/xóa), Quản lý khuyến mãi.

---

## 🛠 Hướng dẫn chạy dự án

### Cấu hình Google Maps

Sao chép `.env.example` thành `.env.local`, sau đó điền API key đã giới hạn theo domain:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_restricted_google_maps_key
```

Kích hoạt **Maps JavaScript API**, **Places API (New)** và dịch vụ geocoding cần dùng trong Google Cloud. Khi chưa có key, checkout vẫn cho phép lấy tọa độ GPS và nhập địa chỉ thủ công.

### Cấu hình QR chuyển khoản

1. Đăng nhập tài khoản demo Admin.
2. Mở `/admin` → **Cài đặt**.
3. Chọn ngân hàng, nhập số tài khoản và tên chủ tài khoản.
4. Bật **Cho phép thanh toán bằng QR** rồi lưu.

Checkout sẽ tạo VietQR chứa đúng số tiền và mã đơn. Khi chưa cấu hình Supabase, website chạy ở chế độ demo và lưu dữ liệu trong `localStorage`; khi có các biến `VITE_SUPABASE_*`, đơn chuyển khoản được tạo và đối soát ở backend.

### Bật xác nhận chuyển khoản tự động với SePay + Supabase

Dự án đã có sẵn:

- Migration tạo danh mục giá phía server, đơn hàng, chi tiết đơn, tài khoản ngân hàng và nhật ký giao dịch.
- Edge Function `create-order` tính lại giá, ưu đãi và phí vận chuyển phía server.
- Edge Function `sepay-webhook` xác thực chữ ký HMAC-SHA256, chống xử lý trùng và đối soát tài khoản, mã đơn, số tiền.
- Edge Function `order-status` cho trình duyệt kiểm tra trạng thái bằng token riêng của từng đơn.
- Edge Function `report-payment` cho phép khách báo đã chuyển khoản bằng token riêng của đơn; thao tác này chỉ chuyển đơn sang chờ xác minh, không tự đánh dấu đã thanh toán.
- Edge Function `bank-settings` để admin đồng bộ tài khoản nhận tiền bằng khóa quản trị.

1. Chọn hoặc tạo một Supabase project rồi liên kết dự án:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

2. Sao chép `supabase/.env.example` thành một file env không commit, tạo hai chuỗi bí mật khác nhau và khai báo domain thật trong `ALLOWED_ORIGINS`. Sau đó nạp secrets và deploy:

```bash
npx supabase secrets set --env-file supabase/.env
npx supabase functions deploy create-order order-status report-payment bank-settings sepay-webhook --use-api
```

3. Điền frontend `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
VITE_GOOGLE_MAPS_API_KEY=your_restricted_google_maps_key
```

4. Trong SePay, tạo webhook loại **Tiền vào**:

- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/sepay-webhook`
- Content-Type: `application/json`
- Xác thực: `HMAC-SHA256`
- Secret: phải trùng `SEPAY_WEBHOOK_SECRET`
- Tiền tố mã thanh toán: `FM`
- Bật bỏ qua giao dịch không có mã và bật tự động gửi lại.

5. Đăng nhập Admin → `/admin` → **Cài đặt**, nhập tài khoản ngân hàng cùng giá trị `FRESHMART_ADMIN_SETUP_KEY`, rồi lưu. Khóa quản trị chỉ được gửi lúc lưu và không được ghi vào localStorage.

Sau khi chuyển khoản, khách bấm **Đã thanh toán** để đưa đơn sang `customer_reported` và thông báo cho admin. Database chỉ chuyển đơn sang `paid` khi webhook hợp lệ khớp tài khoản nhận, mã đơn và số tiền, hoặc khi admin xác nhận thủ công. ID giao dịch SePay có ràng buộc duy nhất để một webhook gửi lại không thể xác nhận hai lần. Giao dịch sai số tiền được chuyển sang `review_required` để admin đối soát thủ công.

### Bật hệ thống quản trị thật

Migration `supabase/migrations/20261014143311_admin_foundation.sql` bổ sung dữ liệu sản phẩm đầy đủ, danh mục, tồn kho, banner, khuyến mại, nhật ký admin và các RLS policy. Chỉ áp migration sau khi đã xác định đúng Supabase project của Online Mart.

Sau khi tạo tài khoản quản trị trong Supabase Auth, gán vai trò bằng SQL Editor với đúng email admin:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where email = 'admin@your-domain.com';
```

Sau đó đăng xuất và đăng nhập lại để JWT nhận `app_metadata.role = admin`. Không lưu vai trò trong `user_metadata`, vì người dùng có thể tự sửa phần metadata này.

Khi chưa cấu hình `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`, trang quản trị hoạt động ở chế độ demo và lưu thay đổi trong `localStorage`. Khi đã cấu hình Supabase và áp migration, giao diện tự chuyển sang nguồn dữ liệu Supabase.

### Cài đặt dependencies (nếu cần):
```bash
npm install
```

### Chạy môi trường Development:
```bash
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:3000`

### Build kiểm tra phiên bản Production:
```bash
npm run build
npm run preview
```

---

## 👥 Demo Tài khoản & Phân quyền
Thanh trên cùng (Top demo bar) hoặc trang Đăng nhập cho phép chuyển đổi nhanh:
1. **Khách hàng:** `lan.nguyen@mail.com` (Nguyễn Thị Lan / Nguyễn Văn A)
2. **Admin:** `admin@freshmart.vn` (Toàn quyền truy cập Dashboard `/admin`)
3. **Khách vãng lai (Chưa đăng nhập):** Xem sản phẩm tự do; khi bấm thêm vào giỏ hàng hoặc thanh toán hệ thống tự động hiển thị Modal yêu cầu đăng nhập đúng như mô tả.
