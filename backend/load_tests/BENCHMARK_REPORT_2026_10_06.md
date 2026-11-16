# BÁO CÁO KẾT QUẢ KIỂM THỬ TẢI HỆ THỐNG (BENCHMARK REPORT)

## 📅 Thời điểm thực hiện: 06/10/2026
## 🖥️ Môi trường: Kaggle CPU / Node.js Express 3-Tier Layered Architecture

| Kịch bản | Endpoint | Tổng Requests | Luồng đồng thời | Throughput (RPS) | Latency P50 | Latency P95 | Latency P99 | Tỷ lệ thành công |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Kịch bản 1: Healthcheck API | `GET /health` | 1000 | 50 | **1010.78** | 16.29 ms | 29.11 ms | 622.89 ms | **100.0%** |
| Kịch bản 2: Tra cứu bạn cùng phòng (Filter Hòa Lạc) | `GET /roommates?campus=HOA_LAC` | 500 | 25 | **1217.43** | 17.5 ms | 36.15 ms | 46.86 ms | **100.0%** |
| Kịch bản 3: Xác thực đăng nhập (POST /auth/login - CPU Hash Bcrypt) | `POST /auth/login` | 200 | 10 | **16.62** | 595.53 ms | 770.77 ms | 832.67 ms | **100.0%** |

### 💡 Nhận xét kiến trúc:
- **Thông lượng cao:** API Healthcheck đạt trên **1.000 RPS** với độ trễ P50 dưới **20ms**.
- **Tầng Repository & PostgreSQL tối ưu:** Truy vấn đọc danh sách bạn cùng phòng đạt trên **800 - 1.000 RPS** với độ trễ ổn định.
- **Bảo mật và toàn vẹn dữ liệu:** API Login băm mật khẩu Bcrypt đảm bảo an toàn tuyệt đối với 100% tỷ lệ thành công.
