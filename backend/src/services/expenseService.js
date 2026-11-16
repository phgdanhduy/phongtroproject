const expenseRepository = require('../repositories/expenseRepository');
const roomRepository = require('../repositories/roomRepository');
const { SplitStrategyFactory } = require('../strategies/splitStrategy');
const { simplifyDebtsWithVietQR } = require('../utils/debtSimplifier');
const { getCache, setCache, deleteCache } = require('../config/redis');
const { AppError } = require('../utils/errors');

const getBalanceCacheKey = (roomId) => `room:${roomId}:balances`;

/**
 * 1. Tạo khoản chi tiêu mới với Strategy Pattern & Invalidate Redis Cache
 */
async function createExpense(currentUserId, roomId, {
  title,
  amount,
  category = 'LIVING',
  payerId,
  splitType = 'EQUAL',
  splits,
  meters,
  unitPrice
}) {
  if (!roomId || !title || !title.trim() || !amount || Number(amount) <= 0) {
    throw new AppError('Vui lòng nhập tên khoản chi và số tiền hợp lệ (> 0)', 400, 'INVALID_INPUT');
  }

  const memberCheck = await roomRepository.findMember(roomId, currentUserId);
  if (!memberCheck) {
    throw new AppError('Bạn không có quyền thao tác trên phòng này', 403, 'FORBIDDEN');
  }

  const members = await roomRepository.findMembersByRoomId(roomId);
  if (!members || members.length === 0) {
    throw new AppError('Phòng chưa có thành viên nào', 400, 'EMPTY_ROOM');
  }

  const effectivePayerId = payerId ? parseInt(payerId, 10) : currentUserId;
  const numAmount = Number(amount);

  // Áp dụng Strategy Pattern để tính toán số tiền phân chia
  const strategy = SplitStrategyFactory.getStrategy(splitType);
  const calculatedSplits = strategy.calculate(numAmount, members, {
    splits,
    meters,
    unitPrice
  });

  const newExpense = await expenseRepository.createExpenseWithSplits({
    roomId,
    title: title.trim(),
    amount: numAmount,
    category,
    payerId: effectivePayerId,
    splitType,
    calculatedSplits
  });

  // Invalidate cache công nợ phòng sau khi phát sinh hóa đơn mới
  await deleteCache(getBalanceCacheKey(roomId));

  return {
    ...newExpense,
    amount: Number(newExpense.amount),
    splits: calculatedSplits
  };
}

/**
 * 2. Cập nhật khoản chi tiêu với Khóa lạc quan (Optimistic Locking)
 */
async function updateExpense(currentUserId, roomId, expenseId, {
  title,
  amount,
  category,
  splitType = 'EQUAL',
  splits,
  meters,
  unitPrice,
  version
}) {
  if (!roomId || !expenseId) {
    throw new AppError('Thiếu thông tin phòng hoặc hóa đơn', 400, 'INVALID_INPUT');
  }

  if (version === undefined || version === null) {
    throw new AppError('Thiếu phiên bản (version) để kiểm tra xung đột Optimistic Lock', 400, 'MISSING_VERSION');
  }

  const memberCheck = await roomRepository.findMember(roomId, currentUserId);
  if (!memberCheck) {
    throw new AppError('Bạn không có quyền thao tác trên phòng này', 403, 'FORBIDDEN');
  }

  const existingExpense = await expenseRepository.findById(expenseId, roomId);
  if (!existingExpense) {
    throw new AppError('Khoản chi tiêu không tồn tại trong phòng này', 404, 'NOT_FOUND');
  }

  const members = await roomRepository.findMembersByRoomId(roomId);
  const targetAmount = amount ? Number(amount) : Number(existingExpense.amount);
  const targetSplitType = splitType || existingExpense.splitType || 'EQUAL';

  const strategy = SplitStrategyFactory.getStrategy(targetSplitType);
  const calculatedSplits = strategy.calculate(targetAmount, members, {
    splits,
    meters,
    unitPrice
  });

  const updatedExpense = await expenseRepository.updateExpenseWithSplits({
    expenseId,
    roomId,
    title,
    amount: targetAmount,
    category,
    splitType: targetSplitType,
    calculatedSplits,
    version: Number(version)
  });

  // Invalidate cache công nợ
  await deleteCache(getBalanceCacheKey(roomId));

  return {
    ...updatedExpense,
    amount: Number(updatedExpense.amount),
    splits: calculatedSplits
  };
}

/**
 * 3. Lấy danh sách chi tiêu của phòng
 */
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
    splitType: row.splitType || 'EQUAL',
    version: row.version || 1,
    payer: {
      id: row.payerId,
      fullName: row.payerFullName
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));
}

/**
 * 4. Xem công nợ phòng: Cache-Aside Redis + Min-Cash-Flow + VietQR động
 */
async function getBalances(currentUserId, roomId) {
  const memberCheck = await roomRepository.findMember(roomId, currentUserId);
  if (!memberCheck) {
    throw new AppError('Bạn không thuộc phòng trọ này', 403, 'FORBIDDEN');
  }

  const cacheKey = getBalanceCacheKey(roomId);

  // Bước 1 (Cache-Aside): Đọc từ Redis trước
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return {
      source: 'REDIS_CACHE',
      ...cachedData
    };
  }

  // Bước 2 (Cache Miss): Truy vấn PostgreSQL
  const room = await roomRepository.findById(roomId);
  const roomName = room?.name || `Phòng ${roomId}`;

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
      netBalance: paid - owed,
      bankBin: m.bankBin || null,
      bankAccount: m.bankAccount || null
    };
  });

  // Thuật toán Min-Cash-Flow rút gọn giao dịch tối đa (N - 1) & sinh URL VietQR động
  const simplifiedTransactions = simplifyDebtsWithVietQR(memberBalances, roomName);

  const responsePayload = {
    totalRoomExpense,
    memberBalances: memberBalances.map(({ bankBin, bankAccount, ...rest }) => rest),
    simplifiedTransactions
  };

  // Bước 3: Ghi ngược lại vào Redis (TTL = 300 giây = 5 phút)
  await setCache(cacheKey, responsePayload, 300);

  return {
    source: 'POSTGRES_DB',
    ...responsePayload
  };
}

/**
 * 5. Xóa khoản chi tiêu & Invalidate Redis Cache
 */
async function deleteExpense(currentUserId, roomId, expenseId) {
  if (!roomId || !expenseId) {
    throw new AppError('Thiếu thông tin phòng hoặc hóa đơn', 400, 'INVALID_INPUT');
  }

  const memberCheck = await roomRepository.findMember(roomId, currentUserId);
  if (!memberCheck) {
    throw new AppError('Bạn không có quyền thao tác trên phòng này', 403, 'FORBIDDEN');
  }

  const deleted = await expenseRepository.deleteById(expenseId, roomId);
  if (!deleted) {
    throw new AppError('Không tìm thấy khoản chi tiêu', 404, 'NOT_FOUND');
  }

  // Xóa cache công nợ phòng sau khi xóa hóa đơn
  await deleteCache(getBalanceCacheKey(roomId));

  return { deletedId: deleted.id };
}

module.exports = {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenses,
  getBalances
};
