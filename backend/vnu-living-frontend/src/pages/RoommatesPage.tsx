import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { roommateApi } from "../services/api";

type CampusFilter = "ALL" | "HOA_LAC" | "NOI_THANH";
type TabType = "DISCOVER" | "RECEIVED" | "SENT";

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

interface RequestItem {
  id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string | null;
  createdAt: string;
  senderId?: number;
  senderName?: string;
  senderStudentId?: string;
  senderEmail?: string;
  senderFaculty?: string;
  senderCohort?: string;
  senderCampus?: string;
  receiverId?: number;
  receiverName?: string;
  receiverStudentId?: string;
  receiverEmail?: string;
  receiverFaculty?: string;
  receiverCohort?: string;
  receiverCampus?: string;
  roomId?: number;
  roomName?: string;
}

export default function RoommatesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("DISCOVER");
  const [campus, setCampus] = useState<CampusFilter>("ALL");
  const [roommates, setRoommates] = useState<RoommateItem[]>([]);
  const [requests, setRequests] = useState<{ received: RequestItem[]; sent: RequestItem[] }>({
    received: [],
    sent: []
  });
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRoommates();
    fetchRequests();
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

  async function fetchRequests() {
    try {
      const res = await roommateApi.getRequests();
      if (res.success && res.data) {
        setRequests(res.data);
        const pendingSent = new Set<number>(
          res.data.sent.filter((s: RequestItem) => s.status === "PENDING").map((s: RequestItem) => s.receiverId || 0)
        );
        setSentIds(pendingSent);
      }
    } catch (e) {
      console.error("Lỗi nạp yêu cầu ghép phòng:", e);
    }
  }

  async function handleSendRequest(person: RoommateItem) {
    try {
      setError("");
      setMsg("");
      const res = await roommateApi.sendRequest(
        person.userId,
        `Chào bạn, mình thấy hồ sơ thói quen sinh hoạt của bạn rất phù hợp và muốn gửi lời mời ghép phòng cùng bạn!`
      );
      if (res.success) {
        setMsg(`✅ Đã gửi lời mời ghép phòng tới ${person.fullName}! Lời mời đã được lưu vào mục "Lời mời đã gửi".`);
        setSentIds((prev) => new Set([...prev, person.userId]));
        fetchRequests();
      } else {
        setError(res.message || "Không thể gửi lời mời ghép phòng");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối");
    }
  }

  async function handleRespond(requestId: number, action: "ACCEPT" | "REJECT") {
    try {
      setError("");
      setMsg("");
      const res = await roommateApi.respondRequest(requestId, action);
      if (res.success) {
        setMsg(res.message || (action === "ACCEPT" ? "🎉 Bạn đã chấp nhận lời mời ghép phòng thành công! Đang chuyển hướng..." : "Đã từ chối lời mời ghép phòng."));
        fetchRequests();
        fetchRoommates();
        if (action === "ACCEPT") {
          setTimeout(() => {
            navigate("/room");
          }, 1200);
        }
      } else {
        setError(res.message || "Không thể phản hồi yêu cầu");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi phản hồi yêu cầu");
    }
  }

  const pendingReceivedCount = requests.received.filter((r) => r.status === "PENDING").length;

  return (
    <>
      <PageHeader
        title="Tìm bạn cùng phòng"
        description="Dữ liệu đồng bộ trực tiếp từ Database PostgreSQL Docker."
        action={
          <Link className="btn btn-primary" to="/room">
            Phòng của tôi
          </Link>
        }
      />

      {msg && (
        <div className="alert success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span>{msg}</span>
          <Link to="/room" className="btn btn-primary" style={{ padding: "4px 12px", fontSize: "12px", textDecoration: "none" }}>
            🏠 Xem Phòng của tôi →
          </Link>
        </div>
      )}
      {error && <div className="alert error">{error}</div>}

      {/* Tabs navigation */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #dfe6e1", paddingBottom: "12px", flexWrap: "wrap" }}>
        <button
          className={`btn ${activeTab === "DISCOVER" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("DISCOVER")}
        >
          🧑‍🤝‍🧑 Khám phá bạn cùng phòng ({roommates.length})
        </button>

        <button
          className={`btn ${activeTab === "RECEIVED" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("RECEIVED")}
          style={{ position: "relative" }}
        >
          📬 Lời mời đã nhận
          {pendingReceivedCount > 0 && (
            <span
              style={{
                marginLeft: "8px",
                background: "#d32f2f",
                color: "white",
                padding: "2px 7px",
                borderRadius: "999px",
                fontSize: "10px",
                fontWeight: 700
              }}
            >
              {pendingReceivedCount}
            </span>
          )}
        </button>

        <button
          className={`btn ${activeTab === "SENT" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("SENT")}
        >
          📤 Lời mời đã gửi ({requests.sent.length})
        </button>
      </div>

      {/* TAB 1: KHÁM PHÁ BẠN CÙNG PHÒNG */}
      {activeTab === "DISCOVER" && (
        <>
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

          <div className="roommate-grid">
            {roommates.map((person) => {
              const isSent = sentIds.has(person.userId);
              return (
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

                  {person.bio && (
                    <p className="muted" style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                      "{person.bio}"
                    </p>
                  )}

                  <button
                    className={`btn ${isSent ? "btn-outline" : "btn-primary"} full`}
                    style={{ marginTop: "12px" }}
                    disabled={isSent}
                    onClick={() => handleSendRequest(person)}
                  >
                    {isSent ? "✓ Đã gửi lời mời" : "📩 Gửi lời mời ghép phòng"}
                  </button>
                </article>
              );
            })}

            {!loading && roommates.length === 0 && (
              <div className="empty card" style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center" }}>
                Không có sinh viên nào phù hợp với bộ lọc này.
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: LỜI MỜI ĐÃ NHẬN */}
      {activeTab === "RECEIVED" && (
        <div style={{ display: "grid", gap: "14px" }}>
          {requests.received.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <h3>Chưa có lời mời ghép phòng nào gửi tới bạn.</h3>
              <p className="muted" style={{ marginTop: "6px" }}>
                Khi có bạn sinh viên khác gửi yêu cầu ghép phòng tới bạn, danh sách sẽ hiển thị tại đây để bạn chấp nhận hoặc từ chối.
              </p>
            </div>
          ) : (
            requests.received.map((req) => (
              <article className="card" key={req.id} style={{ padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div className="avatar large">
                    {req.senderName ? req.senderName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>{req.senderName}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                      {req.senderFaculty || "Sinh viên VNU"} · MSSV: {req.senderStudentId} · Email: {req.senderEmail}
                    </p>
                    {req.roomName && (
                      <span className="tag" style={{ background: "#e8f4ed", color: "#0d4e31", marginTop: "6px", display: "inline-block" }}>
                        🏠 Đang ở: {req.roomName}
                      </span>
                    )}
                    {req.message && (
                      <p style={{ margin: "8px 0 0", fontSize: "12px", fontStyle: "italic", color: "#444" }}>
                        "{req.message}"
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {req.status === "PENDING" ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRespond(req.id, "ACCEPT")}
                      >
                        ✅ Chấp nhận
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ color: "#d32f2f", borderColor: "#d32f2f" }}
                        onClick={() => handleRespond(req.id, "REJECT")}
                      >
                        ❌ Từ chối
                      </button>
                    </div>
                  ) : req.status === "ACCEPTED" ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <span style={{ color: "#087a43", fontWeight: 700, fontSize: "13px" }}>
                        ✓ Đã chấp nhận {req.roomName ? `· ${req.roomName}` : ""}
                      </span>
                      <Link
                        to="/room"
                        className="btn btn-primary"
                        style={{ padding: "6px 14px", fontSize: "12px", textDecoration: "none" }}
                      >
                        🏠 Xem phòng của tôi ngay →
                      </Link>
                    </div>
                  ) : (
                    <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                      ✗ Đã từ chối
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* TAB 3: LỜI MỜI ĐÃ GỬI */}
      {activeTab === "SENT" && (
        <div style={{ display: "grid", gap: "14px" }}>
          {requests.sent.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <h3>Bạn chưa gửi lời mời ghép phòng nào.</h3>
              <p className="muted" style={{ marginTop: "6px" }}>
                Hãy chuyển sang tab "Khám phá bạn cùng phòng" và nhấn "Gửi lời mời ghép phòng" để bắt đầu tìm kiếm!
              </p>
            </div>
          ) : (
            requests.sent.map((req) => (
              <article className="card" key={req.id} style={{ padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div className="avatar large">
                    {req.receiverName ? req.receiverName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>Gửi tới: {req.receiverName}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                      {req.receiverFaculty || "Sinh viên VNU"} · MSSV: {req.receiverStudentId} · Email: {req.receiverEmail}
                    </p>
                    <span style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", display: "inline-block" }}>
                      Thời gian gửi: {new Date(req.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                <div>
                  {req.status === "PENDING" && (
                    <span style={{ background: "#fff8e1", color: "#b78103", padding: "6px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "12px" }}>
                      ⏳ Đang chờ đối phương phản hồi
                    </span>
                  )}
                  {req.status === "ACCEPTED" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <span style={{ background: "#e8f4ed", color: "#087a43", padding: "6px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "12px" }}>
                        🎉 Đối phương đã đồng ý ghép phòng! {req.roomName ? `(${req.roomName})` : ""}
                      </span>
                      <Link
                        to="/room"
                        className="btn btn-primary"
                        style={{ padding: "6px 14px", fontSize: "12px", textDecoration: "none" }}
                      >
                        🏠 Vào phòng chung ngay →
                      </Link>
                    </div>
                  )}
                  {req.status === "REJECTED" && (
                    <span style={{ background: "#ffebee", color: "#c62828", padding: "6px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "12px" }}>
                      ❌ Đối phương đã từ chối
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </>
  );
}