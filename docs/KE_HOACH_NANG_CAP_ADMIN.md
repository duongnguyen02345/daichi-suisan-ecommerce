# Kế hoạch nâng cấp hệ thống quản trị Online Mart

## Tiến độ triển khai

Cập nhật ngày 15/10/2026:

- [x] Tạo migration nền tảng admin, RLS, quyền Data API và nhật ký thay đổi.
- [x] Tích hợp Supabase Auth vào frontend, giữ chế độ demo khi chưa cấu hình Supabase.
- [x] Tách màn hình Tổng quan, Sản phẩm, Kho hàng, Banner, Khuyến mại và Cài đặt.
- [x] Thêm trạng thái nháp, xuất bản, lưu trữ và tạm ngừng bán cho sản phẩm.
- [x] Thêm ngưỡng sắp hết và thao tác báo hết hàng từ màn hình kho.
- [x] Đồng bộ sản phẩm và banner đã xuất bản ra các trang khách hàng.
- [x] Chặn thêm vào giỏ khi hết hàng hoặc tạm ngừng bán.
- [x] Thêm form cập nhật banner và tạo chương trình khuyến mại.
- [x] Hoàn thiện CRUD danh mục: thêm, sửa, sắp xếp, ẩn và chặn lưu trữ khi còn sản phẩm.
- [x] Thêm màn hình quản lý đơn hàng, tìm kiếm, lọc và chuyển trạng thái theo quy trình.
- [x] Thêm xác nhận chuyển khoản thủ công có kiểm tra quyền và lịch sử trạng thái.
- [x] Thêm RLS đọc đơn cho admin và RPC bảo vệ thao tác chuyển trạng thái đơn.
- [x] Thay số liệu dashboard mẫu bằng doanh thu, đơn chờ xử lý, đối soát và cảnh báo kho thực tế.
- [x] Thêm danh sách khách hàng tổng hợp từ đơn hàng và báo cáo vận hành cơ bản.
- [ ] Chọn đúng Supabase project và áp migration lên môi trường từ xa.
- [ ] Tạo tài khoản admin thật và gán `app_metadata.role = admin`.
- [ ] Tạo bucket Storage và hoàn thiện upload ảnh thay cho nhập URL.
- [ ] Hoàn thiện hoàn tiền, liên kết tồn kho với vòng đời đơn hàng và cảnh báo vận hành.
- [ ] Hoàn thiện phân nhóm khách hàng, xuất báo cáo và quản lý đánh giá.
- [ ] Thêm kiểm thử tích hợp với database Supabase thật.

## 1. Mục tiêu

Hoàn thiện tài khoản và trang quản trị để admin có thể vận hành website mà không cần chỉnh sửa mã nguồn, bao gồm:

- Quản lý sản phẩm, danh mục, hình ảnh và giá bán.
- Theo dõi tồn kho, cảnh báo sắp hết hàng và tự động báo hết hàng.
- Cập nhật banner theo vị trí và lịch hiển thị.
- Tạo, lên lịch và kiểm soát chương trình khuyến mại.
- Theo dõi đơn hàng, thanh toán, giao hàng, hủy và hoàn tiền.
- Quản lý khách hàng, đánh giá và báo cáo.
- Ghi nhận lịch sử thao tác của quản trị viên.
- Bảo vệ trang admin, API và dữ liệu bằng phân quyền phía server.

## 2. Hiện trạng dự án

Giao diện quản trị và menu chức năng đã tồn tại, nhưng phần lớn dữ liệu sản phẩm, banner và khuyến mại hiện vẫn lấy từ dữ liệu mẫu hoặc chỉ được lưu trong React state. Vì vậy, thay đổi có thể mất sau khi tải lại trang và chưa đồng bộ thực sự với website bán hàng.

Các khu vực chính cần nâng cấp:

- `src/pages/AdminPage.tsx`: hiện chưa tách đầy đủ màn hình cho từng mục trong sidebar.
- `src/components/admin/AdminSidebar.tsx`: đã có danh sách chức năng nhưng nhiều mục chưa có module quản trị tương ứng.
- `src/context/AdminContext.tsx`: thao tác sản phẩm, banner và khuyến mại chủ yếu đang lưu cục bộ.
- `src/data/mockData.ts`: còn chứa dữ liệu sản phẩm và khuyến mại mẫu.
- `supabase/migrations/20261014064549_freshmart_payment_automation.sql`: đã có nền tảng dữ liệu thanh toán và có thể được mở rộng cho CMS admin.

## 3. Kiến trúc đề xuất

Supabase sẽ là nguồn dữ liệu chính cho cả trang quản trị và cửa hàng:

```text
Admin
  -> Xác thực và phân quyền
  -> API/RPC được bảo vệ
  -> Supabase Database + Storage
  -> Website khách hàng đọc dữ liệu đã xuất bản
```

