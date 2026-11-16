import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("student1@vnu.edu.vn");
  const [password, setPassword] = useState("Password123@");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!email.endsWith("@vnu.edu.vn")) {
      setError("Vui lòng sử dụng email sinh viên @vnu.edu.vn");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await authApi.login({ email, password });

      if (!res.success) {
        setError(res.message || "Email hoặc mật khẩu không chính xác.");
        return;
      }

      if (res.data) {
        authApi.setSession(res.data.token, res.data.user);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
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
          <span>✓ Xác thực PostgreSQL Docker</span>
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
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
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