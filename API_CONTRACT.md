# VNU Living & Expense Hub - API Specification
## Giai đoạn 1: Baseline (Kiến trúc nền tảng)

Tài liệu đặc tả chuẩn giao tiếp RESTful API giữa Front-End và Back-End.  
* **Công nghệ Back-End:** Node.js (Express / TypeScript)
* **Cơ sở dữ liệu:** PostgreSQL

---

## 1. Chuẩn giao tiếp chung

* **Base URL:** `http://localhost:5000/api`
* **Định dạng dữ liệu:** `application/json`
* **Xác thực:** Header HTTP `Authorization: Bearer <jwt_token>`
* **Cấu trúc phản hồi thành công (2xx):**
  ```json
  {
    "success": true,
    "message": "Thao tác thành công",
    "data": {}
  }
  ```
* **Cấu trúc phản hồi lỗi (4xx, 5xx):**
  ```json
  {
    "success": false,
    "message": "Mô tả lỗi dễ hiểu cho người dùng",
    "error": "ERROR_CODE"
  }
  ```

---

## 2. Xác thực tài khoản (Authentication)

### 2.1. Đăng ký
* **URL:** `POST /auth/register`
* **Mô tả:** Đăng ký tài khoản sinh viên. Hệ thống kiểm tra đuôi email phải là `@vnu.edu.vn`.
* **Body:**
  ```json
  {
    "email": "student1@vnu.edu.vn",
    "password": "Password123@",
    "fullName": "Nguyễn Văn A",
    "studentId": "22020001"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "user": {
        "id": 1,
        "email": "student1@vnu.edu.vn",
        "fullName": "Nguyễn Văn A",
        "studentId": "22020001"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```

### 2.2. Đăng nhập
* **URL:** `POST /auth/login`
* **Body:**
  ```json
  {
    "email": "student1@vnu.edu.vn",
    "password": "Password123@"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "user": {
        "id": 1,
        "email": "student1@vnu.edu.vn",
        "fullName": "Nguyễn Văn A",
        "studentId": "22020001",
        "hasProfile": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```

---

## 3. Hồ sơ người dùng & Thói quen (Profile Vector)

### 3.1. Lấy thông tin cá nhân
* **URL:** `GET /users/me`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "email": "student1@vnu.edu.vn",
      "fullName": "Nguyễn Văn A",
      "studentId": "22020001",
      "profile": {
        "faculty": "Công nghệ Thông tin",
        "cohort": "K67",
        "campus": "HOA_LAC",
        "locationDetail": "Ký túc xá QGHN-01",
        "budget": 1500000,
        "habits": {
          "sleepSchedule": "NIGHT_OWL",
          "cleanliness": 4,
          "noiseLevel": "QUIET",
          "smoking": false,
          "hasPet": false
        },
        "bio": "Sinh viên năm 3, sống ngăn nắp, thích không gian yên tĩnh."
      },
      "roomId": 10
    }
  }
  ```

### 3.2. Cập nhật hồ sơ & thói quen sinh hoạt
* **URL:** `PUT /users/profile`
* **Headers:** `Authorization: Bearer <token>`
* **Quy ước tham số:**
  * `campus`: `"HOA_LAC"` | `"NOI_THANH"`
  * `sleepSchedule`: `"EARLY"` (ngủ sớm) | `"NIGHT_OWL"` (thức khuya)
  * `cleanliness`: thang điểm `1` đến `5`
  * `noiseLevel`: `"QUIET"` | `"NORMAL"`
* **Body:**
  ```json
  {
    "faculty": "Công nghệ Thông tin",
    "cohort": "K67",
    "campus": "HOA_LAC",
    "locationDetail": "Ký túc xá QGHN-01",
    "budget": 1500000,
    "habits": {
      "sleepSchedule": "NIGHT_OWL",
      "cleanliness": 4,
      "noiseLevel": "QUIET",
      "smoking": false,
      "hasPet": false
    },
    "bio": "Sinh viên năm 3, sống ngăn nắp, thích không gian yên tĩnh."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Cập nhật hồ sơ thành công",
    "data": {
      "updatedAt": "2026-10-02T23:30:00.000Z"
    }
  }
  ```

---

## 4. Tìm bạn cùng phòng (Roommates)

### 4.1. Lấy danh sách bạn cùng phòng phù hợp
* **URL:** `GET /roommates`
* **Query Params (tuỳ chọn lọc):**
  * `campus`: `HOA_LAC` hoặc `NOI_THANH`
  * `faculty`: ví dụ `Công nghệ Thông tin`
  * `cohort`: ví dụ `K67`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "userId": 2,
        "fullName": "Trần Văn B",
        "studentId": "22020002",
        "faculty": "Công nghệ Thông tin",
        "cohort": "K67",
        "campus": "HOA_LAC",
        "locationDetail": "Tòa A2 KTX Hòa Lạc",
        "budget": 1500000,
        "habits": {
          "sleepSchedule": "NIGHT_OWL",
          "cleanliness": 4,
          "noiseLevel": "QUIET",
          "smoking": false,
          "hasPet": false
        },
        "bio": "Tìm bạn ở chung KTX Hòa Lạc, tôn trọng không gian học tập."
      },
      {
        "userId": 3,
        "fullName": "Lê Thị C",
        "studentId": "22020003",
        "faculty": "Kinh tế",
        "cohort": "K68",
        "campus": "HOA_LAC",
        "locationDetail": "Tòa A1 KTX Hòa Lạc",
        "budget": 1200000,
        "habits": {
          "sleepSchedule": "EARLY",
          "cleanliness": 5,
          "noiseLevel": "NORMAL",
          "smoking": false,
          "hasPet": false
        },
        "bio": "Thói quen sinh hoạt điều độ, vui vẻ."
      }
    ]
  }
  ```

