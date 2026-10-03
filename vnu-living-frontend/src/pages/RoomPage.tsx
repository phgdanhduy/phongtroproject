import { FormEvent, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { roomApi } from "../services/api";

interface RoomData {
  id: number;
  name: string;
  campus: "HOA_LAC" | "NOI_THANH";
  addressOrBlock: string | null;
  members: Array<{
    userId: number;
    fullName: string;
    studentId: string;
    role: string;
  }>;
}

export default function RoomPage() {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    campus: "HOA_LAC" as "HOA_LAC" | "NOI_THANH",
    addressOrBlock: ""
  });

  useEffect(() => {
    loadMyRoom();
  }, []);

  async function loadMyRoom() {
    try {
      setLoading(true);
      setError("");
      const res = await roomApi.getMyRoom();
      if (res.success && res.data) {
        setRoom(res.data);
      } else {
        setRoom(null);
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải thông tin phòng");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên phòng");
      return;
    }

    try {
      setError("");
      setMsg("");
      const res = await roomApi.createRoom({
        name: form.name,
        campus: form.campus,
        addressOrBlock: form.addressOrBlock
      });

      if (!res.success) {
        setError(res.message || "Tạo phòng thất bại");
        return;
      }

      setMsg("✅ Tạo phòng thành công!");
      setCreating(false);
      loadMyRoom();
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối");
    }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!room || !memberEmail.trim()) return;

    try {
      setError("");
      setMsg("");
      const res = await roomApi.addMember(room.id, memberEmail.trim());
      if (!res.success) {
        setError(res.message || "Không thể thêm thành viên");
        return;
      }

      setMsg("✅ Đã thêm thành viên vào phòng thành công!");
      setMemberEmail("");
      setAddingMember(false);
      loadMyRoom();
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối");
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center" }}>
        Đang nạp dữ liệu phòng từ Database Docker...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Phòng của tôi"
        description="Quản lý phòng trọ và thành viên trong Database PostgreSQL."
        action={
          !room && (
            <button
              className="btn btn-primary"
              onClick={() => setCreating(!creating)}
            >
              {creating ? "Đóng" : "Tạo phòng trọ mới"}
            </button>
          )
        }
      />

      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}

      {creating && (
        <form className="card inline-form" onSubmit={handleCreateRoom} style={{ marginBottom: "20px" }}>
          <label>
            Tên phòng / KTX
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
              placeholder="VD: Phòng 402 - KTX QGHN"
            />
          </label>

          <label>
            Địa chỉ / Tòa nhà
            <input
              value={form.addressOrBlock}
              onChange={(e) =>
                setForm({
                  ...form,
                  addressOrBlock: e.target.value
                })
              }
              placeholder="VD: Nhà B4, Thạch Thất"
            />
          </label>

          <label>
            Khu vực
            <select
              value={form.campus}
              onChange={(e) =>
                setForm({
                  ...form,
                  campus: e.target.value as "HOA_LAC" | "NOI_THANH"
                })
              }
            >
              <option value="HOA_LAC">Hòa Lạc</option>
              <option value="NOI_THANH">Nội thành Hà Nội</option>
            </select>
          </label>

          <button className="btn btn-primary" type="submit">
            Tạo phòng vào DB
          </button>
        </form>
      )}

      {room ? (
        <section className="room-detail card">
          <div className="room-detail-head">
            <div>
              <span className="eyebrow">PHÒNG ĐÃ THAM GIA</span>
              <h2>{room.name}</h2>
              <p>
                {room.campus === "HOA_LAC" ? "Cơ sở Hòa Lạc" : "Nội thành"}
                {room.addressOrBlock ? ` · ${room.addressOrBlock}` : ""}
                {` · ${room.members?.length || 0} thành viên`}
              </p>
            </div>

            <div className="room-icon big">⌂</div>
          </div>

          <div style={{ margin: "16px 0", display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="btn btn-outline"
              onClick={() => setAddingMember(!addingMember)}
            >
              {addingMember ? "Hủy" : "+ Mời thêm bạn vào phòng"}
            </button>
          </div>

          {addingMember && (
            <form onSubmit={handleAddMember} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <input
                required
                type="email"
                placeholder="Nhập email VNU của bạn (VD: student2@vnu.edu.vn)"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
              <button className="btn btn-primary" type="submit">
                Thêm vào phòng
              </button>
            </form>
          )}

          <h4 style={{ marginTop: "16px" }}>Danh sách thành viên trong phòng (Lưu từ DB):</h4>
          <div className="member-grid">
            {room.members?.map((member) => (
              <div className="member-card" key={member.userId}>
                <div className="avatar">
                  {member.fullName ? member.fullName.charAt(0).toUpperCase() : "U"}
                </div>

                <div>
                  <strong>{member.fullName}</strong>
                  <span>MSSV: {member.studentId} · <b>{member.role}</b></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        !creating && (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <h3>Bạn hiện chưa tham gia phòng trọ nào.</h3>
            <p className="muted" style={{ margin: "10px 0 20px" }}>
              Bạn có thể tạo một phòng mới hoặc chờ bạn cùng phòng thêm bạn vào phòng bằng email.
            </p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              + Tạo phòng mới ngay
            </button>
          </div>
        )
      )}
    </>
  );
}