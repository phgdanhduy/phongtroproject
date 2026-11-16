import { FormEvent, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { authApi, userApi } from "../services/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    studentId: "",
    faculty: "",
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await userApi.getMe();
      if (res.success && res.data) {
        const u = res.data;
        const p = u.profile || {};
        const h = p.habits || {};
        setProfile({
          name: u.fullName || "",
          email: u.email || "",
          studentId: u.studentId || "",
          faculty: p.faculty || "",
          cohort: p.cohort || "K68",
          campus: (p.campus === "NOI_THANH" ? "NOI_THANH" : "HOA_LAC"),
          sleepSchedule: (h.sleepSchedule === "EARLY" ? "EARLY" : "NIGHT_OWL"),
          cleanliness: h.cleanliness || 4,
          noiseLevel: (h.noiseLevel === "NORMAL" ? "NORMAL" : "QUIET"),
          smoking: !!h.smoking,
          hasPet: !!h.hasPet,
          bio: p.bio || "",
          budget: p.budget || 1500000
        });
      } else {
        // Fallback to local user
        const local = authApi.getUser();
        if (local) {
          setProfile((curr) => ({
            ...curr,
            name: local.fullName,
            email: local.email,
            studentId: local.studentId
          }));
        }
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!profile.faculty.trim()) {
      setError("Vui lòng nhập Khoa / Trường của bạn.");
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

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Lỗi lưu hồ sơ vào Database");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center" }}>
        Đang nạp hồ sơ từ PostgreSQL Docker...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Thông tin được lưu trữ trong Database Docker và dùng để matching bạn cùng phòng."
      />

      <form className="card profile-form" onSubmit={submit}>
        {saved && (
          <div className="alert success">
            ✅ Đã lưu cập nhật vào Database PostgreSQL Docker thành công!
          </div>
        )}

        {error && (
          <div className="alert error">
            ❌ {error}
          </div>
        )}

        <div className="profile-head">
          <div className="avatar large">
            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </div>

          <div>
            <h3>{profile.name || "Sinh viên VNU"}</h3>
            <p>{profile.email} · MSSV: {profile.studentId}</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Họ và tên (Từ tài khoản)
            <input
              value={profile.name}
              disabled
              title="Họ và tên gắn liền với tài khoản đăng ký"
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
              placeholder="VD: Công nghệ Thông tin"
              required
            />
          </label>

          <label>
            Khóa học
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
            Ngân sách thuê phòng (VNĐ/tháng)
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
            Lịch ngủ
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
            Mức độ sạch sẽ: <b>{profile.cleanliness}/5</b>
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
            Môi trường âm thanh
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
            Có hút thuốc
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
            Có nuôi thú cưng
          </label>
        </div>

        <label style={{ marginTop: "12px" }}>
          Giới thiệu bản thân & mong muốn ở ghép
          <textarea
            rows={3}
            value={profile.bio}
            onChange={(e) =>
              setProfile({
                ...profile,
                bio: e.target.value
              })
            }
            placeholder="Chia sẻ thêm về bản thân, sở thích hoặc thói quen để tìm bạn dễ hơn..."
            style={{ width: "100%", marginTop: "6px", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: "16px" }}>
          {saving ? "Đang lưu vào DB..." : "Lưu vào Database"}
        </button>
      </form>
    </>
  );
}