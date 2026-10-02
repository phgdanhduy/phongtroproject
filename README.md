# VNU Living & Expense Hub
## Hệ thống Hỗ trợ Đời sống Phòng trọ Sinh viên ĐHQGHN
**Bài tập lớn môn Kiến trúc Phần mềm - Giai đoạn 1: Baseline**

---

## 🌟 1. Giới thiệu dự án
Dự án giải quyết 2 bài toán cốt lõi trong đời sống sinh viên:
1. **Tìm bạn cùng phòng (Roommate Matching):** Dựa trên hồ sơ thói quen sinh hoạt (Profile Vector) và phân luồng cơ sở (**KTX Hòa Lạc** vs **Nội thành Hà Nội**).
2. **Quản lý phòng & Chi tiêu (Living & Expense):** Quản lý thành viên phòng và tự động chia đều các khoản chi phí sinh hoạt (tiền phòng, điện, nước, internet).

---

## 🛠️ 2. Công nghệ sử dụng
* **Back-End:** Node.js (Express)
* **Cơ sở dữ liệu:** PostgreSQL 15
* **Bảo mật:** Bcrypt, JWT (JSON Web Token), Regex kiểm tra email `@vnu.edu.vn`
* **Triển khai:** Docker & Docker Compose

---

## 🚀 3. Hướng dẫn chạy hệ thống

### Cách 1: Chạy qua Docker Compose (Khuyên dùng)
Yêu cầu: Máy đã cài đặt Docker Desktop.

1. Khởi động toàn bộ dịch vụ (PostgreSQL + Backend):
   ```bash
   docker compose up --build -d
   ```

2. Kiểm tra trạng thái container:
   ```bash
   docker compose ps
   ```

3. Xem log Backend:
   ```bash
   docker compose logs -f backend
   ```

4. Nạp dữ liệu mẫu (Seed Data) nếu cần:
   ```bash
   docker compose exec backend npm run seed
   ```

5. Dừng hệ thống:
   ```bash
   docker compose down
   ```

---

### Cách 2: Chạy trực tiếp trên máy (Local Development)
Yêu cầu: Node.js (>= 18) và PostgreSQL (cổng 5432).

1. Di chuyển vào thư mục backend và cài đặt thư viện:
   ```bash
   cd backend
   npm install
   ```

2. Cấu hình biến môi trường trong file `backend/.env`.

3. Khởi động server (chế độ dev với nodemon):
   ```bash
   npm run dev
   ```

4. Nạp dữ liệu mẫu:
   ```bash
   npm run seed
   ```

---

## 📡 4. Tài liệu API
Xem chi tiết đặc tả các API endpoints, định dạng Request/Response tại:
👉 [API_CONTRACT.md](./API_CONTRACT.md)

* **Health Check:** `GET http://localhost:5000/api/health`
* **Tài khoản test có sẵn sau khi seed:**
  * Email: `student1@vnu.edu.vn` / Mật khẩu: `Password123@`
  * Email: `student2@vnu.edu.vn` / Mật khẩu: `Password123@`
