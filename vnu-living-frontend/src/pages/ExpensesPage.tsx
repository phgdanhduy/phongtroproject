import { FormEvent, useMemo, useState } from "react";

import PageHeader from "../components/PageHeader";

type Expense = {
  id: string;
  name: string;
  amount: number;
  payer: string;
  date: string;
};

const initialExpenses: Expense[] = [
  {
    id: "e1",
    name: "Tiền điện",
    amount: 450000,
    payer: "Nguyễn Thanh Hưng",
    date: "2026-10-01"
  },
  {
    id: "e2",
    name: "Tiền nước",
    amount: 120000,
    payer: "Nguyễn Minh Anh",
    date: "2026-10-01"
  },
  {
    id: "e3",
    name: "Internet",
    amount: 200000,
    payer: "Nguyễn Thanh Hưng",
    date: "2026-10-01"
  }
];

const members = [
  "Nguyễn Thanh Hưng",
  "Nguyễn Minh Anh"
];

export default function ExpensesPage() {
  const [expenses, setExpenses] =
    useState(initialExpenses);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    payer: members[0],
    date: new Date().toISOString().slice(0, 10)
  });

  const total = useMemo(
    () =>
      expenses.reduce(
        (sum, item) => sum + item.amount,
        0
      ),
    [expenses]
  );

  const equalShare =
    members.length > 0
      ? Math.round(total / members.length)
      : 0;

  function submit(e: FormEvent) {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!form.name.trim() || amount <= 0) {
      return;
    }

    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      name: form.name,
      amount,
      payer: form.payer,
      date: form.date
    };

    setExpenses((current) => [
      newExpense,
      ...current
    ]);

    setForm({
      name: "",
      amount: "",
      payer: members[0],
      date: new Date().toISOString().slice(0, 10)
    });
  }

  return (
    <>
      <PageHeader
        title="Chi phí phòng"
        description="Giao diện nhập khoản chi và xem chia đều giữa các thành viên."
      />

      <div className="expense-layout">
        <form className="card expense-form" onSubmit={submit}>
          <span className="eyebrow">THÊM KHOẢN CHI</span>

          <label>
            Tên khoản chi
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
              placeholder="Tiền điện, tiền nước..."
              required
            />
          </label>

          <label>
            Số tiền
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value
                })
              }
              placeholder="500000"
              required
            />
          </label>

          <label>
            Người thanh toán
            <select
              value={form.payer}
              onChange={(e) =>
                setForm({
                  ...form,
                  payer: e.target.value
                })
              }
            >
              {members.map((member) => (
                <option key={member}>
                  {member}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ngày
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({
                  ...form,
                  date: e.target.value
                })
              }
              required
            />
          </label>

          <button className="btn btn-primary" type="submit">
            Thêm khoản chi
          </button>
        </form>

        <section className="card expense-summary">
          <span className="eyebrow">EQUAL SPLIT</span>

          <h2>{total.toLocaleString("vi-VN")}đ</h2>

          <p className="muted">
            Tổng chi phí hiện tại của phòng.
          </p>

          <div className="split-box">
            <span>Mỗi thành viên cần trả</span>
            <strong>
              {equalShare.toLocaleString("vi-VN")}đ
            </strong>
          </div>

          <p className="muted">
            Đây là phần hiển thị giao diện. Khi backend hoàn thành,
            dữ liệu và kết quả chia tiền sẽ được lấy từ API.
          </p>
        </section>
      </div>

      <section className="card">
        <div className="section-head">
          <div>
            <span className="eyebrow">DANH SÁCH KHOẢN CHI</span>
            <h3>Chi phí đã nhập</h3>
          </div>
        </div>

        <div className="expense-list">
          {expenses.map((expense) => (
            <div className="expense-item" key={expense.id}>
              <div>
                <strong>{expense.name}</strong>
                <p className="muted">
                  {expense.payer} · {expense.date}
                </p>
              </div>

              <span>
                {expense.amount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}