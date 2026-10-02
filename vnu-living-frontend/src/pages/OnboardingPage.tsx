import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialProfile = {
  name: "",
  email: "student@vnu.edu.vn",
  faculty: "",
  cohort: "K68",
  campus: "noi-thanh" as "hoa-lac" | "noi-thanh",
  sleepTime: "23:00",
  cleanliness: 3,
  noiseSensitivity: 3,
  smoking: false,
  pets: false,
  guests: false
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialProfile);
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();

    if (!profile.name.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    if (!profile.faculty.trim()) {
      setError("Vui lòng nhập khoa/trường.");
      return;
    }

    setError("");
    navigate("/profile");
  }

  return (
    <div className="center-page">
      <form className="form-card wide" onSubmit={submit}>
        <div className="step-label">
          BƯỚC 1 / 1 · PROFILE VECTOR
        </div>

        <h2>Thiết lập thói quen sinh hoạt</h2>

        <p className="muted">
          Thông tin này giúp hệ thống tìm những người có lối sống phù hợp.
        </p>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <div className="form-grid">
          <label>
            Họ và tên
            <input
              value={profile.name}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  name: e.target.value
                })
              }
              placeholder="Nguyễn Văn A"
              required
            />
          </label>

          <label>
            Khoa / Trường
            <input
              value={profile.faculty}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  faculty: e.target.value
                })
              }
              placeholder="Công nghệ thông tin"
              required
            />
          </label>

          <label>
            Khóa
            <select
              value={profile.cohort}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  cohort: e.target.value
                })
              }
            >
              {["K66", "K67", "K68", "K69", "K70"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label>
            Cơ sở
            <select
              value={profile.campus}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  campus: e.target.value as "hoa-lac" | "noi-thanh"
                })
              }
            >
              <option value="noi-thanh">
                Nội thành Hà Nội
              </option>

              <option value="hoa-lac">
                Hòa Lạc
              </option>
            </select>
          </label>

          <label>
            Giờ ngủ thường ngày
            <input
              type="time"
              value={profile.sleepTime}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  sleepTime: e.target.value
                })
              }
              required
            />
          </label>

          <label>
            Độ sạch sẽ: <b>{profile.cleanliness}/5</b>
            <input
              type="range"
              min="1"
              max="5"
              value={profile.cleanliness}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  cleanliness: Number(e.target.value)
                })
              }
            />
          </label>

          <label>
            Nhạy cảm tiếng ồn: <b>{profile.noiseSensitivity}/5</b>
            <input
              type="range"
              min="1"
              max="5"
              value={profile.noiseSensitivity}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  noiseSensitivity: Number(e.target.value)
                })
              }
            />
          </label>
        </div>

        <div className="checkbox-grid">
          <label className="check">
            <input
              type="checkbox"
              checked={profile.smoking}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  smoking: e.target.checked
                })
              }
            />
            Hút thuốc
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={profile.pets}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  pets: e.target.checked
                })
              }
            />
            Có thú cưng
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={profile.guests}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  guests: e.target.checked
                })
              }
            />
            Thường có bạn bè tới
          </label>
        </div>

        <button className="btn btn-primary" type="submit">
          Lưu hồ sơ
        </button>
      </form>
    </div>
  );
}