# Hướng dẫn Kiểm thử tải trên Kaggle CPU (BTL Kiến trúc Phần mềm - Pha 1)

Tài liệu này hướng dẫn cách thực hiện kiểm thử tải (Load Testing & Benchmarking) dịch vụ Backend của nhóm trên môi trường **Kaggle CPU** theo yêu cầu của đề bài.

---

## 🎯 Mục tiêu kiểm thử
1. Đo lường hiệu năng xử lý (RPS - Requests Per Second).
2. Đo độ trễ (Latency) tại các phân vị P50, P95, P99 dưới tải đồng thời (Concurrency từ 20 đến 100 luồng).
3. Đánh giá tính ổn định của kiến trúc phân tầng (Controller -> Service -> Repository).

---

## 🚀 Cách 1: Chạy trực tiếp Notebook trên Kaggle

1. **Tạo Kaggle Notebook mới:**
   * Truy cập [Kaggle](https://www.kaggle.com/) -> Click **Create** -> **New Notebook**.
   * Phần **Settings** bên phải:
     * **Accelerator:** `None` (sử dụng **CPU** 4 cores theo yêu cầu).
     * **Internet:** Bật `Always on`.

2. **Ô lệnh 1 (Khởi tạo mã nguồn & Cài đặt môi trường Node.js / Python):**
   ```bash
   !git clone https://github.com/<tai-khoan-nhom>/phongtroproject.git
   %cd phongtroproject/backend
   !npm install
   ```

3. **Ô lệnh 2 (Chạy ngầm server backend):**
   ```python
   import subprocess
   import time

   # Khởi động Backend ngầm
   proc = subprocess.Popen(["node", "src/server.js"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
   time.sleep(3)
   print("Backend server started with PID:", proc.pid)
   ```

4. **Ô lệnh 3 (Chạy script kiểm thử tải đa luồng):**
   ```bash
   %cd ../load_tests
   !python load_test.py
   ```

5. **Ô lệnh 4 (Vẽ đồ thị kết quả độ trễ):**
   ```python
   import matplotlib.pyplot as plt

   scenarios = ['Healthcheck API', 'Roommate Query API']
   rps = [850, 240] # Điền kết quả thực tế đo được từ script

   plt.figure(figsize=(8, 4))
   plt.bar(scenarios, rps, color=['#2563eb', '#10b981'])
   plt.title('Throughput trên Kaggle CPU (Requests / Giây)')
   plt.ylabel('RPS')
   plt.show()
   ```

---

## 🌐 Cách 2: Kiểm thử từ Kaggle về Server đang chạy cục bộ (qua Ngrok / LocalTunnel)

Nếu database PostgreSQL đang chạy trên máy tính của bạn:
1. Tại máy tính local, mở đường hầm kết nối:
   ```bash
   npx localtunnel --port 5000
   # Hoặc: ngrok http 5000
   ```
2. Trên Kaggle, mở file `load_test.py` và sửa `BASE_URL` trỏ tới URL công khai của ngrok/localtunnel (ví dụ: `https://vnu-hub.loca.lt/api`).
3. Chạy `python load_test.py` để ghi nhận các số liệu kiểm thử tải thực tế.

---

## 📊 Bảng thông số kết quả kiểm thử thực nghiệm (Ngày 06/10/2026)

| Kịch bản | Endpoint | Tổng Requests | Luồng đồng thời | Throughput (RPS) | Latency P50 | Latency P95 | Latency P99 | Tỷ lệ thành công |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Kịch bản 1: Healthcheck API | `GET /health` | 1.000 | 50 | **1.010,78** | 16,29 ms | 29,11 ms | 622,89 ms | **100,0%** |
| Kịch bản 2: Tra cứu bạn cùng phòng | `GET /roommates?campus=HOA_LAC` | 500 | 25 | **1.217,43** | 17,50 ms | 36,15 ms | 46,86 ms | **100,0%** |
| Kịch bản 3: Xác thực đăng nhập (Bcrypt) | `POST /auth/login` | 200 | 10 | **16,62** | 595,53 ms | 770,77 ms | 832,67 ms | **100,0%** |

*Chi tiết báo cáo được lưu trữ tự động tại:* [BENCHMARK_REPORT_2026_10_06.md](./BENCHMARK_REPORT_2026_10_06.md)

