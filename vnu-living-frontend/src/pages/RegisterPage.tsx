import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();

    if (!form.email.endsWith("@vnu.edu.vn")) {
      setError("Email phải có đuôi @vnu.edu.vn");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setError("");
    navigate("/onboarding");
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
          Bắt đầu thiết lập hồ sơ sống của bạn.
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
          Email sinh viên

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
          />
        </label>

        <button
          className="btn btn-primary full"
          type="submit"
        >
          Tạo tài khoản
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