Nguyên tắc:

- Supabase Auth quản lý đăng nhập.
- Vai trò admin được xác minh phía server, không dựa vào `localStorage`.
- Row Level Security bảo vệ các bảng dữ liệu.
- Supabase Storage lưu ảnh sản phẩm và banner.
- Website khách hàng chỉ đọc dữ liệu đã được xuất bản và còn hiệu lực.
- Thao tác quan trọng được ghi vào nhật ký quản trị.

## 4. Phạm vi chức năng

| Module | Chức năng | Mức ưu tiên |
| --- | --- | --- |
| Xác thực và phân quyền | Đăng nhập admin, bảo vệ `/admin`, API và dữ liệu | P0 |
| Sản phẩm | Thêm, sửa, xuất bản, ẩn, lưu trữ, ảnh, giá, SKU | P0 |
| Tồn kho | Nhập/xuất, giữ hàng, cảnh báo sắp hết, tự báo hết hàng | P0 |
| Danh mục | Thêm, sửa, ẩn, sắp xếp thứ tự hiển thị | P1 |
| Banner | Upload ảnh, liên kết, vị trí, lịch hiển thị, xem trước | P1 |
| Khuyến mại | Mã giảm giá, điều kiện, giới hạn, lịch chạy | P1 |
| Đơn hàng | Thanh toán, xác nhận, đóng gói, giao hàng, hủy, hoàn tiền | P1 |
| Nhật ký admin | Lưu người thao tác, nội dung và thời gian thay đổi | P1 |
| Dashboard | Doanh thu, đơn mới, tồn kho thấp, thanh toán chờ xử lý | P2 |
| Khách hàng | Hồ sơ, lịch sử mua hàng, phân nhóm khách hàng | P2 |
| Báo cáo | Doanh thu, tồn kho, sản phẩm bán chạy, hiệu quả khuyến mại | P2 |

## 5. Quản lý sản phẩm

### 5.1. Thông tin sản phẩm

Mỗi sản phẩm cần hỗ trợ:

- Tên, slug, SKU và mã vạch nếu có.
- Danh mục và thương hiệu.
- Giá bán, giá gốc và đơn vị tính.
- Mô tả ngắn, mô tả chi tiết và thông tin SEO.
- Ảnh đại diện và bộ sưu tập ảnh.
- Số lượng tồn, ngưỡng cảnh báo và trạng thái kinh doanh.
- Thời gian tạo, cập nhật và người cập nhật cuối cùng.

SKU và slug phải là duy nhất. Ảnh nên được nén, giới hạn định dạng và kích thước trước khi lưu.

### 5.2. Trạng thái xuất bản

- `draft`: bản nháp, chỉ admin nhìn thấy.
- `published`: đang hiển thị trên website.
- `archived`: ngừng kinh doanh nhưng vẫn giữ lịch sử dữ liệu.

Không xóa cứng sản phẩm đã từng xuất hiện trong đơn hàng. Sử dụng lưu trữ hoặc xóa mềm để bảo toàn lịch sử.

### 5.3. Trạng thái tồn kho

- `in_stock`: còn hàng.
- `low_stock`: sắp hết hàng.
- `out_of_stock`: hết hàng.
- `temporarily_unavailable`: tạm ngừng bán.

Quy tắc tự động:

```text
Tồn kho = 0              -> Hết hàng
Tồn kho từ 1 đến ngưỡng  -> Sắp hết hàng
Tồn kho trên ngưỡng      -> Còn hàng
```

Admin không nên nhập nhãn hết hàng độc lập với số lượng thực tế. Trường hợp đặc biệt sử dụng trạng thái `temporarily_unavailable`.

Khi hết hàng, website khách hàng phải:

- Hiển thị nhãn "Hết hàng".
- Vô hiệu hóa nút thêm vào giỏ hàng.
- Không cho thanh toán số lượng vượt quá tồn khả dụng.
- Có thể cung cấp chức năng đăng ký nhận thông báo khi có hàng lại.

## 6. Quản lý tồn kho

Tồn kho cần được quản lý bằng lịch sử biến động thay vì chỉ sửa một con số tổng:

- Nhập hàng.
- Điều chỉnh tăng hoặc giảm.
- Giữ hàng khi khách tạo đơn.
- Xuất hàng khi đơn được xác nhận.
- Hoàn tồn khi đơn bị hủy hoặc thanh toán hết hạn.
- Ghi chú lý do và người thực hiện.

Các giá trị cần theo dõi:

```text
available_stock = on_hand_stock - reserved_stock
```

Việc tạo đơn, giữ hàng và trừ kho phải được thực hiện trong giao dịch database để tránh bán vượt tồn khi nhiều khách đặt cùng lúc.

## 7. Quản lý danh mục

Admin có thể:

