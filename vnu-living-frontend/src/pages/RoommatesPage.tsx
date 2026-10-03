import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { roommateApi } from "../services/api";

type CampusFilter = "ALL" | "HOA_LAC" | "NOI_THANH";

interface RoommateItem {
  userId: number;
  fullName: string;
  studentId: string;
  faculty: string | null;
  cohort: string | null;
  campus: "HOA_LAC" | "NOI_THANH";
  locationDetail: string | null;
  budget: number;
  habits: {
    sleepSchedule: "EARLY" | "NIGHT_OWL";
    cleanliness: number;
    noiseLevel: "QUIET" | "NORMAL";
    smoking: boolean;
    hasPet: boolean;
  };
  bio: string | null;
}

export default function RoommatesPage() {
  const [campus, setCampus] = useState<CampusFilter>("ALL");
  const [roommates, setRoommates] = useState<RoommateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRoommates();
  }, [campus]);

  async function fetchRoommates() {
    try {
      setLoading(true);
      setError("");
      const res = await roommateApi.getRoommates({
        campus: campus === "ALL" ? undefined : campus,
      });
      if (res.success && Array.isArray(res.data)) {
        setRoommates(res.data);
      } else {
        setError(res.message || "Không thể tải danh sách");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Tìm bạn cùng phòng"
        description="Dữ liệu đồng bộ trực tiếp từ Database PostgreSQL Docker."
        action={
          <Link className="btn btn-primary" to="/room">
            Tạo phòng trọ
          </Link>
        }
      />

      <div className="filter-bar">
        <select
          value={campus}
          onChange={(e) => setCampus(e.target.value as CampusFilter)}
        >
          <option value="ALL">Tất cả cơ sở</option>
          <option value="HOA_LAC">Hòa Lạc</option>
          <option value="NOI_THANH">Nội thành</option>
        </select>

        <span className="result-count">
          {loading ? "Đang tải..." : `${roommates.length} sinh viên`}
        </span>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="roommate-grid">
        {roommates.map((person) => (
          <article className="roommate-card" key={person.userId}>
            <div className="roommate-top">
              <div className="avatar large">
                {person.fullName ? person.fullName.charAt(0).toUpperCase() : "U"}
              </div>

              <span className="compatibility">
                MSSV: {person.studentId}
              </span>
            </div>

            <h3>{person.fullName || "Sinh viên VNU"}</h3>

            <p>
              {person.faculty || "Chưa cập nhật khoa"} · {person.cohort || "K6x"}
            </p>

            <div className="habit-tags">
              <span>{person.campus === "HOA_LAC" ? "Hòa Lạc" : "Nội thành"}</span>
              <span>{person.habits?.sleepSchedule === "EARLY" ? "Ngủ sớm" : "Cú đêm"}</span>
              <span>Sạch sẽ {person.habits?.cleanliness || 4}/5</span>
              <span>Ngân sách: {Number(person.budget || 0).toLocaleString()} đ</span>
            </div>

            {person.bio && <p className="muted" style={{ marginTop: "8px", fontSize: "0.85rem" }}>"{person.bio}"</p>}

            <button
              className="btn btn-outline full"
              style={{ marginTop: "12px" }}
              onClick={() =>
                alert(`Đã gửi yêu cầu ghép phòng tới ${person.fullName}!`)
              }
            >
              Gửi lời mời ghép phòng
            </button>
          </article>
        ))}

        {!loading && roommates.length === 0 && (
          <div className="empty card">
            Không có sinh viên nào phù hợp với bộ lọc này.
          </div>
        )}
      </div>
    </>
  );
}