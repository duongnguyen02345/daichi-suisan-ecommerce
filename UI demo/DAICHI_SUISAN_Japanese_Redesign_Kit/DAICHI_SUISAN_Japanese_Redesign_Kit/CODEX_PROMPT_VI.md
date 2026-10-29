# Hướng dẫn cho Codex: thiết kế lại giao diện website DAICHI SUISAN

## Mục tiêu
Hãy chỉnh sửa **giao diện website hiện có** theo phong cách Nhật Bản cổ điển, dựa trên hai ảnh tham chiếu trong `design-references/` và bộ tài nguyên trong `vector-ui-kit/`, đồng thời giữ nguyên các chức năng, dữ liệu và luồng nghiệp vụ hiện tại.

## Trước khi sửa
1. Khảo sát cấu trúc repository, framework, router, hệ thống CSS, component hiện có, API và cách chạy/build dự án.
2. Xác định trang chủ và các component đang render header, navigation, hero, danh mục, danh sách sản phẩm, banner khuyến mãi, footer.
3. Đọc `vector-ui-kit/README.md`, xem `vector-ui-kit/components/demo.html`, `vector-ui-kit/css/daichi-ui.css` và các SVG trong `vector-ui-kit/assets/`.
4. Dùng các ảnh `design-references/mockup-homepage-about-us.png` và `design-references/mockup-homepage-products.png` làm **tham chiếu phong cách và bố cục**, không dùng toàn bộ ảnh chụp mockup làm nền thay cho website thật.
5. Trước khi thay đổi, tóm tắt ngắn stack hiện tại và kế hoạch sửa các component. Sau đó tiếp tục thực hiện, không dừng ở việc chỉ đưa ra đề xuất.

## Định hướng thiết kế
- Phong cách: Japanese heritage / premium Japanese seafood e-commerce.
- Màu chủ đạo: đỏ son `#9F171B`, xanh đậm `#102F43`, xanh rêu `#145C3A`, vàng kim `#C99A45`, nền giấy ngà `#F7EEDB`, màu chữ đậm `#172E3D`.
- Họa tiết: sóng Seigaiha, mây Nhật, hoa anh đào, mặt trời đỏ, núi Phú Sĩ, cổng Torii, quạt Nhật, đường viền vàng kim.
- Cảm giác tổng thể: tinh tế, cao cấp, có chiều sâu, trang trí có tiết chế; tránh để họa tiết làm giảm độ đọc của nội dung.
- Typography: giữ font hiện có nếu phù hợp; nếu thay, chọn font hỗ trợ tiếng Việt tốt. Tiêu đề có thể dùng serif phong cách editorial; phần nội dung và điều khiển dùng sans-serif rõ ràng.
- Dùng SVG từ `vector-ui-kit/assets/` cho trang trí vector. Dùng CSS pattern/background khi phù hợp. Không biến toàn bộ trang thành một ảnh tĩnh.

## Bố cục gợi ý cho trang chủ
1. **Header**: logo, thanh tìm kiếm, tài khoản/yêu thích/giỏ hàng, điều hướng. Có thể dùng nền giấy ngà và viền đỏ-vàng, nhưng vẫn phải gọn và responsive.
2. **Hero**: tiêu đề thương hiệu ở một bên, ảnh sản phẩm/hải sản thật ở bên còn lại; kết hợp nền đỏ son, núi Phú Sĩ, mây hoặc sóng trang trí. CTA nổi bật và hoạt động thật.
3. **Giới thiệu thương hiệu**: nội dung thật của website, ảnh thực tế, khung giấy ngà và chi tiết hoa văn.
4. **Lý do lựa chọn / lợi ích**: các thẻ có icon, khoảng cách đều, tiêu đề và mô tả dễ quét.
5. **Danh mục nổi bật**: hiển thị các danh mục và ảnh đúng dữ liệu hiện có.
6. **Sản phẩm bán chạy / khuyến mãi**: giữ nguyên nguồn dữ liệu, giá, tình trạng hàng, lựa chọn biến thể, thêm giỏ hàng và yêu thích nếu đang có.
7. **Banner khuyến mãi**: dùng nền vector và ảnh sản phẩm thật; CTA dẫn đến đúng trang.
8. **Footer**: thông tin công ty, liên kết, chính sách, đăng ký nhận tin và mạng xã hội theo dữ liệu hiện có.

