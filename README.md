# VNU Living & Expense Hub
## Hệ thống Hỗ trợ Đời sống & Quản lý Chi phí Phòng trọ Sinh viên ĐHQGHN
**Bài tập lớn môn Kiến trúc Phần mềm - Giai đoạn 1: Baseline**

---

## 🌟 1. Giới thiệu dự án
Hệ thống **VNU Living & Expense Hub** giải quyết 2 bài toán cốt lõi trong đời sống sinh viên Đại học Quốc gia Hà Nội:
1. **Tìm bạn cùng phòng (Roommate Matching):** Dựa trên hồ sơ thói quen sinh hoạt (Profile Vector) và phân luồng cơ sở (**KTX Hòa Lạc** vs **Nội thành Hà Nội**), lọc theo ngân sách, độ sạch sẽ, giờ ngủ, tiếng ồn.
2. **Quản lý phòng & Chia chi phí (Living & Expense Hub):** Quản lý thành viên phòng trọ, thêm hóa đơn điện/nước/internet/tiền nhà và tự động tính toán số dư chia đều (**Equal Split Engine** & **Room Balances Summary**).

---

## 🛠️ 2. Công nghệ sử dụng
* **Front-End:** React 19, TypeScript, Vite, React Router v7, Vanilla CSS, Nginx
* **Back-End:** Node.js (Express), RESTful API, PostgreSQL Client (`pg`), JWT, Bcrypt
* **Tài liệu API:** OpenAPI 3.0, Swagger UI (`swagger-ui-express`)
* **Cơ sở dữ liệu:** PostgreSQL 15 Alpine
* **Kiểm thử tải:** Python multi-threading load tester tương thích **Kaggle CPU**
* **Triển khai & Vận hành:** Docker & Docker Compose đa dịch vụ (Database, Backend, Frontend)

---

## 🏛️ 3. Thiết kế Kiến trúc Phân tầng (3-Tier Architecture)

Tuân thủ nghiêm ngặt chuẩn kiến trúc phần mềm phân tầng:
$$\text{Client (Frontend / API Consumer)} \longrightarrow \text{API Layer (Controllers)} \longrightarrow \text{Business Logic Layer (Services)} \longrightarrow \text{Data Access Layer (Repositories)} \longrightarrow \text{PostgreSQL DB}$$

1. **Tầng API (Controllers):** Nhận HTTP request, kiểm tra cú pháp đầu vào, gọi hàm từ tầng nghiệp vụ và trả về HTTP JSON response kèm mã trạng thái (200, 201, 400, 401, 403, 404, 500).
2. **Tầng Nghiệp vụ (Services):** Chứa toàn bộ quy tắc nghiệp vụ, tính toán chia tiền (Equal Split), ràng buộc email `@vnu.edu.vn`, xử lý logic ghép phòng. **Tầng nghiệp vụ hoàn toàn độc lập: KHÔNG import framework web (Express, req, res) và KHÔNG import thư viện DB (`pg`)**.
3. **Tầng Truy cập dữ liệu (Repositories):** Đóng gói toàn bộ thao tác tương tác CSDL, bao gồm câu lệnh SQL CRUD và quản lý giao dịch Transaction (`BEGIN ... COMMIT / ROLLBACK`) khi ghi nhận chi phí và chia tiền.

---
<img width="1755" height="462" alt="1791284098340_4420873897252393186_g4670334134159927144_2bbee17334b073494170a9057c72267f" src="https://github.com/user-attachments/assets/27d613b4-3a2b-45a9-9fe1-cab8538b7fd5" />




## 📁 4. Cấu trúc thư mục

```text
phongtroproject/
├── backend/                       # Mã nguồn Backend API (Express.js)
│   ├── src/
│   │   ├── config/                # Cấu hình Database Pool & JWT
│   │   ├── controllers/           # [TẦNG 1] Bộ điều khiển API (HTTP Request/Response)
│   │   ├── services/              # [TẦNG 2] Nghiệp vụ ứng dụng (Pure Business Logic)
│   │   ├── repositories/          # [TẦNG 3] Tầng truy cập dữ liệu (SQL DAL / Repository)
│   │   ├── docs/                  # Đặc tả OpenAPI 3.0 (swagger.json)
│   │   ├── database/              # Script khởi tạo SQL & Seed dữ liệu mẫu
│   │   ├── middlewares/           # Middleware xác thực JWT & Global Error Handler
│   │   ├── routes/                # Định tuyến REST API
│   │   ├── utils/                 # Utility AppError
│   │   ├── app.js                 # Cấu hình Express app & Swagger UI
│   │   └── server.js              # Entrypoint khởi chạy server
│   ├── Dockerfile
│   └── package.json
├── vnu-living-frontend/           # Mã nguồn Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/            # Layout, PageHeader, Sidebar
│   │   ├── pages/                 # Login, Register, Profile, Roommates, Room, Expenses
│   │   └── services/              # API client kết nối trực tiếp Backend
│   ├── Dockerfile                 # Multi-stage build Nginx production
│   ├── nginx.conf
│   └── vite.config.ts
├── load_tests/                    # [YÊU CẦU PHA 1] Kiểm thử tải trên Kaggle CPU
│   ├── load_test.py               # Script kiểm thử tải đa luồng đo RPS & Latency
│   └── README_KAGGLE.md           # Hướng dẫn chi tiết chạy benchmark trên Kaggle
├── docs/                          # Database Schema SQL phục vụ Docker mount
│   └── db-schema-phase1.sql
├── docker-compose.yml             # Docker Compose phối hợp 3 services
├── API_CONTRACT.md                # Đặc tả chi tiết chuẩn RESTful API
└── README.md                      # Hướng dẫn dự án
```

