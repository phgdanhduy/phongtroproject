import type { Candidate, Requests, Filters, CreateExpense, Expense, Balances, Room, Member, Settlement } from './types';
const locked = { phone: null, zalo: null, isUnlocked: false };
const unlocked = { phone: 'SĐT DEMO (không thật)', zalo: 'Zalo DEMO', isUnlocked: true };
const habits = { sleepSchedule: 'NIGHT_OWL', cleanliness: 4, noiseLevel: 'QUIET', smoking: false, hasPet: false };
const fixtures: Candidate[] = [
  { userId: 9001, fullName: 'Sinh viên Demo A', studentId: 'DEMO01', faculty: 'Công nghệ Thông tin', cohort: 'K68', campus: 'HOA_LAC', dormBuilding: 'A2', locationDetail: 'Tòa A2', budget: 1500000, habits, compatibilityScore: 92, matchStatus: 'NONE', contact: locked },
  { userId: 9002, fullName: 'Sinh viên Demo B', studentId: 'DEMO02', faculty: 'Ngoại ngữ', cohort: 'K67', campus: 'NOI_THANH', district: 'Cầu Giấy', distanceKm: 2, locationDetail: 'Cầu Giấy', budget: 2500000, habits, compatibilityScore: 88, matchStatus: 'PENDING', contact: locked },
  { userId: 9003, fullName: 'Sinh viên Demo C', studentId: 'DEMO03', faculty: 'Kinh tế', cohort: 'K68', campus: 'HOA_LAC', dormBuilding: 'A1', locationDetail: 'Tòa A1', budget: 1200000, habits, compatibilityScore: 82, matchStatus: 'ACCEPTED', contact: unlocked },
  { userId: 9004, fullName: 'Sinh viên Demo D', studentId: 'DEMO04', faculty: 'Luật', cohort: 'K66', campus: 'NOI_THANH', district: 'Thanh Xuân', distanceKm: 5, locationDetail: 'Thanh Xuân', budget: 2000000, habits, compatibilityScore: 76, matchStatus: 'PENDING', contact: locked },
];
const date = () => new Date().toISOString();
const clone = <T,>(v: T): T => structuredClone(v);
const matching = new Map<number, { candidates: Candidate[]; requests: Requests; next: number }>();
function state(id: number) {
  if (!matching.has(id)) matching.set(id, { candidates: clone(fixtures), next: 10, requests: { received: [{ id: 1, senderId: 9002, senderName: 'Sinh viên Demo B', status: 'PENDING', message: 'Chào bạn, mình muốn kết nối!', createdAt: date() }], sent: [{ id: 2, receiverId: 9003, receiverName: 'Sinh viên Demo C', status: 'ACCEPTED', createdAt: date(), contact: unlocked }, { id: 3, receiverId: 9004, receiverName: 'Sinh viên Demo D', status: 'PENDING', createdAt: date() }] } });
  return matching.get(id)!;
}
export const mockMatching = {
  list(id: number, f: Filters) { return clone(state(id).candidates.filter(c => (!f.campus || c.campus === f.campus) && (!f.dormBuilding || c.dormBuilding === f.dormBuilding) && (!f.district || c.district === f.district) && (!f.radiusKm || (c.distanceKm != null && c.distanceKm <= Number(f.radiusKm))))); },
  requests(id: number) { return clone(state(id).requests); },
  send(id: number, target: number, message: string) {
    const s = state(id); const c = s.candidates.find(x => x.userId === target);
    if (!c || c.matchStatus !== 'NONE') throw Error('Không thể gửi lời mời trùng.');
    c.matchStatus = 'PENDING'; s.requests.sent.push({ id: s.next++, receiverId: target, receiverName: c.fullName, message, status: 'PENDING', createdAt: date() });
  },
  respond(id: number, requestId: number, action: 'ACCEPT' | 'REJECT') {
    const s = state(id); const r = s.requests.received.find(x => x.id === requestId);
    if (!r || r.status !== 'PENDING') throw Error('Lời mời không còn chờ phản hồi.');
    r.status = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    r.contact = action === 'ACCEPT' ? unlocked : locked;
    const c = s.candidates.find(x => x.userId === r.senderId);
    if (c) { c.matchStatus = r.status; c.contact = r.contact; }
  },
};
// UI-only simulator: deliberately two members; no production matching/split/settlement algorithm.
// All records live in memory, are scoped by logged-in user, and disappear on reload.
type MockBill = Expense & { shares: Record<number, number> };
const bills = new Map<number, MockBill[]>();
export function mockRoom(id: number, name: string): Room { return { id: 999, name: 'Phòng DEMO (không phải phòng thật)', members: [{ userId: id, fullName: name }, { userId: 99001, fullName: 'Bạn cùng phòng Demo' }] }; }
function entries(room: Room) {
  const [me, other] = room.members;
  if (!bills.has(me.userId)) bills.set(me.userId, [{ id: 1, title: 'Hóa đơn mẫu', amount: 600000, category: 'ELECTRICITY', payer: { id: other.userId, fullName: other.fullName }, createdAt: date(), splitStrategy: 'EQUAL', version: 1, shares: { [me.userId]: 300000, [other.userId]: 300000 } }]);
  return bills.get(me.userId)!;
}
export const mockExpense = {
  list(room: Room): Expense[] { return entries(room).map(({ shares: _shares, ...e }) => clone(e)); },
  create(room: Room, payload: CreateExpense) {
    const payer = room.members.find(m => m.userId === payload.payerId);
    const participants = payload.splitStrategy === 'CUSTOM' ? room.members.filter(m => payload.participantIds?.includes(m.userId)) : room.members;
    if (!payer || !participants.length) throw Error('Thành viên không hợp lệ.');
    const shares: Record<number, number> = {}; const each = Math.floor(payload.amount / participants.length);
    participants.forEach((m, i) => { shares[m.userId] = each + (i < payload.amount % participants.length ? 1 : 0); });
    const list = entries(room);
    list.unshift({ id: Math.max(0, ...list.map(x => x.id)) + 1, title: payload.title, amount: payload.amount, category: payload.category, payer: { id: payer.userId, fullName: payer.fullName }, createdAt: date(), splitStrategy: payload.splitStrategy, version: 1, shares });
  },
  balances(room: Room): Balances {
    const list = entries(room);
    const memberBalances = room.members.map((m: Member) => {
      const totalPaid = list.reduce((sum, e) => sum + (e.payer?.id === m.userId ? e.amount : 0), 0);
      const totalOwed = list.reduce((sum, e) => sum + (e.shares[m.userId] ?? 0), 0);
      return { ...m, totalPaid, totalOwed, netBalance: totalPaid - totalOwed };
    });
    const debtor = memberBalances.find(m => m.netBalance < 0); const creditor = memberBalances.find(m => m.netBalance > 0);
    const settlementTransactions: Settlement[] = debtor && creditor ? [{ fromUserId: debtor.userId, fromName: debtor.fullName, toUserId: creditor.userId, toName: creditor.fullName, amount: -debtor.netBalance, vietQrUrl: null }] : [];
    return { totalRoomExpense: list.reduce((s,e) => s + e.amount, 0), memberBalances, settlementTransactions };
  },
};
