# VNU Living & Expense Hub — Frontend

Frontend Phase 1 (Baseline) for the VNU Living project.

## Stack
- React + TypeScript
- Vite
- React Router
- CSS thuần
- Docker + Nginx

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Chạy Docker

```bash
docker build -t vnu-living-frontend .
docker run --rm -p 8080:80 vnu-living-frontend
```

Mở `http://localhost:8080`.

## Mock mode

Frontend hiện chạy độc lập bằng `localStorage` + mock data để nhóm có thể demo ngay cả khi backend chưa xong.

JWT demo được lưu tại:
`localStorage["vnu_token"]`

## Khi backend hoàn thành

Tạo `.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

Các API đã được chuẩn bị trong `src/services/api.ts`:

- `POST /auth/login`
- `POST /auth/register`
- `GET /profile`
- `PUT /profile`
- `GET /roommates`
- `POST /rooms`
- `GET /rooms/:id`
- `GET /rooms/:id/expenses`
- `POST /rooms/:id/expenses`

Chỉ cần thay logic mock trong các page bằng các hàm `authApi`, `profileApi`, `matchingApi`, `roomApi`, `expenseApi`.

## Các trang Phase 1

- `/login`
- `/register`
- `/onboarding`
- `/`
- `/profile`
- `/roommates`
- `/room`
- `/expenses`
- `/admin`
