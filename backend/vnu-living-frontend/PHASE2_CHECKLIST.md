# Checklist nghiệm thu FE Phase 2

## Môi trường
- [ ] `npm ci`, `npm run build`, `npm run test:phase2` thành công.
- [ ] `npm run dev` vẫn đăng nhập và mở được cả 6 trang Phase 1.
- [ ] `npm run dev:phase2` hiện banner MOCK trên Roommates và Expenses.

## Matching (mock)
- [ ] Có 4 hồ sơ, điểm 92/88/82/76%.
- [ ] Hòa Lạc + A2 chỉ hiện Demo A; Nội thành + Cầu Giấy + 3 km chỉ hiện Demo B; bán kính 1 km không có kết quả.
- [ ] Demo A gửi lời mời, xuất hiện trong tab đã gửi, không gửi trùng.
- [ ] Demo B: tab nhận -> ACCEPT, hiện contact demo; tải lại trang rồi REJECT, contact vẫn ẩn.
- [ ] Demo C đã ACCEPTED hiển thị contact demo; PENDING/REJECTED/NONE không hiển thị.

## Expense (mock)
- [ ] Ban đầu ví đỏ nợ 300.000đ, ví xanh 0đ; mở QR demo, kiểm tra tên/số tiền, đóng.
- [ ] EQUAL: thêm 600.000đ, người trả là chính mình, công nợ về 0đ.
- [ ] CUSTOM: thêm 100.000đ, người trả là chính mình, chỉ chọn người còn lại; ví xanh 100.000đ.
- [ ] METERED: 120 -> 220, đơn giá 4.500đ, người trả là chính mình; hóa đơn 450.000đ, ví xanh tăng lên 325.000đ.
- [ ] Không chọn người trong CUSTOM hoặc chỉ số mới <= cũ -> không ghi hóa đơn.
- [ ] Reload, dữ liệu demo trở về ban đầu. Các trang Phase 1 vẫn dùng DB thật và không phản ánh mock.

## Tích hợp thực tế (chưa nghiệm thu)
- [ ] Chiến xác nhận query lọc, GET requests, response và quyền truy cập contact. Test bằng 2 tài khoản.
- [ ] Duy xác nhận 3 payload, tiền chia, danh sách giao dịch và VietQR. Không quét chuyển tiền thật khi test.
- [ ] API lỗi/HTTP 429 có thông báo, không thay bằng mock.
- [ ] Kiểm tra ghi hóa đơn, công nợ, cache invalidation qua backend thật, không tạo trùng.
- [ ] Chạy hồi quy Phase 1, kiểm tra Git diff, commit và PR vào nhánh nhóm quy định.

## Bằng chứng kiểm tra khi tạo ZIP
- PASS: test mock qua TypeScript compiler toàn cục (không cần cài React).
- PASS: kiểm tra cú pháp toàn bộ 20 file TS/TSX trong src.
- PASS: kiểm tra TypeScript strict riêng các module types/mode/mock/api với khai báo ImportMeta tối thiểu.
- BLOCKED: npm ci trong môi trường tạo ZIP không truy cập được registry (EAI_AGAIN); chưa chạy build Vite/React đầy đủ, chưa kiểm tra trình duyệt hay API Phase 2 thật. Phải chạy lại trên máy Windows của thành viên trước khi push.