- Thêm, sửa và lưu trữ danh mục.
- Cấu hình danh mục cha/con.
- Thay đổi thứ tự hiển thị.
- Bật hoặc tắt hiển thị ngoài cửa hàng.
- Gắn ảnh và thông tin SEO.

Không cho xóa danh mục đang được sản phẩm sử dụng nếu chưa chuyển sản phẩm sang danh mục khác.

## 8. Quản lý banner

Màn hình banner cần hỗ trợ:

- Ảnh riêng cho desktop và mobile.
- Tiêu đề, nội dung phụ và nút kêu gọi hành động.
- URL điều hướng khi khách bấm vào banner.
- Vị trí hiển thị trên website.
- Thứ tự ưu tiên.
- Ngày bắt đầu và kết thúc.
- Trạng thái nháp, đã lên lịch, đang hoạt động và hết hạn.
- Xem trước trước khi xuất bản.

Banner phải tự động xuất hiện và kết thúc theo lịch, không cần admin bật/tắt thủ công.

## 9. Quản lý chương trình khuyến mại

Các loại khuyến mại cần hỗ trợ:

- Giảm theo phần trăm.
- Giảm số tiền cố định.
- Miễn phí vận chuyển.
- Khuyến mại tự động không cần mã.
- Khuyến mại áp dụng cho sản phẩm hoặc danh mục cụ thể.

Mỗi chương trình cần có:

- Mã khuyến mại, tên và mô tả.
- Ngày bắt đầu và kết thúc.
- Giá trị đơn hàng tối thiểu.
- Mức giảm tối đa.
- Tổng giới hạn sử dụng.
- Giới hạn sử dụng trên mỗi khách hàng.
- Sản phẩm hoặc danh mục được áp dụng.
- Quy tắc có hoặc không cho phép cộng dồn.
- Trạng thái nháp, đã lên lịch, đang chạy, tạm dừng và hết hạn.

Điều kiện và số tiền giảm phải được tính lại trên server khi đặt hàng. Không sử dụng trực tiếp số tiền giảm do trình duyệt gửi lên.

## 10. Quản lý đơn hàng

Admin cần có màn hình danh sách và chi tiết đơn hàng với các trạng thái:

```text
Chờ thanh toán
  -> Đã thanh toán
  -> Đang chuẩn bị hàng
  -> Đang giao
  -> Hoàn thành
```

Nhánh ngoại lệ:

```text
Chờ thanh toán -> Hết hạn
Đơn đang xử lý -> Đã hủy
Đã thanh toán  -> Chờ hoàn tiền -> Đã hoàn tiền
```

Mỗi lần chuyển trạng thái phải:

- Kiểm tra quyền của admin.
- Kiểm tra trạng thái hiện tại có cho phép chuyển hay không.
- Cập nhật tồn kho phù hợp.
- Ghi lịch sử trạng thái đơn hàng.
- Không xử lý thanh toán hoặc trừ kho hai lần.

## 11. Thiết kế dữ liệu đề xuất

Có thể mở rộng hoặc bổ sung các bảng:

- `admin_profiles`
- `categories`
- `catalog_products`
- `product_images`
- `product_inventory`
- `inventory_movements`
- `banners`
- `promotions`
- `promotion_products`
- `promotion_categories`
- `promotion_usages`
- `order_status_history`
- `admin_audit_logs`

Các bảng sản phẩm, khuyến mại và đơn hàng đã có trong migration hiện tại cần được rà soát trước khi tạo migration mới để tránh trùng dữ liệu.

## 12. Bảo mật tài khoản Admin

- Chuyển đăng nhập quản trị sang Supabase Auth.
- Lưu vai trò quản trị trong thông tin do server kiểm soát.
- Không cho phép người dùng tự thay đổi vai trò của mình.
- Bật Row Level Security cho toàn bộ bảng được truy cập từ frontend.
- Chỉ admin được phép tạo, sửa, xuất bản hoặc lưu trữ dữ liệu.
- Khách chỉ đọc được sản phẩm, banner và khuyến mại đang hoạt động.
- Thao tác nhạy cảm cần xác nhận lại và ghi nhật ký.
- Thiết lập giới hạn tần suất cho API đăng nhập và API quản trị quan trọng.
- Không ghi khóa bí mật hoặc service-role key vào mã frontend.

## 13. Dashboard quản trị

Dashboard nên hiển thị:

- Doanh thu hôm nay, tuần này và tháng này.
- Số đơn mới và đơn cần xử lý.
- Số giao dịch chuyển khoản chờ xác nhận.
- Sản phẩm hết hàng và sắp hết hàng.
- Sản phẩm bán chạy.
- Khuyến mại đang chạy và sắp hết hạn.
- Banner đang hoạt động.
- Các cảnh báo hệ thống cần admin xử lý.

