import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { authApi, expenseApi, roomApi, roommateApi } from "../services/api";

export default function DashboardPage() {
  const user = authApi.getUser();
  const [room, setRoom] = useState<any>(null);
  const [totalExpense, setTotalExpense] = useState(0);
  const [roommateCount, setRoommateCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [roomRes, roommatesRes] = await Promise.all([
        roomApi.getMyRoom(),
        roommateApi.getRoommates()
      ]);

      if (roomRes.success && roomRes.data) {
        setRoom(roomRes.data);
        const expRes = await expenseApi.getExpenses(roomRes.data.id);
        if (expRes.success && Array.isArray(expRes.data)) {
          const sum = expRes.data.reduce((acc, curr) => acc + curr.amount, 0);
          setTotalExpense(sum);
        }
      }

      if (roommatesRes.success && Array.isArray(roommatesRes.data)) {
        setRoommateCount(roommatesRes.data.length);
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
  }

  return (
    <>
      <PageHeader
        title={`Xin chào, ${user?.fullName || "Sinh viên VNU"}!`}
        description="Theo dõi phòng trọ, bạn cùng phòng và chi phí sinh hoạt từ Database PostgreSQL Docker."
      />

      <div className="dashboard-grid">
        <section className="card stat-card">
          <span className="eyebrow">PHÒNG HIỆN TẠI</span>
          <h2>{room ? room.name : "Chưa có phòng"}</h2>
          <p className="muted">
            {room
              ? `${room.campus === "HOA_LAC" ? "Hòa Lạc" : "Nội thành"} · ${room.members?.length || 0} thành viên`
              : "Bạn chưa tham gia phòng trọ nào"}
          </p>

          <Link className="btn btn-outline" to="/room">
            {room ? "Xem phòng" : "Tạo hoặc tìm phòng"}
          </Link>
        </section>

        <section className="card stat-card">
          <span className="eyebrow">CHI PHÍ PHÒNG HIỆN TẠI</span>
          <h2>{totalExpense.toLocaleString("vi-VN")}đ</h2>
          <p className="muted">
            {room ? "Tổng chi phí hóa đơn đã thêm vào phòng" : "Cần có phòng để tính chi phí"}
          </p>

          <Link className="btn btn-outline" to="/expenses">
            Xem chi phí & chia tiền
          </Link>
        </section>

        <section className="card stat-card">
          <span className="eyebrow">TÌM BẠN CÙNG PHÒNG</span>
          <h2>{roommateCount} sinh viên</h2>
          <p className="muted">
            Hồ sơ sinh viên VNU đang tìm bạn ở ghép trong DB.
          </p>

          <Link className="btn btn-outline" to="/roommates">
            Tìm bạn cùng phòng
          </Link>
        </section>
      </div>

      <section className="card">
        <div className="section-head">
          <div>
            <span className="eyebrow">QUY TRÌNH SỬ DỤNG</span>
            <h3>Hướng dẫn trải nghiệm toàn diện hệ thống</h3>
          </div>
        </div>

        <div className="step-list">
          <div>
            <strong>1. Thiết lập hồ sơ cá nhân</strong>
            <p className="muted">
              Vào mục "Thông tin cá nhân" để lưu cơ sở học tập, khóa, khoa và thói quen sinh hoạt vào DB.
            </p>
          </div>

          <div>
            <strong>2. Khám phá bạn cùng phòng</strong>
            <p className="muted">
              Vào mục "Tìm bạn cùng phòng" để lọc sinh viên theo cơ sở (Hòa Lạc / Nội thành) từ Database.
            </p>
          </div>

          <div>
            <strong>3. Quản lý phòng & Chi phí</strong>
            <p className="muted">
              Tạo phòng trọ, thêm email bạn cùng phòng và tạo hóa đơn để hệ thống tự động tính số dư chia tiền.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}