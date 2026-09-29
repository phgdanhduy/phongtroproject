# phongtroproject
# Smart Campus Living & Shared Expense Hub (VNU) - Phase 1 (Baseline)

Nền tảng Hỗ trợ Đời sống Phòng trọ Sinh viên ĐHQGHN.

## Tính năng Đợt 1 (Baseline)
- [x] Đăng nhập / Đăng ký bằng Email sinh viên (@vnu.edu.vn).
- [x] Thiết lập Hồ sơ thói quen sinh hoạt (Profile Vector: Khoa, Khóa, Giờ ngủ, Độ sạch sẽ...).
- [x] Lọc cơ bản danh sách bạn cùng phòng (Roommates).
- [x] Khởi tạo phòng trọ số.
- [x] Ghi nhận khoản chi tiêu & Chia đều tự động đơn giản (Equal Split).
- [x] Đóng gói và chạy bằng Docker Compose.

## Bắt đầu nhanh (Quick Start)

### Yêu cầu
- Docker và Docker Compose

### Hướng dẫn chạy
1. Sao chép tệp môi trường:
   `cp .env.example .env`

2. Kích hoạt toàn bộ hệ thống qua Docker Compose:
   `docker-compose up --build -d`

3. Truy cập ứng dụng tại: `http://localhost`
