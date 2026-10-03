# VNU Living & Expense Hub
## Hệ thống Hỗ trợ Đời sống & Quản lý Chi phí Phòng trọ Sinh viên ĐHQGHN
**Bài tập lớn môn Kiến trúc Phần mềm - Giai đoạn 1: Baseline**

---

## 🌟 1. Giới thiệu dự án
Hệ thống **VNU Living & Expense Hub** giải quyết 2 bài toán cốt lõi trong đời sống sinh viên Đại học Quốc gia Hà Nội:
1. **Tìm bạn cùng phòng (Roommate Matching):** Dựa trên hồ sơ thói quen sinh hoạt (Profile Vector) và phân luồng cơ sở (**KTX Hòa Lạc** vs **Nội thành Hà Nội**), lọc theo ngân sách, độ sạch sẽ, giờ ngủ, tiếng ồn.
2. **Quản lý phòng & Chia chi phí (Living & Expense):** Quản lý thành viên phòng trọ, thêm hóa đơn điện/nước/internet/tiền nhà và tự động tính toán số dư chia đều (**Equal Split** & **Balance Calculation**).

---

## 🛠️ 2. Công nghệ sử dụng
* **Front-End:** React 19, TypeScript, Vite, React Router v7, Vanilla CSS, Nginx
* **Back-End:** Node.js (Express), PostgreSQL Client (`pg`), JWT, Bcrypt
* **Cơ sở dữ liệu:** PostgreSQL 15 Alpine
* **Bảo mật:** Mã hóa mật khẩu Bcrypt, xác thực JWT, Regex kiểm tra sinh viên VNU `@vnu.edu.vn`
* **Triển khai & Vận hành:** Docker & Docker Compose đa dịch vụ (Database, Backend, Frontend)

---

## 📁 3. Cấu trúc thư mục

```text
phongtroproject/
├── backend/                  # Mã nguồn Backend API (Express.js)
│   ├── src/
│   │   ├── config/           # Cấu hình Database & JWT
│   │   ├── controllers/      # Bộ điều khiển Auth, Profile, Room, Expense
│   │   ├── database/         # Script khởi tạo SQL & Seed dữ liệu
│   │   ├── middlewares/      # Middleware xác thực JWT & bắt lỗi
│   │   └── routes/           # Định tuyến REST API
│   ├── Dockerfile
│   └── package.json
├── vnu-living-frontend/      # Mã nguồn Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/       # Layout, PageHeader, Sidebar
│   │   ├── pages/            # Login, Register, Onboarding, Profile, Roommates, Room, Expenses, Dashboard
│   │   └── services/         # API client kết nối trực tiếp Backend
│   ├── Dockerfile            # Multi-stage build Nginx production
│   ├── nginx.conf
│   └── vite.config.ts        # Cấu hình Vite & Proxy API
├── docs/                     # Database Schema SQL phục vụ Docker mount
│   └── db-schema-phase1.sql
├── docker-compose.yml        # Docker Compose phối hợp 3 services
├── API_CONTRACT.md           # Đặc tả chi tiết chuẩn RESTful API
└── README.md                 # Hướng dẫn dự án
```

---

## 🚀 4. Hướng dẫn khởi chạy hệ thống

### Cách 1: Chạy toàn bộ hệ thống bằng Docker Compose (Khuyên dùng)
> Yêu cầu: Đã cài đặt và khởi động **Docker Desktop**.

1. **Khởi chạy cả 3 dịch vụ (Database, Backend API, Frontend Web):**
   ```bash
   docker compose up --build -d
   ```

2. **Kiểm tra trạng thái các container:**
   ```bash
   docker compose ps
   ```

3. **Nạp dữ liệu mẫu (Seed Data) vào CSDL:**
   ```bash
   docker compose exec backend npm run seed
   ```

4. **Truy cập ứng dụng:**
   * **Giao diện Web Frontend:** `http://localhost` (hoặc `http://localhost:80`)
   * **Backend API:** `http://localhost:5000/api`
   * **Health Check API:** `http://localhost:5000/api/health`

5. **Dừng toàn bộ hệ thống khi không dùng:**
   ```bash
   docker compose down
   ```

---

### Cách 2: Chạy chế độ Phát triển (Local Development)
> Khuyên dùng khi cần sửa code và xem cập nhật tức thì (Hot-Reload).

#### Bước 1: Khởi động Database PostgreSQL bằng Docker
```bash
docker compose up -d postgres_db
```
*(PostgreSQL Docker được mở tại cổng **`5433`** để tránh xung đột với PostgreSQL cục bộ trên máy).*

#### Bước 2: Chạy Backend (Terminal 1)
```bash
cd backend
npm install
npm run seed    # Nạp dữ liệu mẫu
npm run dev     # Khởi động server API tại http://localhost:5000
```

#### Bước 3: Chạy Frontend (Terminal 2)
```bash
cd vnu-living-frontend
npm install
npm run dev     # Khởi động giao diện web tại http://localhost:5173
```
👉 Mở trình duyệt tại: **`http://localhost:5173`**

---

## 🔑 5. Tài khoản kiểm thử (Seed Data)

Sau khi chạy lệnh `npm run seed`, hệ thống đã chuẩn bị sẵn các tài khoản mẫu để đăng nhập:

| Email sinh viên | Mật khẩu | Họ và tên | Cơ sở |
| :--- | :--- | :--- | :--- |
| `student1@vnu.edu.vn` | `Password123@` | Nguyễn Văn A | Hòa Lạc |
| `student2@vnu.edu.vn` | `Password123@` | Trần Văn B | Hòa Lạc |
| `student3@vnu.edu.vn` | `Password123@` | Lê Thị C | Hòa Lạc |
| `student4@vnu.edu.vn` | `Password123@` | Phạm Văn D | Nội thành |
| `student5@vnu.edu.vn` | `Password123@` | Hoàng Minh E | Nội thành |

*(Bạn cũng có thể tự tạo tài khoản mới ngay trên trang Đăng ký với bất kỳ email đuôi `@vnu.edu.vn`)*.

---

## 📡 6. Tài liệu đặc tả API
Xem đầy đủ tài liệu API Contract tại: 👉 [API_CONTRACT.md](./API_CONTRACT.md)
* `POST /api/auth/register` - Đăng ký tài khoản
* `POST /api/auth/login` - Đăng nhập nhận JWT
* `GET  /api/users/me` - Lấy thông tin & hồ sơ cá nhân
* `PUT  /api/users/profile` - Cập nhật thói quen & profile sinh viên
* `GET  /api/roommates` - Tìm bạn cùng phòng (bộ lọc campus, budget, habits)
* `POST /api/rooms` - Tạo phòng trọ / KTX
* `GET  /api/rooms/my-room` - Xem phòng hiện tại & thành viên
* `POST /api/rooms/:roomId/members` - Thêm bạn cùng phòng bằng email
* `POST /api/rooms/:roomId/expenses` - Thêm hóa đơn chi phí
* `GET  /api/rooms/:roomId/expenses` - Danh sách chi phí phòng
* `GET  /api/rooms/:roomId/balances` - Bảng tổng hợp số dư chia tiền
