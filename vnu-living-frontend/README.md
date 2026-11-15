# VNU Living & Expense Hub — Frontend

React + TypeScript + Vite + React Router + CSS thuần. Phase 1 được giữ lại; Phase 2 do Thành viên 1 triển khai theo `../docs/PHASE2_PLAN.md` và `../API_CONTRACT.md` mục 8 (snapshot main `679744d7025ad802ceeaf62b3539601e151f86ce`, 12/11/2026).

## Chạy trên Windows (PowerShell)

Từ thư mục gốc repository, mở Docker Desktop:

```powershell
docker compose up -d postgres_db backend
curl.exe -i http://localhost:5000/api/health
```

Nếu backend bị `ECONNREFUSED` do PostgreSQL chưa sẵn sàng, đợi PostgreSQL sẵn sàng rồi `docker compose restart backend`. Không xóa volume. Chỉ seed nếu database local chưa có dữ liệu mẫu: `docker compose exec backend npm run seed`.

Từ `vnu-living-frontend`:

```powershell
npm ci
npm run dev:phase2
```

Mở http://localhost:5173 và đăng nhập tài khoản local (ví dụ `student1@vnu.edu.vn` / `Password123@` nếu đã seed). Login, Dashboard, Profile, Onboarding và Room vẫn gọi API Phase 1; chỉ Roommates và Expenses sử dụng mock Phase 2. Dữ liệu hai trang demo là độc lập với các trang dùng DB. Không ghi dữ liệu mock xuống DB. Reload trình duyệt sẽ reset các dữ liệu demo trong bộ nhớ.

## Ba chế độ

| Lệnh | Chức năng |
|---|---|
| `npm run dev` | Phase 1 gốc, API thật. Mặc định để tránh lỗi khi backend Phase 2 chưa xong. |
| `npm run dev:phase2` | UI Phase 2, mock tương tác cho Matching/Expense, yêu cầu đăng nhập thật. |
| `npm run dev:phase2:real` | UI Phase 2 + API thật, chỉ chạy sau khi hai backend đã cập nhật và xác nhận contract. |

Dừng Vite (`Ctrl+C`) trước khi chuyển chế độ. `VITE_PHASE2_MODE` nếu được đặt sẽ ưu tiên hơn tên mode Vite. Giá trị `baseline`, `mock`, `real`; mock chỉ được phép khi `import.meta.env.DEV`. Build mặc định dùng baseline. Để build Phase 2 thật sau khi tích hợp, đặt `$env:VITE_PHASE2_MODE = 'real'` rồi `npm run build` (xóa biến sau khi dùng: `Remove-Item Env:VITE_PHASE2_MODE`). Dockerfile/Nginx hiện có không thay đổi; nếu build Docker Phase 2 thật, nhóm cần truyền cấu hình Vite lúc build.

## Phần Phase 2

- Matching: điểm tương thích do API trả; bộ lọc campus/tòa/quận/bán kính; gửi lời mời, tab nhận/gửi, chấp nhận/từ chối; ẩn SĐT/Zalo trừ khi ACCEPTED và isUnlocked. Không tự tính Weighted Cosine Similarity.
- Expense: form EQUAL/CUSTOM/METERED, payerId, participantIds, meterDetails; validation; ví cá nhân theo `settlementTransactions`; QR modal. Không tự thực hiện Min-Cash-Flow trong chế độ real.
- Mock: mô phỏng phản hồi cho 4 hồ sơ, 2 thành viên phòng, các trạng thái lời mời, ba loại hóa đơn và công nợ. Mock QR chỉ chứa chữ demo, KHÔNG chuyển tiền. Không có QR hoặc xác nhận thanh toán giả trên API thật.

## Cần phối hợp trước khi merge / bật real

1. Backend 1: `GET /roommates` với JWT phải trả `compatibilityScore`, `matchStatus`, `contact`. Tên query `dormBuilding`, `district`, `radiusKm` và cách đo từ trường chỉ là giả định trong adapter, chưa được mục 8.1 xác định. Danh sách tòa/quận gợi ý trong UI là ví dụ, không phải danh mục chính thức.
2. Backend 1: mục 8.2 đã nêu POST/PUT `/matching/requests`; chưa nêu GET danh sách. Adapter tạm dùng `GET /matching/requests` với `data: {received, sent}` và các trường senderId/senderName/receiverId/receiverName/id/status/message/createdAt/contact (kế thừa hình dạng Phase 1). Có thể đặt `VITE_MATCHING_REQUESTS_PATH` để đổi path GET sau khi chốt; điều chỉnh types và adapter nếu response khác. Giả định ACCEPT kết nối chỉ mở khóa, không tự chuyển sang phòng, cần xác nhận. Backend chịu trách nhiệm Privacy Gate; FE không thể bảo mật thông tin đã bị server gửi trái phép.
3. Backend 2: dùng `POST /rooms/:roomId/expenses` và `GET /rooms/:roomId/balances` theo API Contract 8.3/8.4 (plan có cách ghi endpoint khác). Chốt quy tắc METERED, làm tròn VND và payload. Chế độ real khóa form nếu thiếu `settlementTransactions` để không gửi CUSTOM/METERED vào API Phase 1 vốn bỏ qua strategy. Đây là kiểm tra phòng ngừa, không thay thế việc nghiệm thu toàn bộ API. `version` hỗ trợ đọc; chưa có API sửa hóa đơn trong phân công FE, không thêm edit/optimistic locking UI.
4. Backend 2: QR dùng URL HTTPS do API cung cấp, kiểm tra lỗi ảnh; không có endpoint xác nhận thanh toán trong contract nên không tự đánh dấu đã trả. Không cần thêm trường tài khoản ngân hàng hay SĐT/Zalo vào Profile khi API chưa chốt. Redis, matching algorithm, security middleware, Strategy Pattern server, Min-Cash-Flow và load test là phạm vi backend/nhóm.

## Kiểm tra

```powershell
npm run test:phase2
npm run build
```

`test:phase2` kiểm tra logic mock (lọc, gửi trùng, ACCEPT/REJECT, privacy, dữ liệu theo user, chia tiền mẫu và công nợ). `build` kiểm tra TypeScript + bundling; cần chạy trên máy đã cài dependencies. Không dùng `npm run lint` thay cho build vì tsconfig gốc dùng project references.

Checklist chi tiết: `PHASE2_CHECKLIST.md`.

## Cấu trúc mới

- `src/phase2/types.ts`: kiểu dữ liệu API.
- `src/phase2/mode.ts`: lựa chọn chế độ.
- `src/phase2/api.ts`: adapter thật/mock.
- `src/phase2/mock.ts`: fixture và mô phỏng tương tác, không dùng trong real.
- `src/phase2/MatchingPage.tsx`, `ExpensesPage.tsx`: giao diện Phase 2.
- `src/App.tsx`: chọn trang theo mode; `src/styles.css`: CSS mới.
- `public/phase2-demo-qr.svg`: QR demo không thanh toán.
- `scripts/test-phase2.mjs`: kiểm thử mock.

API client Phase 1 vẫn dùng `/api` qua Vite proxy `localhost:5000` hoặc Nginx. Không cần đổi Backend, Docker, database schema hay API Contract khi chép bản này vào nhánh frontend.
