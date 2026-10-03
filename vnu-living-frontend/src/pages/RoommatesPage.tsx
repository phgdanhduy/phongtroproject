import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/PageHeader";

type Campus = "hoa-lac" | "noi-thanh";

type Roommate = {
  id: string;
  name: string;
  faculty: string;
  cohort: string;
  campus: Campus;
  sleepTime: string;
  cleanliness: number;
  noiseSensitivity: number;
  compatibility: number;
};

const sampleRoommates: Roommate[] = [
  {
    id: "u1",
    name: "Nguyễn Minh Anh",
    faculty: "Công nghệ thông tin",
    cohort: "K68",
    campus: "noi-thanh",
    sleepTime: "23:00",
    cleanliness: 4,
    noiseSensitivity: 3,
    compatibility: 92
  },
  {
    id: "u2",
    name: "Trần Hoàng Nam",
    faculty: "Điện tử Viễn thông",
    cohort: "K67",
    campus: "hoa-lac",
    sleepTime: "22:30",
    cleanliness: 5,
    noiseSensitivity: 4,
    compatibility: 88
  },
  {
    id: "u3",
    name: "Phạm Gia Huy",
    faculty: "Công nghệ thông tin",
    cohort: "K69",
    campus: "noi-thanh",
    sleepTime: "00:00",
    cleanliness: 3,
    noiseSensitivity: 2,
    compatibility: 81
  }
];

export default function RoommatesPage() {
  const [campus, setCampus] = useState<Campus>("noi-thanh");
  const [cohort, setCohort] = useState("all");
  const [faculty, setFaculty] = useState("all");

  const roommates = useMemo(
    () =>
      sampleRoommates.filter(
        (person) =>
          person.campus === campus &&
          (cohort === "all" || person.cohort === cohort) &&
          (faculty === "all" || person.faculty === faculty)
      ),
    [campus, cohort, faculty]
  );

  return (
    <>
      <PageHeader
        title="Tìm bạn cùng phòng"
        description="Lọc những sinh viên có thông tin phù hợp với bạn."
        action={
          <Link className="btn btn-primary" to="/room">
            Tạo phòng trọ
          </Link>
        }
      />

      <div className="filter-bar">
        <select
          value={campus}
          onChange={(e) => setCampus(e.target.value as Campus)}
        >
          <option value="noi-thanh">Nội thành</option>
          <option value="hoa-lac">Hòa Lạc</option>
        </select>

        <select
          value={cohort}
          onChange={(e) => setCohort(e.target.value)}
        >
          <option value="all">Tất cả khóa</option>
          {["K67", "K68", "K69"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>

        <select
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
        >
          <option value="all">Tất cả khoa</option>
          <option>Công nghệ thông tin</option>
          <option>Điện tử Viễn thông</option>
          <option>Công nghệ</option>
        </select>

        <span className="result-count">
          {roommates.length} kết quả
        </span>
      </div>

      <div className="roommate-grid">
        {roommates.map((person) => (
          <article className="roommate-card" key={person.id}>
            <div className="roommate-top">
              <div className="avatar large">
                {person.name.charAt(0)}
              </div>

              <span className="compatibility">
                {person.compatibility}% phù hợp
              </span>
            </div>

            <h3>{person.name}</h3>

            <p>
              {person.faculty} · {person.cohort}
            </p>

            <div className="habit-tags">
              <span>Ngủ {person.sleepTime}</span>
              <span>Sạch sẽ {person.cleanliness}/5</span>
              <span>Ồn {person.noiseSensitivity}/5</span>
            </div>

            <button
              className="btn btn-outline full"
              onClick={() =>
                alert(`Đã gửi lời mời kết nối tới ${person.name}`)
              }
            >
              Gửi lời mời
            </button>
          </article>
        ))}

        {roommates.length === 0 && (
          <div className="empty card">
            Không có profile phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>
    </>
  );
}