---

## 5. Quản lý phòng trọ (Rooms)

### 5.1. Tạo phòng mới
* **URL:** `POST /rooms`
* **Headers:** `Authorization: Bearer <token>`
* **Mô tả:** Người tạo phòng tự động được gán vai trò `ADMIN`.
* **Body:**
  ```json
  {
    "name": "Phòng 402 KTX QGHN",
    "campus": "HOA_LAC",
    "addressOrBlock": "Tòa A2, KTX Hòa Lạc"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Tạo phòng thành công",
    "data": {
      "id": 10,
      "name": "Phòng 402 KTX QGHN",
      "campus": "HOA_LAC",
      "addressOrBlock": "Tòa A2, KTX Hòa Lạc",
      "members": [
        {
          "userId": 1,
          "fullName": "Nguyễn Văn A",
          "studentId": "22020001",
          "role": "ADMIN"
        }
      ]
    }
  }
  ```

### 5.2. Lấy thông tin phòng hiện tại
* **URL:** `GET /rooms/my-room`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 10,
      "name": "Phòng 402 KTX QGHN",
      "campus": "HOA_LAC",
      "addressOrBlock": "Tòa A2, KTX Hòa Lạc",
      "members": [
        { "userId": 1, "fullName": "Nguyễn Văn A", "studentId": "22020001", "role": "ADMIN" },
        { "userId": 2, "fullName": "Trần Văn B", "studentId": "22020002", "role": "MEMBER" },
        { "userId": 3, "fullName": "Lê Thị C", "studentId": "22020003", "role": "MEMBER" }
      ]
    }
  }
  ```

### 5.3. Thêm thành viên vào phòng
* **URL:** `POST /rooms/:roomId/members`
* **Headers:** `Authorization: Bearer <token>`
* **Body:**
  ```json
  {
    "studentEmail": "student2@vnu.edu.vn"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Đã thêm thành viên vào phòng",
    "data": {
      "userId": 2,
      "fullName": "Trần Văn B",
      "studentId": "22020002",
      "role": "MEMBER"
    }
  }
  ```

---

## 6. Chi tiêu phòng & Chia đều (Expenses)

### 6.1. Tạo hóa đơn chi tiêu mới
* **URL:** `POST /rooms/:roomId/expenses`
* **Headers:** `Authorization: Bearer <token>`
* **Phân loại (`category`):**
  * `RENT` (Tiền phòng/KTX)
  * `ELECTRICITY` (Tiền điện)
  * `WATER` (Tiền nước)
  * `INTERNET` (Tiền mạng)
  * `LIVING` (Sinh hoạt chung)
* **Body:**
  ```json
  {
    "title": "Tiền mạng Internet tháng 10",
    "amount": 300000,
    "category": "INTERNET",
    "payerId": 1
  }
  ```
* **Response (201 Created):**
  * *Hệ thống tự động chia đều cho số lượng thành viên trong phòng.*
  ```json
  {
    "success": true,
    "message": "Thêm khoản chi tiêu thành công",
    "data": {
      "id": 101,
      "title": "Tiền mạng Internet tháng 10",
      "amount": 300000,
      "category": "INTERNET",
      "payerId": 1,
      "splitPerMember": 100000,
      "createdAt": "2026-10-02T23:35:00.000Z"
    }
  }
  ```

### 6.2. Danh sách các khoản chi tiêu của phòng
* **URL:** `GET /rooms/:roomId/expenses`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 101,
        "title": "Tiền mạng Internet tháng 10",
        "amount": 300000,
        "category": "INTERNET",
        "payer": {
          "id": 1,
          "fullName": "Nguyễn Văn A"
        },
        "createdAt": "2026-10-02T23:35:00.000Z"
      },
      {
        "id": 102,
        "title": "Nước uống đóng bình",
        "amount": 150000,
        "category": "LIVING",
        "payer": {
          "id": 2,
          "fullName": "Trần Văn B"
        },
        "createdAt": "2026-10-02T23:40:00.000Z"
      }
    ]
  }
  ```

