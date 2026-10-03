import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { expenseApi, roomApi } from "../services/api";

interface ExpenseItem {
  id: number;
  title: string;
  amount: number;
  category: string;
  payer: {
    id: number;
    fullName: string;
  };
  createdAt: string;
}

interface BalanceItem {
  userId: number;
  fullName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export default function ExpensesPage() {
  const [roomId, setRoomId] = useState<number | null>(null);
  const [roomName, setRoomName] = useState("");
  const [members, setMembers] = useState<Array<{ userId: number; fullName: string }>>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "LIVING",
    payerId: 0
  });

  useEffect(() => {
    loadRoomAndExpenses();
  }, []);

  async function loadRoomAndExpenses() {
    try {
      setLoading(true);
      setError("");
      const roomRes = await roomApi.getMyRoom();
      if (roomRes.success && roomRes.data) {
        const r = roomRes.data;
        setRoomId(r.id);
        setRoomName(r.name);
        setMembers(r.members || []);
        if (r.members && r.members.length > 0) {
          setForm((curr) => ({ ...curr, payerId: r.members[0].userId }));
        }

        await fetchExpensesAndBalances(r.id);
      } else {
        setRoomId(null);
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  async function fetchExpensesAndBalances(rId: number) {
    try {
      const [expRes, balRes] = await Promise.all([
        expenseApi.getExpenses(rId),
        expenseApi.getBalances(rId)
      ]);

      if (expRes.success && Array.isArray(expRes.data)) {
        setExpenses(expRes.data);
      }
      if (balRes.success && (balRes.data?.memberBalances || balRes.data?.balances)) {
        setBalances(balRes.data.memberBalances || balRes.data.balances);
      }
    } catch (e: any) {
      console.error("Error loading expenses/balances:", e);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roomId) return;

    const amt = Number(form.amount);
    if (!form.title.trim() || amt <= 0) {
      setError("Vui lòng nhập tên khoản chi và số tiền hợp lệ (> 0)");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMsg("");

      const res = await expenseApi.createExpense(roomId, {
        title: form.title,
        amount: amt,
        category: form.category,
        splitWith: members.map((m) => m.userId)
      });

      if (!res.success) {
        setError(res.message || "Không thể tạo khoản chi");
        return;
      }

      setMsg("✅ Đã lưu khoản chi và tính toán chia tiền tự động!");
      setForm((curr) => ({ ...curr, title: "", amount: "" }));
      await fetchExpensesAndBalances(roomId);
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối Backend");
    } finally {
      setSaving(false);
    }
  }

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const equalShare = members.length > 0 ? Math.round(total / members.length) : 0;

  if (loading) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center" }}>
        Đang nạp chi phí và bảng tính chia tiền từ Database Docker...
      </div>
    );
  }

  if (!roomId) {
    return (
      <>
        <PageHeader
          title="Chi phí phòng"
          description="Quản lý chi tiêu và tính toán số dư tự động."
        />
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <h3>Bạn chưa tham gia phòng trọ nào để quản lý chi phí.</h3>
          <p className="muted" style={{ margin: "12px 0 20px" }}>
            Vui lòng tạo hoặc tham gia phòng trước để bắt đầu thêm hóa đơn điện, nước, tiền nhà.
          </p>
          <Link className="btn btn-primary" to="/room">
            Đi đến trang Phòng của tôi
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Chi phí phòng: ${roomName}`}
        description="Tính toán chia tiền tự động và lưu trữ vào PostgreSQL Database."
      />

      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="expense-layout">
        <form className="card expense-form" onSubmit={handleSubmit}>
          <span className="eyebrow">THÊM KHOẢN CHI VÀO DB</span>

          <label>
            Tên khoản chi
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Tiền điện, nước, internet..."
            />
          </label>

          <label>
            Số tiền (VNĐ)
            <input
              required
              type="number"
              min="1000"
              step="1000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="VD: 500000"
            />
          </label>

          <label>
            Phân loại
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="RENT">Tiền thuê phòng</option>
              <option value="ELECTRICITY">Tiền điện</option>
              <option value="WATER">Tiền nước</option>
              <option value="INTERNET">Internet / Wifi</option>
              <option value="LIVING">Sinh hoạt chung</option>
            </select>
          </label>

          <label>
            Người đứng ra trả trước
            <select
              value={form.payerId}
              onChange={(e) => setForm({ ...form, payerId: Number(e.target.value) })}
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </label>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Đang lưu vào DB..." : "Lưu khoản chi & Tự động chia"}
          </button>
        </form>

        <section className="card expense-summary">
          <span className="eyebrow">TỔNG QUAN CHIA ĐỀU (EQUAL SPLIT)</span>

          <h2>{total.toLocaleString("vi-VN")}đ</h2>

          <p className="muted">
            Tổng chi phí cả phòng cho {members.length} thành viên.
          </p>

          <div className="split-box">
            <span>Mỗi người chịu trách nhiệm</span>
            <strong>{equalShare.toLocaleString("vi-VN")}đ</strong>
          </div>

          <h4 style={{ marginTop: "16px", marginBottom: "8px" }}>Số dư thanh toán từng người (Từ Backend):</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {balances.map((b) => (
              <div
                key={b.userId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px",
                  borderRadius: "6px",
                  background: "var(--surface-variant, #f3f4f6)"
                }}
              >
                <span><b>{b.fullName}</b> (Đã trả {b.totalPaid.toLocaleString()}đ)</span>
                <span
                  style={{
                    color: b.netBalance >= 0 ? "#16a34a" : "#dc2626",
                    fontWeight: "bold"
                  }}
                >
                  {b.netBalance >= 0 ? `+Nhận lại ${b.netBalance.toLocaleString()}đ` : `Cần trả ${Math.abs(b.netBalance).toLocaleString()}đ`}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: "24px" }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">DANH SÁCH HÓA ĐƠN TRONG DB</span>
            <h3>Khoản chi đã ghi nhận ({expenses.length})</h3>
          </div>
        </div>

        <div className="expense-list">
          {expenses.map((expense) => (
            <div className="expense-item" key={expense.id}>
              <div>
                <strong>{expense.title}</strong>
                <p className="muted">
                  Người trả: {expense.payer?.fullName || "Thành viên"} · {new Date(expense.createdAt).toLocaleDateString("vi-VN")} · Loại: {expense.category}
                </p>
              </div>

              <span>{expense.amount.toLocaleString("vi-VN")}đ</span>
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="empty" style={{ padding: "20px", textAlign: "center" }}>
              Chưa có khoản chi nào được thêm vào phòng này.
            </div>
          )}
        </div>
      </section>
    </>
  );
}