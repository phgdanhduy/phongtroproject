import { authApi } from '../services/api';
import { isMock } from './mode';
import { mockMatching, mockExpense, mockRoom } from './mock';
import type { Candidate, Requests, Filters, CreateExpense, Expense, Balances, Room } from './types';
class ApiError extends Error { constructor(message: string, readonly code?: string) { super(message); } }
async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = authApi.getToken();
  const res = await fetch(`/api${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (res.status === 429) throw Error('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
  if (res.status === 401) throw Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { throw Error(`API không trả JSON hợp lệ (HTTP ${res.status}). Kiểm tra Backend.`); }
  if (!res.ok || data?.success !== true) throw new ApiError(data?.message || `Yêu cầu thất bại (HTTP ${res.status})`, data?.error);
  return data.data as T;
}
function user() { const u = authApi.getUser(); if (!u) throw Error('Cần đăng nhập.'); return u; }
export const matchingApi = {
  async list(f: Filters): Promise<Candidate[]> {
    if (isMock) return mockMatching.list(user().id, f);
    const q = new URLSearchParams(); Object.entries(f).forEach(([k,v]) => { if (v) q.set(k,v); });
    const result = await call<Candidate[]>(`/roommates?${q}`);
    if (!Array.isArray(result)) throw Error('Dữ liệu danh sách không đúng contract.');
    return result.filter(c => c.userId !== user().id);
  },
  async requests(): Promise<Requests> {
    if (isMock) return mockMatching.requests(user().id);
    // GET endpoint not yet specified in section 8.2. Confirm this assumption before real mode.
    const result = await call<Requests>(import.meta.env.VITE_MATCHING_REQUESTS_PATH || '/matching/requests');
    if (!Array.isArray(result?.received) || !Array.isArray(result?.sent)) throw Error('API lời mời chưa đúng contract received/sent.');
    return result;
  },
  async send(targetUserId: number, message: string) { if (isMock) return mockMatching.send(user().id, targetUserId, message); await call('/matching/requests', 'POST', { targetUserId, message }); },
  async respond(id: number, action: 'ACCEPT' | 'REJECT') { if (isMock) return mockMatching.respond(user().id, id, action); await call(`/matching/requests/${id}`, 'PUT', { action }); },
};
export const phase2ExpenseApi = {
  async room(): Promise<Room | null> { if (isMock) { const u = user(); return mockRoom(u.id, u.fullName); } try { return (await call<Room | null>('/rooms/my-room')) ?? null; } catch (e) { if (e instanceof ApiError && e.code === 'ROOM_NOT_FOUND') return null; throw e; } },
  async list(room: Room): Promise<Expense[]> { if (isMock) return mockExpense.list(room); const r = await call<Expense[]>(`/rooms/${room.id}/expenses`); if (!Array.isArray(r)) throw Error('Danh sách hóa đơn không hợp lệ.'); return r; },
  async balances(room: Room): Promise<Balances> { if (isMock) return mockExpense.balances(room); const r = await call<Balances>(`/rooms/${room.id}/balances`); if (!Array.isArray(r?.memberBalances)) throw Error('Bảng công nợ không hợp lệ.'); return r; },
  async create(room: Room, payload: CreateExpense) { if (isMock) return mockExpense.create(room, payload); await call(`/rooms/${room.id}/expenses`, 'POST', payload); },
};