### 6.3. Bảng cân đối công nợ phòng (Balances Summary)
* **URL:** `GET /rooms/:roomId/balances`
* **Headers:** `Authorization: Bearer <token>`
* **Ý nghĩa:**
  * `totalPaid`: Số tiền thành viên đã thanh toán trước.
  * `totalOwed`: Số tiền thành viên có trách nhiệm chi trả (sau khi chia đều).
  * `netBalance`: `totalPaid - totalOwed`
    * Giá trị dương: Thành viên được nhận lại tiền (phòng nợ người này).
    * Giá trị âm: Thành viên cần chuyển khoản trả lại (người này nợ phòng).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalRoomExpense": 450000,
      "memberBalances": [
        {
          "userId": 1,
          "fullName": "Nguyễn Văn A",
          "totalPaid": 300000,
          "totalOwed": 150000,
          "netBalance": 150000
        },
        {
          "userId": 2,
          "fullName": "Trần Văn B",
          "totalPaid": 150000,
          "totalOwed": 150000,
          "netBalance": 0
        },
        {
          "userId": 3,
          "fullName": "Lê Thị C",
          "totalPaid": 0,
          "totalOwed": 150000,
          "netBalance": -150000
        }
      ]
    }
  }
  ```

---

## 7. Bảng mã lỗi chuẩn (Error Codes)

| Mã HTTP | Mã lỗi | Ý nghĩa |
| :--- | :--- | :--- |
| `400` | `INVALID_VNU_EMAIL` | Email không hợp lệ (yêu cầu đuôi `@vnu.edu.vn`) |
| `400` | `EMAIL_ALREADY_EXISTS` | Email đã tồn tại trong hệ thống |
| `400` | `USER_ALREADY_IN_ROOM` | Người dùng đã thuộc một phòng khác |
| `401` | `UNAUTHORIZED` | Phiên đăng nhập hết hạn hoặc token không hợp lệ |
| `403` | `FORBIDDEN_NOT_ADMIN` | Quyền hạn yêu cầu vai trò Trưởng phòng (ADMIN) |
| `404` | `ROOM_NOT_FOUND` | Không tìm thấy phòng trọ |
| `404` | `USER_NOT_FOUND` | Không tìm thấy thông tin người dùng |
