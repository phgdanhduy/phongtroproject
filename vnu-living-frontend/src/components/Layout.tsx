import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">VNU</div>
          <div>
            <h1>VNU Living</h1>
            <p>Student housing hub</p>
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