import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../services/api";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    faculty: "Công nghệ Thông tin",
    cohort: "K68",
    campus: "HOA_LAC" as "HOA_LAC" | "NOI_THANH",
    sleepSchedule: "NIGHT_OWL" as "EARLY" | "NIGHT_OWL",
    cleanliness: 4,
    noiseLevel: "QUIET" as "QUIET" | "NORMAL",
    smoking: false,
    hasPet: false,
    bio: "",
    budget: 1500000
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!profile.faculty.trim()) {
      setError("Vui lòng nhập khoa/trường.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        faculty: profile.faculty,
        cohort: profile.cohort,
        campus: profile.campus,
        budget: profile.budget,
        bio: profile.bio,
        habits: {
          sleepSchedule: profile.sleepSchedule,
          cleanliness: profile.cleanliness,
          noiseLevel: profile.noiseLevel,
          smoking: profile.smoking,
          hasPet: profile.hasPet
        }
      };

      const res = await userApi.updateProfile(payload);
      if (!res.success) {
        setError(res.message || "Không thể lưu hồ sơ");
        return;
      }

      navigate("/profile");
    } catch (err: any) {
      setError(err.message || "Lỗi lưu hồ sơ vào Database");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="center-page">
      <form className="form-card wide" onSubmit={submit}>
        <div className="step-label">
          BƯỚC 1 / 1 · PROFILE VECTOR
        </div>

        <h2>Thiết lập thói quen sinh hoạt</h2>

        <p className="muted">
          Thông tin này được lưu vào PostgreSQL Docker để tìm kiếm bạn cùng phòng phù hợp.
        </p>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <div className="form-grid">
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
              placeholder="Công nghệ Thông tin"
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
              {["K65", "K66", "K67", "K68", "K69", "K70"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label>
            Cơ sở học tập
            <select
              value={profile.campus}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  campus: e.target.value as "HOA_LAC" | "NOI_THANH"
                })
              }
            >
              <option value="HOA_LAC">Hòa Lạc</option>
              <option value="NOI_THANH">Nội thành Hà Nội</option>
            </select>
          </label>

          <label>
            Ngân sách (VNĐ/tháng)
            <input
              type="number"
              step="100000"
              value={profile.budget}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  budget: Number(e.target.value)
                })
              }
            />
          </label>

          <label>
            Thói quen ngủ
            <select
              value={profile.sleepSchedule}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  sleepSchedule: e.target.value as "EARLY" | "NIGHT_OWL"
                })
              }
            >
              <option value="EARLY">Ngủ sớm (trước 23:00)</option>
              <option value="NIGHT_OWL">Cú đêm (sau 00:00)</option>
            </select>
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
            Mức độ ồn
            <select
              value={profile.noiseLevel}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  noiseLevel: e.target.value as "QUIET" | "NORMAL"
                })
              }
            >
              <option value="QUIET">Yên tĩnh tuyệt đối</option>
              <option value="NORMAL">Bình thường</option>
            </select>
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
              checked={profile.hasPet}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  hasPet: e.target.checked
                })
              }
            />
            Có thú cưng
          </label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Đang lưu vào DB..." : "Hoàn thành & Lưu hồ sơ"}
        </button>
      </form>
    </div>
  );
}