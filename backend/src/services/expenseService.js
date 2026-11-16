const expenseRepository = require('../repositories/expenseRepository');
const roomRepository = require('../repositories/roomRepository');
const { AppError } = require('../utils/errors');

async function createExpense(currentUserId, roomId, { title, amount, category = 'LIVING', payerId }) {
  if (!title || !title.trim() || !amount || Number(amount) <= 0) {
    throw new AppError('Vui lòng nhập tên khoản chi và số tiền hợp lệ (> 0)', 400, 'INVALID_INPUT');
  }

  const memberCheck = await roomRepository.findMember(roomId, currentUserId);
  if (!memberCheck) {
    throw new AppError('Bạn không có quyền thao tác trên phòng này', 403, 'FORBIDDEN');
  }

  const members = await roomRepository.findMembersByRoomId(roomId);
  if (members.length === 0) {
    throw new AppError('Phòng chưa có thành viên nào', 400, 'EMPTY_ROOM');
  }

  const effectivePayerId = payerId ? parseInt(payerId, 10) : currentUserId;
  const numAmount = Number(amount);
  const splitPerMember = Math.round(numAmount / members.length);
  const memberIds = members.map(m => m.userId);

  const newExpense = await expenseRepository.createExpenseWithSplits({
    roomId,
    title: title.trim(),
    amount: numAmount,
    category,
    payerId: effectivePayerId,
    memberIds,
    splitPerMember
  });

  return {
    id: newExpense.id,
    title: newExpense.title,
    amount: Number(newExpense.amount),
    category: newExpense.category,
    payerId: newExpense.payerId,
    splitPerMember,
    createdAt: newExpense.createdAt
  };
}

async function getExpenses(currentUserId, roomId) {
  const memberCheck = await roomRepository.findMember(roomId, currentUserId);
  if (!memberCheck) {
    throw new AppError('Bạn không thuộc phòng trọ này', 403, 'FORBIDDEN');
  }

  const rows = await expenseRepository.findByRoomId(roomId);

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    payer: {
      id: row.payerId,
      fullName: row.payerFullName
    },
    createdAt: row.createdAt
  }));
}

async function getBalances(currentUserId, roomId) {
  const memberCheck = await roomRepository.findMember(roomId, currentUserId);
  if (!memberCheck) {
    throw new AppError('Bạn không thuộc phòng trọ này', 403, 'FORBIDDEN');
  }

  const members = await roomRepository.findMembersByRoomId(roomId);
  const paidRows = await expenseRepository.getTotalsPaidByRoomId(roomId);
  const owedRows = await expenseRepository.getTotalsOwedByRoomId(roomId);

  const paidMap = {};
  let totalRoomExpense = 0;
  paidRows.forEach(r => {
    const amt = Number(r.totalPaid);
    paidMap[r.payer_id] = amt;
    totalRoomExpense += amt;
  });

  const owedMap = {};
  owedRows.forEach(r => {
    owedMap[r.user_id] = Number(r.totalOwed);
  });

  const memberBalances = members.map(m => {
    const paid = paidMap[m.userId] || 0;
    const owed = owedMap[m.userId] || 0;
    return {
      userId: m.userId,
      fullName: m.fullName,
      totalPaid: paid,
      totalOwed: owed,
      netBalance: paid - owed
    };
  });

  return {
    totalRoomExpense,
    memberBalances
  };
}

module.exports = {
  createExpense,
  getExpenses,
  getBalances
};
