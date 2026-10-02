import { FormEvent, useState } from "react";

import PageHeader from "../components/PageHeader";

const initialProfile = {
  name: "Nguyễn Thanh Hưng",
  email: "hungnt@vnu.edu.vn",
  faculty: "Công nghệ thông tin",
  cohort: "K68",
  campus: "noi-thanh" as "hoa-lac" | "noi-thanh",
  sleepTime: "23:00",
  cleanliness: 4,
  noiseSensitivity: 3,
  smoking: false,
  pets: false,
  guests: true
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [saved, setSaved] = useState(false);
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
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  }

  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Thông tin được dùng cho matching bạn cùng phòng."
      />

      <form className="card profile-form" onSubmit={submit}>
        {saved && (
          <div className="alert success">
            Đã lưu thay đổi giao diện.
          </div>
        )}

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <div className="profile-head">
          <div className="avatar large">
            {profile.name.charAt(0)}
          </div>

          <div>
            <h3>{profile.name}</h3>
            <p>{profile.email}</p>
          </div>
        </div>

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
                <option key={x}>
                  {x}
                </option>
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
                Nội thành
              </option>

              <option value="hoa-lac">
                Hòa Lạc
              </option>
            </select>
          </label>

          <label>
            Giờ ngủ
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
            Độ sạch sẽ: {profile.cleanliness}/5
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
            Nhạy tiếng ồn: {profile.noiseSensitivity}/5
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
    </>
  );
}