---

## 🚀 5. Hướng dẫn khởi chạy hệ thống

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

4. **Truy cập ứng dụng & Tài liệu:**
   * **Giao diện Web Frontend:** `http://localhost` (hoặc `http://localhost:80`)
   * **Tài liệu Swagger UI (OpenAPI):** `http://localhost:5000/api/docs`
   * **OpenAPI Raw JSON:** `http://localhost:5000/api/docs.json`
   * **Backend API Root:** `http://localhost:5000/api`
   * **Health Check API:** `http://localhost:5000/api/health`

5. **Dừng toàn bộ hệ thống:**
   ```bash
   docker compose down
   ```

---

### Cách 2: Chạy chế độ Phát triển (Local Development)

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
* Xem tài liệu Swagger UI tại: `http://localhost:5000/api/docs`

#### Bước 3: Chạy Frontend (Terminal 2)
```bash
cd vnu-living-frontend
npm install
npm run dev     # Khởi động giao diện web tại http://localhost:5173
```
👉 Mở trình duyệt tại: **`http://localhost:5173`**

---

## 🧪 6. Kiểm thử tải trên Kaggle CPU

Nhóm đã xây dựng bộ kịch bản kiểm thử tải độc lập tại thư mục [load_tests](./load_tests/):
1. Đọc hướng dẫn chi tiết tại [load_tests/README_KAGGLE.md](./load_tests/README_KAGGLE.md).
2. Chạy nhanh kịch bản kiểm thử:
   ```bash
   python load_tests/load_test.py
   ```
3. Script sẽ đo lường:
   * **Throughput:** Số lượng yêu cầu xử lý mỗi giây (RPS).
   * **Phân vị độ trễ (Percentiles):** Mean, P50, P95, P99 dưới mức tải đồng thời cao.

---

## 🔑 7. Tài khoản kiểm thử (Seed Data)

Sau khi chạy lệnh `npm run seed`, hệ thống đã chuẩn bị sẵn các tài khoản mẫu:

| Email sinh viên | Mật khẩu | Họ và tên | Cơ sở |
| :--- | :--- | :--- | :--- |
| `student1@vnu.edu.vn` | `Password123@` | Nguyễn Văn A | Hòa Lạc |
| `student2@vnu.edu.vn` | `Password123@` | Trần Văn B | Hòa Lạc |
| `student3@vnu.edu.vn` | `Password123@` | Lê Thị C | Hòa Lạc |
| `student4@vnu.edu.vn` | `Password123@` | Phạm Văn D | Nội thành |
| `student5@vnu.edu.vn` | `Password123@` | Hoàng Minh E | Nội thành |

---

## 📡 8. Danh mục Endpoints & Chuẩn RESTful (OpenAPI/Swagger)

Toàn bộ API có tài liệu tương tác trực quan tại **`http://localhost:5000/api/docs`**:

* **Xác thực:**
  * `POST /api/auth/register` - Đăng ký tài khoản sinh viên `@vnu.edu.vn`
  * `POST /api/auth/login` - Đăng nhập nhận JWT
* **Người dùng & Hồ sơ:**
  * `GET  /api/users/me` - Lấy thông tin cá nhân kèm profile
  * `PUT  /api/users/profile` - Cập nhật thói quen & hồ sơ sinh viên
* **Tìm bạn cùng phòng:**
  * `GET  /api/roommates` - Tìm bạn cùng phòng (bộ lọc campus, faculty, cohort)
  * `POST /api/roommates/requests` - Gửi lời mời ghép phòng
  * `GET  /api/roommates/requests` - Xem danh sách lời mời (Received / Sent)
  * `PUT  /api/roommates/requests/:id` - Chấp nhận / từ chối lời mời
* **Quản lý phòng:**
  * `POST /api/rooms` - Tạo phòng trọ / KTX mới (vai trò ADMIN)
  * `GET  /api/rooms/my-room` - Xem phòng hiện tại & thành viên
  * `PUT  /api/rooms/:roomId` - Chỉnh sửa thông tin phòng
  * `DELETE /api/rooms/:roomId` - Giải tán / Xóa phòng trọ (Thỏa mãn yêu cầu method DELETE)
  * `POST /api/rooms/:roomId/members` - Mời bạn cùng phòng bằng email
  * `POST /api/rooms/:roomId/leave` - Rời phòng
* **Chi tiêu & Chia tiền (Equal Split):**
  * `POST /api/rooms/:roomId/expenses` - Thêm hóa đơn chi phí (tự động chia đều)
  * `GET  /api/rooms/:roomId/expenses` - Danh sách chi phí phòng
  * `GET  /api/rooms/:roomId/balances` - Bảng cân đối công nợ bù trừ netBalance
