import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("hungnt@vnu.edu.vn");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();

    if (!email.endsWith("@vnu.edu.vn")) {
      setError("Vui lòng sử dụng email sinh viên @vnu.edu.vn");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setError("");
    navigate("/dashboard");
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-mark">V</div>
          VNU Living
        </div>

        <div>
          <span className="eyebrow">
            SMART CAMPUS LIVING
          </span>

          <h1>
            Tìm đúng người.
            <br />
            Ở đúng chỗ.
          </h1>

          <p>
            Ghép bạn cùng phòng và quản lý chi phí
            sinh hoạt minh bạch trong một nền tảng.
          </p>
        </div>

        <div className="feature-row">
          <span>✓ Email VNU</span>
        </div>
      </div>

      <div className="auth-card-wrap">
        <form className="auth-card" onSubmit={submit}>
          <div>
            <span className="eyebrow">
              CHÀO MỪNG
            </span>

            <h2>Đăng nhập</h2>

            <p className="muted">
              Sử dụng tài khoản sinh viên VNU của bạn.
            </p>
          </div>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          <label>
            Email sinh viên

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              type="email"
              placeholder="name@vnu.edu.vn"
              required
            />
          </label>

          <label>
            Mật khẩu

            <input
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              type="password"
              required
            />
          </label>

          <button
            className="btn btn-primary full"
            type="submit"
          >
            Đăng nhập
          </button>

          <p className="auth-switch">
            Chưa có tài khoản?{" "}
            <Link to="/register">
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}