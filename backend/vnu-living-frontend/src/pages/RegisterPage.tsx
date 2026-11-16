import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    studentId: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!form.email.endsWith("@vnu.edu.vn")) {
      setError("Email phải có đuôi @vnu.edu.vn");
      return;
    }

    if (!form.studentId.trim()) {
      setError("Vui lòng nhập Mã sinh viên (MSSV).");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await authApi.register({
        fullName: form.name,
        studentId: form.studentId,
        email: form.email,
        password: form.password
      });

      if (!res.success) {
        setError(res.message || "Đăng ký thất bại");
        return;
      }

      if (res.data) {
        authApi.setSession(res.data.token, res.data.user);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối tới Backend API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page single-auth">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">
          <div className="brand-mark">
            V
          </div>
        </div>

        <span className="eyebrow">
          VNU LIVING
        </span>

        <h2>Tạo tài khoản</h2>

        <p className="muted">
          Đăng ký tài khoản sinh viên và lưu trực tiếp vào cơ sở dữ liệu.
        </p>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <label>
          Họ và tên

          <input
            required
            value={form.name}
            onChange={(e) =>
              updateField("name", e.target.value)
            }
            placeholder="Nguyễn Văn A"
          />
        </label>

        <label>
          Mã số sinh viên (MSSV)

          <input
            required
            value={form.studentId}
            onChange={(e) =>
              updateField("studentId", e.target.value)
            }
            placeholder="22020001"
          />
        </label>

        <label>
          Email sinh viên (@vnu.edu.vn)

          <input
            required
            type="email"
            value={form.email}
            onChange={(e) =>
              updateField("email", e.target.value)
            }
            placeholder="name@vnu.edu.vn"
          />
        </label>

        <label>
          Mật khẩu

          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) =>
              updateField("password", e.target.value)
            }
            placeholder="Tối thiểu 6 ký tự"
          />
        </label>

        <button
          className="btn btn-primary full"
          type="submit"
          disabled={loading}
        >
          {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>

        <p className="auth-switch">
          Đã có tài khoản?{" "}
          <Link to="/login">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}