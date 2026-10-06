import { FormEvent, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { authApi, roomApi } from "../services/api";

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
  const [editing, setEditing] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    campus: "HOA_LAC" as "HOA_LAC" | "NOI_THANH",
    addressOrBlock: ""
  });

  const [editForm, setEditForm] = useState({
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
        setEditForm({
          name: res.data.name,
          campus: res.data.campus,
          addressOrBlock: res.data.addressOrBlock || ""
        });

        // Load pending invites for this room
        const invRes = await roomApi.getRoomInvitations(res.data.id);
        if (invRes.success && Array.isArray(invRes.data)) {
          setPendingInvites(invRes.data);
        }
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

  async function handleUpdateRoom(e: FormEvent) {
    e.preventDefault();
    if (!room) return;

    try {
      setError("");
      setMsg("");
      const res = await roomApi.updateRoom(room.id, editForm);
      if (!res.success) {
        setError(res.message || "Không thể cập nhật phòng");
        return;
      }

      setMsg("✅ Đã cập nhật thông số phòng trọ thành công!");
      setEditing(false);
      loadMyRoom();
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối khi cập nhật phòng");
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
        setError(res.message || "Không thể gửi lời mời vào phòng");
        return;
      }

      setMsg(res.message || "✅ Đã gửi lời mời tham gia phòng thành công! Lời mời đã được chuyển tới bạn ấy.");
      setMemberEmail("");
      setAddingMember(false);
      loadMyRoom();
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối");
    }
  }

  async function handleDeleteRoom() {
    if (!room) return;
    const confirmDelete = window.confirm(
      `⚠️ Bạn có chắc chắn muốn giải tán / xóa "${room.name}" không?\n\nToàn bộ danh sách thành viên và các khoản chi tiêu của phòng sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.`
    );
    if (!confirmDelete) return;

    try {
      setError("");
      setMsg("");
      const res = await roomApi.deleteRoom(room.id);
      if (res.success) {
        setMsg("✅ Đã giải tán và xóa phòng thành công!");
        setRoom(null);
      } else {
        setError(res.message || "Không thể xóa phòng");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa phòng");
    }
  }

  async function handleLeaveRoom() {
    if (!room) return;
    const confirmLeave = window.confirm(
      `Bạn có chắc chắn muốn rời khỏi phòng "${room.name}" không?`
    );
    if (!confirmLeave) return;

    try {
      setError("");
      setMsg("");
      const res = await roomApi.leaveRoom(room.id);
      if (res.success) {
        setMsg("✅ Bạn đã rời khỏi phòng thành công!");
        setRoom(null);
      } else {
        setError(res.message || "Không thể rời phòng");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi rời phòng");
    }
  }

  const currentUser = authApi.getUser();
  const currentMember = room?.members?.find((m) => m.userId === currentUser?.id);
  const isAdmin = currentMember?.role === "ADMIN";

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
        description="Quản lý phòng trọ, lời mời tham gia và thành viên trong Database PostgreSQL."
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
              placeholder="VD: Tòa B4 KTX Hòa Lạc"
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
                {room.addressOrBlock ? ` · ${room.addressOrBlock}` : " · (Chưa cập nhật địa chỉ)"}
                {` · ${room.members?.length || 0} thành viên`}
              </p>
            </div>

            <div className="room-icon big">⌂</div>
          </div>

          <div style={{ margin: "16px 0", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setAddingMember(!addingMember)}
              >
                {addingMember ? "Hủy" : "+ Gửi lời mời vào phòng"}
              </button>
            )}

            {isAdmin && (
              <button
                className="btn btn-outline"
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Đóng chỉnh sửa" : "✏️ Chỉnh sửa thông số phòng"}
              </button>
            )}

            {isAdmin && (
              <button
                className="btn btn-outline"
                style={{ color: "#d32f2f", borderColor: "#d32f2f" }}
                onClick={handleDeleteRoom}
              >
                🗑️ Giải tán / Xóa phòng
              </button>
            )}

            {!isAdmin && (
              <button
                className="btn btn-outline"
                style={{ color: "#d32f2f", borderColor: "#d32f2f" }}
                onClick={handleLeaveRoom}
              >
                🚪 Rời khỏi phòng
              </button>
            )}
          </div>

          {/* Form chỉnh sửa thông số phòng */}
          {editing && (
            <form onSubmit={handleUpdateRoom} className="card inline-form" style={{ background: "#f8faf9", marginBottom: "18px" }}>
              <label>
                Tên phòng trọ / KTX
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="VD: Phòng 301 KTX Hòa Lạc"
                />
              </label>

              <label>
                Địa chỉ / Tòa nhà
                <input
                  value={editForm.addressOrBlock}
                  onChange={(e) => setEditForm({ ...editForm, addressOrBlock: e.target.value })}
                  placeholder="VD: Tòa Dom B KTX Hòa Lạc"
                />
              </label>

              <label>
                Khu vực
                <select
                  value={editForm.campus}
                  onChange={(e) => setEditForm({ ...editForm, campus: e.target.value as "HOA_LAC" | "NOI_THANH" })}
                >
                  <option value="HOA_LAC">Hòa Lạc</option>
                  <option value="NOI_THANH">Nội thành Hà Nội</option>
                </select>
              </label>

              <button className="btn btn-primary" type="submit">
                💾 Lưu thông số
              </button>
            </form>
          )}

          {/* Form gửi lời mời vào phòng */}
          {addingMember && (
            <form onSubmit={handleAddMember} style={{ display: "flex", gap: "10px", marginBottom: "16px", background: "#f4f8f5", padding: "12px", borderRadius: "8px" }}>
              <input
                required
                type="email"
                placeholder="Nhập email sinh viên VNU cần mời (VD: student3@vnu.edu.vn)"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
              <button className="btn btn-primary" type="submit">
                📩 Gửi lời mời tham gia
              </button>
            </form>
          )}

          <h4 style={{ marginTop: "16px" }}>Danh sách thành viên hiện tại trong phòng ({room.members?.length || 0}):</h4>
          <div className="member-grid">
            {room.members?.map((member) => (
              <div className="member-card" key={member.userId}>
                <div className="avatar">
                  {member.fullName ? member.fullName.charAt(0).toUpperCase() : "U"}
                </div>

                <div>
                  <strong>{member.fullName}</strong>
                  <span>MSSV: {member.studentId} · <b>{member.role === "ADMIN" ? "Trưởng phòng (ADMIN)" : "Thành viên (MEMBER)"}</b></span>
                </div>
              </div>
            ))}
          </div>

          {/* Danh sách lời mời đang chờ phản hồi */}
          {pendingInvites.length > 0 && (
            <div style={{ marginTop: "24px", borderTop: "1px solid #dfe6e1", paddingTop: "16px" }}>
              <h4 style={{ margin: "0 0 10px", color: "#52605a" }}>
                ⏳ Lời mời vào phòng đang chờ đối phương phản hồi ({pendingInvites.length}):
              </h4>
              <div style={{ display: "grid", gap: "8px" }}>
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "#fffbf0",
                      borderRadius: "8px",
                      border: "1px solid #fae8b4",
                      fontSize: "12px"
                    }}
                  >
                    <div>
                      <strong>{inv.receiverName}</strong> ({inv.receiverEmail}) · MSSV: {inv.receiverStudentId}
                      <span style={{ display: "block", color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>
                        Thời gian gửi: {new Date(inv.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <span style={{ color: "#b78103", fontWeight: 700 }}>
                      ⏳ Đang chờ chấp nhận
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        !creating && (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <h3>Bạn hiện chưa tham gia phòng trọ nào.</h3>
            <p className="muted" style={{ margin: "10px 0 20px" }}>
              Bạn có thể tạo một phòng mới ngay bây giờ, hoặc sang mục <b>"Tìm bạn cùng phòng"</b> để ghép phòng với bạn khác (phòng sẽ tự động được tạo khi chấp nhận lời mời).
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