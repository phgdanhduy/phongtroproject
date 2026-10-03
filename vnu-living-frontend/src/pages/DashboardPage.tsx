import { Link } from "react-router-dom";

import PageHeader from "../components/PageHeader";

const room = {
  name: "Phòng VNU 001",
  campus: "Nội thành Hà Nội",
  memberCount: 2,
  capacity: 4
};

const expenses = [
  {
    id: "e1",
    name: "Tiền điện",
    amount: 450000
  },
  {
    id: "e2",
    name: "Tiền nước",
    amount: 120000
  },
  {
    id: "e3",
    name: "Internet",
    amount: 200000
  }
];

const totalExpense = expenses.reduce(
  (sum, item) => sum + item.amount,
  0
);

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Theo dõi nhanh phòng trọ, bạn cùng phòng và chi phí sinh hoạt."
      />

      <div className="dashboard-grid">
        <section className="card stat-card">
          <span className="eyebrow">PHÒNG HIỆN TẠI</span>
          <h2>{room.name}</h2>
          <p className="muted">
            {room.campus} · {room.memberCount}/{room.capacity} thành viên
          </p>

          <Link className="btn btn-outline" to="/room">
            Xem phòng
          </Link>
        </section>

        <section className="card stat-card">
          <span className="eyebrow">CHI PHÍ THÁNG NÀY</span>
          <h2>{totalExpense.toLocaleString("vi-VN")}đ</h2>
          <p className="muted">
            Dữ liệu minh họa cho giao diện chia chi phí.
          </p>

          <Link className="btn btn-outline" to="/expenses">
            Xem chi phí
          </Link>
        </section>

        <section className="card stat-card">
          <span className="eyebrow">MATCHING</span>
          <h2>3 gợi ý</h2>
          <p className="muted">
            Danh sách sinh viên phù hợp theo hồ sơ sống.
          </p>

          <Link className="btn btn-outline" to="/roommates">
            Tìm bạn cùng phòng
          </Link>
        </section>
      </div>

      <section className="card">
        <div className="section-head">
          <div>
            <span className="eyebrow">QUY TRÌNH</span>
            <h3>Hoàn thiện hồ sơ để bắt đầu ghép phòng</h3>
          </div>
        </div>

        <div className="step-list">
          <div>
            <strong>1. Thiết lập hồ sơ</strong>
            <p className="muted">
              Nhập cơ sở, khóa, khoa và thói quen sinh hoạt.
            </p>
          </div>

          <div>
            <strong>2. Tìm bạn cùng phòng</strong>
            <p className="muted">
              Lọc sinh viên theo cơ sở, khóa và khoa/trường.
            </p>
          </div>

          <div>
            <strong>3. Quản lý chi phí</strong>
            <p className="muted">
              Thêm khoản chi và xem phần chia đều giữa các thành viên.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}