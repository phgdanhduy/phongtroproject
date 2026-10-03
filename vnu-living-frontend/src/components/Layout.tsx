import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function Layout() {
  const navigate = useNavigate();
  const user = authApi.getUser();

  const handleLogout = () => {
    authApi.logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">VNU</div>
          <div>
            <h1>VNU Living</h1>
            <p>{user?.fullName ? `${user.fullName}` : "Student housing hub"}</p>
            {user?.studentId && (
              <span style={{ fontSize: "0.75rem", opacity: 0.8, color: "var(--accent, #4f46e5)" }}>
                MSSV: {user.studentId}
              </span>
            )}
          </div>
        </div>

        <nav className="nav-menu">
          <NavLink to="/dashboard">Tổng quan</NavLink>
          <NavLink to="/onboarding">Hồ sơ ở ghép</NavLink>
          <NavLink to="/profile">Thông tin cá nhân</NavLink>
          <NavLink to="/roommates">Tìm bạn cùng phòng</NavLink>
          <NavLink to="/room">Phòng của tôi</NavLink>
          <NavLink to="/expenses">Chi phí</NavLink>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}