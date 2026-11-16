export type Campus = 'HOA_LAC' | 'NOI_THANH';
export type MatchStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
export interface Contact { phone: string | null; zalo: string | null; isUnlocked: boolean }
export interface Candidate {
  userId: number; fullName: string; studentId?: string; faculty?: string | null; cohort?: string | null;
  campus: Campus; locationDetail?: string | null; budget: number;
  habits: { sleepSchedule: string; cleanliness: number; noiseLevel: string; smoking?: boolean; hasPet?: boolean };
  bio?: string | null; compatibilityScore?: number; matchStatus?: MatchStatus; contact?: Contact;
  // Provisional location fields, pending Backend 1 contract confirmation.
  dormBuilding?: string; district?: string; distanceKm?: number;
}
export interface MatchRequest {
  id: number; status: Exclude<MatchStatus, 'NONE'>; message?: string | null; createdAt?: string;
  senderId?: number; senderName?: string; receiverId?: number; receiverName?: string; contact?: Contact;
}
export interface Requests { received: MatchRequest[]; sent: MatchRequest[] }
export interface Filters { campus: '' | Campus; dormBuilding: string; district: string; radiusKm: string }
export type SplitStrategy = 'EQUAL' | 'CUSTOM' | 'METERED';
export interface MeterDetails { oldReading: number; newReading: number; unitPrice: number }
export interface CreateExpense { title: string; amount: number; category: string; payerId: number; splitStrategy: SplitStrategy; participantIds?: number[]; meterDetails?: MeterDetails }
export interface Member { userId: number; fullName: string }
export interface Expense { id: number; title: string; amount: number; category: string; payer?: { id: number; fullName: string }; createdAt: string; splitStrategy?: SplitStrategy; version?: number }
export interface Balance { userId: number; fullName: string; totalPaid: number; totalOwed: number; netBalance: number }
export interface Settlement { fromUserId: number; fromName: string; toUserId: number; toName: string; amount: number; vietQrUrl?: string | null }
export interface Balances { totalRoomExpense: number; memberBalances: Balance[]; settlementTransactions?: Settlement[] }
export interface Room { id: number; name: string; members: Member[] }
