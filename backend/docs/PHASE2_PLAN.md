# Kế hoạch Phân công Nhiệm vụ & Định hướng Kiến trúc - Giai đoạn 2 (Cải tiến 1)
**Hệ thống Hỗ trợ Đời sống & Quản lý Chi phí Phòng trọ Sinh viên ĐHQGHN (VNU Living & Expense Hub)**  
*Môn: Kiến trúc phần mềm - Giảng viên: Võ Đình Hiếu*

---

## 1. Thành viên 1: Front-End (Hưng)
* **Giao diện Ghép phòng (Matching UI):**
  * Thẻ sinh viên: Hiển thị badge điểm tương thích (%) giữa 2 người (Weighted Cosine Similarity).
  * Bộ lọc: Chọn Tòa KTX (Hòa Lạc) hoặc Quận/Bán kính quanh trường (Nội thành).
  * Quản lý kết nối: Nút "Gửi lời mời ghép phòng" và tab theo dõi lời mời đã nhận/đã gửi.
  * Bảo mật (Mutual Privacy Gate): Ẩn SĐT/Zalo; chỉ hiển thị khi cả 2 bên cùng chấp nhận kết nối.
* **Giao diện Chi tiêu & Thanh toán (Expense UI):**
  * Form tạo hóa đơn: Hỗ trợ chọn 3 cách chia theo Strategy Pattern (Chia đều, Tích chọn người chịu tiền, Nhập số điện nước).
  * Thanh toán VietQR: Nút "Trả nợ qua VietQR" mở popup mã QR ngân hàng để quét thanh toán trực tiếp.
  * Ví cá nhân: Hiển thị thẻ Đỏ (mình đang nợ ai) và thẻ Xanh (ai đang nợ mình).

---

## 2. Thành viên 2: Back-End 1 (Chiến - Matching Algorithm & Security)
* **Thuật toán so khớp thói quen (Weighted Cosine Similarity):**
  * Chuẩn hóa vector thói quen (giờ ngủ, độ sạch sẽ, độ ồn, ngân sách).
  * Tính toán điểm tương thích (0 - 100%) và sắp xếp danh sách gợi ý theo độ phù hợp giảm dần.
* **Cơ chế bảo vệ thông tin liên lạc (Mutual Privacy Gate):**
  * Tạo bảng `matching_requests` quản lý trạng thái kết nối (`PENDING`, `ACCEPTED`, `REJECTED`).
  * Viết API gửi lời mời, chấp nhận/từ chối lời mời ghép phòng.
  * Che giấu SĐT/Zalo trong API chi tiết profile; chỉ trả về khi trạng thái là `ACCEPTED`.
* **Bảo mật cửa ngõ (Rate Limiting Middleware):**
  * Cài đặt middleware giới hạn tần suất gửi request tại API Login (chống brute-force) và API Matching.

---

## 3. Thành viên 3: Back-End 2 (Duy - Expense Patterns, VietQR & Caching)
* **Tái cấu trúc bộ chia tiền theo Strategy Pattern:**
  * Tạo interface `ISplitStrategy` và 3 class độc lập: `EqualSplitStrategy`, `CustomSplitStrategy`, `MeteredSplitStrategy` (tính tiền điện nước theo chỉ số).
  * Cập nhật API `POST /api/expenses` hỗ trợ các chiến lược chia tương ứng.
* **Thuật toán rút gọn nợ (Min-Cash-Flow):**
  * Tự động bù trừ công nợ chéo trong phòng, giảm số lượt chuyển khoản xuống tối đa $(N - 1)$ giao dịch.
* **Tích hợp VietQR động:**
  * Viết module tự sinh link mã QR ngân hàng chuẩn Napas 247 kèm số tài khoản, số tiền nợ và nội dung chuyển khoản.
* **Bộ nhớ đệm Redis (Cache-Aside Pattern):**
  * Bổ sung service `redis` vào `docker-compose.yml`.
  * Áp dụng Cache-Aside cho API xem công nợ phòng: Đọc từ Redis trước, ghi ngược lại nếu cache miss, xóa cache khi có hóa đơn mới.
* **Khóa lạc quan (Optimistic Locking):**
  * Bổ sung trường `version` vào bảng `expenses` để chống xung đột dữ liệu khi sửa tiền đồng thời.

---

## 4. Bảng đối chiếu các Design Pattern & Thuộc tính chất lượng

| Pattern / Kiến trúc | Người thực hiện | Vị trí áp dụng | Thuộc tính chất lượng |
| :--- | :--- | :--- | :--- |
| **Strategy Pattern** | Back-End 2 (Duy) | `ISplitStrategy` (Equal, Custom, Metered) | **Modifiability** |
| **Cache-Aside Pattern** | Back-End 2 (Duy) | Redis Cache cho balances phòng | **Performance Efficiency** |
| **Optimistic Locking** | Back-End 2 (Duy) | Cột `version` trong bảng expenses | **Data Integrity** |
| **Pipes & Filters** | Back-End 1 (Chiến) | Middleware Rate Limiting + Auth | **Security & Availability** |
| **State Pattern** | Back-End 1 (Chiến) | Vòng đời yêu cầu ghép phòng | **Reliability & Privacy** |
| **Repository Pattern** | Cả 2 Back-End | Tầng `repositories/` chuẩn | **Testability & Portability** |
