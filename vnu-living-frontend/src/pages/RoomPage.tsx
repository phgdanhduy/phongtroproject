import { FormEvent, useState } from "react";

import PageHeader from "../components/PageHeader";

type Campus = "hoa-lac" | "noi-thanh";

type RoomMember = {
  id: string;
  name: string;
  email: string;
};

type Room = {
  id: string;
  name: string;
  capacity: number;
  campus: Campus;
  members: RoomMember[];
};

const initialRoom: Room = {
  id: "room-1",
  name: "Phòng VNU 001",
  capacity: 4,
  campus: "noi-thanh",
  members: [
    {
      id: "u1",
      name: "Nguyễn Thanh Hưng",
      email: "hungnt@vnu.edu.vn"
    },
    {
      id: "u2",
      name: "Nguyễn Minh Anh",
      email: "minhanh@vnu.edu.vn"
    }
  ]
};

export default function RoomPage() {
  const [room, setRoom] = useState(initialRoom);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    capacity: 4,
    campus: "noi-thanh" as Campus
  });

  function createRoom(e: FormEvent) {
    e.preventDefault();

    const newRoom: Room = {
      id: "room-preview",
      name: form.name || "Phòng VNU mới",
      capacity: form.capacity,
      campus: form.campus,
      members: [
        {
          id: "u1",
          name: "Nguyễn Thanh Hưng",
          email: "hungnt@vnu.edu.vn"
        }
      ]
    };

    setRoom(newRoom);
    setCreating(false);
  }

  return (
    <>
      <PageHeader
        title="Phòng của tôi"
        description="Quản lý không gian sống và thành viên."
        action={
          <button
            className="btn btn-primary"
            onClick={() => setCreating(!creating)}
          >
            {creating ? "Đóng" : "Tạo phòng trọ"}
          </button>
        }
      />

      {creating && (
        <form className="card inline-form" onSubmit={createRoom}>
          <label>
            Tên phòng
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
              placeholder="Phòng VNU 002"
            />
          </label>

          <label>
            Số người
            <select
              value={form.capacity}
              onChange={(e) =>
                setForm({
                  ...form,
                  capacity: Number(e.target.value)
                })
              }
            >
              <option value="4">4 người</option>
              <option value="6">6 người</option>
              <option value="8">8 người</option>
            </select>
          </label>

          <label>
            Cơ sở
            <select
              value={form.campus}
              onChange={(e) =>
                setForm({
                  ...form,
                  campus: e.target.value as Campus
                })
              }
            >
              <option value="noi-thanh">Nội thành</option>
              <option value="hoa-lac">Hòa Lạc</option>
            </select>
          </label>

          <button className="btn btn-primary" type="submit">
            Tạo
          </button>
        </form>
      )}

      <section className="room-detail card">
        <div className="room-detail-head">
          <div>
            <span className="eyebrow">LIVING SPACE</span>

            <h2>{room.name}</h2>

            <p>
              {room.campus === "hoa-lac"
                ? "KTX Hòa Lạc"
                : "Thuê trọ nội thành"}{" "}
              · {room.members.length}/{room.capacity} thành viên
            </p>
          </div>

          <div className="room-icon big">⌂</div>
        </div>

        <div className="member-grid">
          {room.members.map((member) => (
            <div className="member-card" key={member.id}>
              <div className="avatar">
                {member.name.charAt(0)}
              </div>

              <div>
                <strong>{member.name}</strong>
                <span>{member.email}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}