Không bắt buộc phải ép mọi trang theo cùng một bố cục. Hãy dùng ngôn ngữ thiết kế thống nhất, phù hợp nội dung của từng trang.

## Quy tắc kỹ thuật bắt buộc
- **Không xóa hoặc làm hỏng chức năng hiện tại**: đăng nhập, tìm kiếm, lọc/sắp xếp, phân trang, giỏ hàng, checkout, yêu thích, API, form, tracking và routing.
- Không thay dữ liệu thật bằng dữ liệu mẫu. Không tự bịa giá, đánh giá, thông tin doanh nghiệp hoặc sản phẩm.
- Không xây lại toàn bộ ứng dụng từ đầu nếu chỉ cần sửa component/style hiện có.
- Ưu tiên tái sử dụng component và design token; tránh CSS trùng lặp, selector toàn cục dễ gây tác dụng phụ và `!important` không cần thiết.
- Nếu dự án dùng React/Next/Vue hoặc framework khác, hãy chuyển các mẫu HTML/CSS sang đúng cấu trúc component hiện có; không thêm framework mới nếu không cần.
- Đưa tài nguyên vào thư mục public/static phù hợp với repository và cập nhật đường dẫn asset chính xác.
- Dùng SVG trực tiếp bằng `<img>` hoặc cơ chế asset hiện có; không nhúng SVG không an toàn từ nội dung không đáng tin cậy.
- Ảnh sản phẩm và banner cần có `alt` phù hợp; yếu tố trang trí dùng `aria-hidden="true"` hoặc alt rỗng.
- Đảm bảo tương thích desktop, tablet và mobile; không tràn ngang ở viewport nhỏ.
- Có trạng thái hover/focus/active/disabled rõ ràng, focus ring cho bàn phím, tương phản chữ đủ đọc và vùng bấm phù hợp.
- Hạn chế animation nặng; tôn trọng `prefers-reduced-motion`.
- Tối ưu kích thước ảnh, tránh CLS, không tải các ảnh trang trí lớn nếu không cần thiết.

## Quy trình thực hiện
1. Xác định các trang/component cần chỉnh và asset nào phù hợp.
2. Tích hợp các SVG và CSS token vào cấu trúc dự án hiện tại.
3. Triển khai giao diện theo từng component, bắt đầu từ header, hero, section sản phẩm và footer.
4. Chạy lint, typecheck, test và build theo các script sẵn có trong repository. Sửa các lỗi do thay đổi gây ra.
5. Nếu môi trường hỗ trợ browser/preview, mở trang ở desktop và mobile để kiểm tra trực quan, sửa lỗi layout và tương phản.
6. Kiểm tra các chức năng tương tác quan trọng vẫn hoạt động.
7. Báo cáo cuối cùng: file đã sửa, tài nguyên đã thêm, kiểm tra đã chạy, kết quả, và mọi việc còn cần người dùng xác nhận.

## Tiêu chí nghiệm thu
- Giao diện nhìn rõ phong cách Nhật Bản cổ điển theo hai ảnh tham chiếu nhưng vẫn là website thật, không phải ảnh nền giả lập.
- Màu sắc, họa tiết, khung viền, CTA và thẻ sản phẩm nhất quán.
- Nội dung tiếng Việt hiển thị đúng dấu; không có chữ bị cắt hoặc chồng lấn.
- Desktop và mobile hoạt động tốt.
- Các luồng nghiệp vụ và dữ liệu trước đó được giữ nguyên.
- Build/test thành công hoặc nêu rõ lỗi môi trường không liên quan.

**Bắt đầu bằng việc kiểm tra repository hiện tại, sau đó trực tiếp triển khai thay đổi. Không chỉ trả về một kế hoạch hoặc một bản demo độc lập.**