## 14. Lộ trình triển khai

### Giai đoạn 1 — Nền tảng quản trị

- Chọn đúng dự án Supabase của Online Mart.
- Cấu hình Supabase Auth và vai trò admin.
- Bảo vệ trang `/admin`, API và dữ liệu.
- Tách từng mục sidebar thành route hoặc màn hình riêng.
- Tạo cấu trúc database và nhật ký admin.

**Kết quả:** admin đăng nhập an toàn và mỗi chức năng có màn hình quản lý riêng.

### Giai đoạn 2 — Sản phẩm và danh mục

- Chuyển dữ liệu mẫu sang database.
- Hoàn thiện CRUD sản phẩm.
- Thêm upload và quản lý ảnh.
- Bổ sung nháp, xuất bản, lưu trữ.
- Hoàn thiện quản lý danh mục.
- Đồng bộ sản phẩm đã xuất bản ra cửa hàng.

**Kết quả:** admin cập nhật sản phẩm và thay đổi xuất hiện chính xác trên website.

### Giai đoạn 3 — Tồn kho

- Xây dựng sổ nhập/xuất kho.
- Thêm cảnh báo sắp hết và tự động báo hết hàng.
- Kiểm tra tồn trước khi đặt hàng.
- Giữ hàng khi khách thanh toán.
- Hoàn tồn khi đơn hủy hoặc hết hạn.

**Kết quả:** website không bán vượt tồn và trạng thái hàng hóa luôn đồng bộ.

### Giai đoạn 4 — Banner và khuyến mại

- Hoàn thiện màn hình quản lý banner.
- Thêm upload ảnh, xem trước và lập lịch.
- Xây dựng trình tạo chương trình khuyến mại.
- Kiểm tra và tính giảm giá phía server.

**Kết quả:** admin tự vận hành nội dung trang chủ và các chiến dịch bán hàng.

### Giai đoạn 5 — Đơn hàng và thanh toán

- Hoàn thiện màn hình đơn hàng.
- Liên kết xác nhận chuyển khoản tự động.
- Chuẩn hóa luồng trạng thái đơn hàng.
- Liên kết trạng thái đơn với tồn kho.
- Hỗ trợ hủy và hoàn tiền.

**Kết quả:** đơn hàng được xử lý xuyên suốt từ lúc tạo đến khi hoàn thành.

### Giai đoạn 6 — Báo cáo và hoàn thiện vận hành

- Xây dashboard và báo cáo.
- Hoàn thiện nhật ký quản trị.
- Thêm bộ lọc, phân trang và thao tác hàng loạt.
- Kiểm thử bảo mật và hiệu năng.
- Kiểm thử toàn bộ luồng admin đến website khách hàng.

**Kết quả:** hệ thống đủ khả năng vận hành thực tế và truy vết sự cố.

## 15. Tiêu chí nghiệm thu

Hệ thống được xem là hoàn thiện khi đáp ứng các điều kiện sau:

- Dữ liệu vẫn tồn tại sau khi tải lại trang hoặc đăng nhập trên thiết bị khác.
- Sản phẩm chỉ xuất hiện ngoài cửa hàng sau khi được xuất bản.
- Sản phẩm hết hàng không thể thêm vào giỏ hoặc thanh toán.
- Đơn hàng làm thay đổi tồn kho chính xác và không bị trừ hai lần.
- Banner tự bật và tắt theo lịch.
- Khuyến mại được kiểm tra và tính toán phía server.
- Người không có quyền admin không thể truy cập API quản trị.
- Mọi thay đổi quan trọng đều có lịch sử truy vết.
- Giao diện quản trị hoạt động tốt trên desktop và màn hình nhỏ.
- Các luồng sản phẩm, khuyến mại, thanh toán và tồn kho có kiểm thử tự động hoặc checklist kiểm thử rõ ràng.

## 16. Thứ tự ưu tiên thực hiện

Thứ tự khuyến nghị:

1. Xác thực, phân quyền và bảo mật dữ liệu.
2. Sản phẩm, danh mục và upload ảnh.
3. Tồn kho và trạng thái hết hàng.
4. Banner và chương trình khuyến mại.
5. Đơn hàng và xác nhận thanh toán chuyển khoản.
6. Dashboard, báo cáo và nhật ký quản trị.

Không nên triển khai sâu banner, khuyến mại hoặc báo cáo trước khi sản phẩm, tồn kho và phân quyền đã được chuyển khỏi dữ liệu mẫu.

## 17. Điều kiện cần xác nhận trước khi bắt đầu lập trình

Hiện môi trường đang có nhiều dự án Supabase được kết nối. Trước khi chạy migration hoặc tạo bảng, cần xác định chính xác dự án Supabase thuộc Online Mart để tránh cập nhật nhầm cơ sở dữ liệu.

