import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { matchingApi } from './api';
import { isMock } from './mode';
import type { Candidate, Filters, Contact, MatchStatus, Requests } from './types';
const initial: Filters = { campus: '', dormBuilding: '', district: '', radiusKm: '' };
const statusText: Record<MatchStatus, string> = { NONE: 'Chưa kết nối', PENDING: 'Đang chờ phản hồi', ACCEPTED: 'Đã kết nối', REJECTED: 'Đã từ chối' };
function ContactGate({ status, contact }: { status?: MatchStatus; contact?: Contact }) {
  return <div className="p2-contact">{status === 'ACCEPTED' && contact?.isUnlocked === true ? <><strong>🔓 Thông tin liên hệ</strong><p>SĐT: {contact.phone || 'Chưa cập nhật'}</p><p>Zalo: {contact.zalo || 'Chưa cập nhật'}</p></> : <p>🔒 SĐT/Zalo được ẩn cho đến khi kết nối được chấp nhận.</p>}</div>;
}
export default function MatchingPage() {
  const [tab, setTab] = useState<'DISCOVER' | 'RECEIVED' | 'SENT'>('DISCOVER');
  const [filters, setFilters] = useState<Filters>(initial);
  const [applied, setApplied] = useState<Filters>(initial);
  const [people, setPeople] = useState<Candidate[]>([]);
  const [requests, setRequests] = useState<Requests>({ received: [], sent: [] });
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [target, setTarget] = useState<Candidate | null>(null); const [note, setNote] = useState('');
  const sequence = useRef(0);
  async function refresh(f: Filters) {
    const seq = ++sequence.current; setLoading(true); setError('');
    const [list, req] = await Promise.allSettled([matchingApi.list(f), matchingApi.requests()]);
    if (seq !== sequence.current) return;
    const errors: string[] = [];
    if (list.status === 'fulfilled') setPeople(list.value); else { setPeople([]); errors.push(String(list.reason)); }
    if (req.status === 'fulfilled') setRequests(req.value); else { setRequests({ received: [], sent: [] }); errors.push(String(req.reason)); }
    setError(errors.join(' · ')); setLoading(false);
  }
  useEffect(() => { void refresh(applied); return () => { sequence.current++; }; }, [applied]);
  async function action(fn: () => Promise<void>, success: string) {
    setBusy(true); setError(''); setMessage('');
    try { await fn(); setTarget(null); setMessage(success); await refresh(applied); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  const reqRows = tab === 'RECEIVED' ? requests.received : requests.sent;
  function statusFor(person: Candidate): MatchStatus {
    const relevant = [...requests.received.filter(r => r.senderId === person.userId), ...requests.sent.filter(r => r.receiverId === person.userId)];
    return person.matchStatus ?? relevant.find(r => r.status === 'ACCEPTED')?.status ?? relevant.find(r => r.status === 'PENDING')?.status ?? relevant[0]?.status ?? 'NONE';
  }
  return <>
    <PageHeader title="Tìm bạn cùng phòng" description="Khám phá sinh viên theo mức độ tương thích và vị trí." action={<Link className="btn btn-outline" to="/room">Phòng của tôi</Link>} />
    {isMock && <div className="p2-banner">PHASE 2 MOCK — dữ liệu minh họa, lời mời không ghi vào PostgreSQL; tải lại trang sẽ đặt lại.</div>}
    {error && <div role="alert" className="alert error">{error}</div>}{message && <div role="status" className="alert success">{message}</div>}
    <nav className="p2-tabs" aria-label="Danh sách kết nối">{(['DISCOVER','RECEIVED','SENT'] as const).map((t,i) => <button key={t} type="button" className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)} aria-pressed={tab === t}>{['Khám phá','Lời mời đã nhận','Lời mời đã gửi'][i]} ({[people.length,requests.received.filter(r => r.status === 'PENDING').length,requests.sent.length][i]})</button>)}</nav>
    {tab === 'DISCOVER' ? <>
      <form className="card p2-filters" onSubmit={e => { e.preventDefault(); setApplied({...filters}); }}>
        <label>Cơ sở<select value={filters.campus} onChange={e => setFilters({...initial, campus: e.target.value as Filters['campus']})}><option value="">Tất cả cơ sở</option><option value="HOA_LAC">Hòa Lạc</option><option value="NOI_THANH">Nội thành</option></select></label>
        {filters.campus === 'HOA_LAC' && <label>Tòa KTX<input list="p2-dorms" placeholder="Tất cả / nhập tên tòa" value={filters.dormBuilding} onChange={e => setFilters({...filters,dormBuilding:e.target.value})}/><datalist id="p2-dorms">{['A1','A2','A3','Dom A','Dom B'].map(x => <option key={x} value={x}/>)}</datalist></label>}
        {filters.campus === 'NOI_THANH' && <><label>Quận / khu vực<input list="p2-districts" placeholder="Tất cả / nhập khu vực" value={filters.district} onChange={e => setFilters({...filters,district:e.target.value})}/><datalist id="p2-districts">{['Cầu Giấy','Thanh Xuân','Nam Từ Liêm'].map(x => <option key={x} value={x}/>)}</datalist></label><label>Bán kính quanh trường (km)<input type="number" min="0.1" max="100" step="0.1" placeholder="Không giới hạn" value={filters.radiusKm} onChange={e => setFilters({...filters,radiusKm:e.target.value})}/></label></>}
        <div className="p2-actions"><button className="btn btn-primary" disabled={loading || busy}>Áp dụng</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => {setFilters(initial);setApplied({...initial});}}>Đặt lại</button></div>
      </form>
      {loading ? <p role="status">Đang tải danh sách...</p> : <div className="roommate-grid p2-cards">{people.map(p => {
        const status = statusFor(p); const score = p.compatibilityScore;
        const validScore = typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100;
        return <article className="roommate-card p2-candidate" key={p.userId}><div className="roommate-top"><div className="avatar large">{p.fullName?.charAt(0) || 'U'}</div><span className="compatibility">{validScore ? `${score}% phù hợp` : 'Chưa có điểm'}</span></div><h3>{p.fullName}</h3><p>{p.faculty || 'Sinh viên VNU'} · {p.cohort || 'Chưa cập nhật khóa'}</p>{p.studentId && <p>MSSV: {p.studentId}</p>}{validScore && <div className="p2-meter" aria-label={`Điểm tương thích ${score}%`}><span style={{width:`${score}%`}}/></div>}
        <div className="habit-tags"><span>{p.campus === 'HOA_LAC' ? 'Hòa Lạc' : 'Nội thành'}</span>{p.locationDetail && <span>{p.locationDetail}</span>}{p.distanceKm != null && <span>{p.distanceKm} km</span>}<span>{p.habits?.sleepSchedule === 'EARLY' ? 'Ngủ sớm' : p.habits?.sleepSchedule === 'NIGHT_OWL' ? 'Cú đêm' : 'Chưa rõ lịch ngủ'}</span><span>Sạch sẽ {p.habits?.cleanliness ?? '—'}/5</span><span>{Number(p.budget).toLocaleString('vi-VN')} đ/tháng</span></div>{p.bio && <p>{p.bio}</p>}
        <ContactGate status={status} contact={p.contact}/><button type="button" className={`btn ${status === 'NONE' ? 'btn-primary' : 'btn-outline'} full`} disabled={busy || status !== 'NONE' || (!isMock && p.matchStatus !== 'NONE')} onClick={() => {setTarget(p);setNote('Chào bạn, mình muốn kết nối tìm bạn cùng phòng.');}}>{status === 'NONE' ? 'Gửi lời mời ghép phòng' : statusText[status]}</button></article>;
      })}{!people.length && <div className="card">Không có sinh viên phù hợp bộ lọc.</div>}</div>}
    </> : loading ? <p role="status">Đang tải lời mời...</p> : <div className="p2-stack">{reqRows.map(r => {
      const received = tab === 'RECEIVED'; const p = people.find(x => x.userId === (received ? r.senderId : r.receiverId));
      return <article key={r.id} className="card p2-request"><div><h3>{(received ? r.senderName : r.receiverName) || 'Sinh viên VNU'}</h3><p className="muted">{statusText[r.status]}</p>{r.message && <p>{r.message}</p>}{r.createdAt && <p className="muted">{new Date(r.createdAt).toLocaleString('vi-VN')}</p>}<ContactGate status={r.status} contact={r.contact ?? p?.contact}/></div>{received && r.status === 'PENDING' && <div className="p2-actions"><button className="btn btn-primary" disabled={busy} onClick={() => void action(() => matchingApi.respond(r.id,'ACCEPT'),'Đã chấp nhận kết nối.')}>Chấp nhận</button><button className="btn btn-outline p2-danger" disabled={busy} onClick={() => void action(() => matchingApi.respond(r.id,'REJECT'),'Đã từ chối lời mời.')}>Từ chối</button></div>}</article>;
    })}{!reqRows.length && <div className="card">Chưa có lời mời.</div>}</div>}
    {target && <div className="p2-overlay"><form className="card p2-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-title" onSubmit={e => {e.preventDefault(); void action(() => matchingApi.send(target.userId,note.trim()),'Đã gửi lời mời.');}}><h3 id="invite-title">Gửi lời mời tới {target.fullName}</h3><label>Lời nhắn<textarea autoFocus maxLength={500} value={note} onChange={e => setNote(e.target.value)}/></label>{error && <p role="alert" className="alert error">{error}</p>}<div className="p2-actions"><button className="btn btn-primary" disabled={busy}>Gửi lời mời</button><button className="btn btn-outline" type="button" disabled={busy} onClick={() => setTarget(null)}>Hủy</button></div></form></div>}
  </>;
}
