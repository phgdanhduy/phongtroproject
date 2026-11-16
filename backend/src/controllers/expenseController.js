const { pool, query } = require('../config/db');
const { getCache, setCache, deleteCache } = require('../config/redis');
const { SplitStrategyFactory } = require('../strategies/splitStrategy');
const { simplifyDebtsWithVietQR } = require('../utils/debtSimplifier');

const getBalanceCacheKey = (roomId) => `room:${roomId}:balances`;

// 1. Tạo hóa đơn với Strategy Pattern & Invalidate Cache
async function createExpense(req, res, next) {
  const client = await pool.connect();
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId || req.body.roomId, 10);
    const {
      title,
      amount,
      category = 'LIVING',
      payerId,
      splitType = 'EQUAL',
      splits,
      meters,
      unitPrice
    } = req.body;

    if (!roomId || !title || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập phòng, tên khoản chi và số tiền hợp lệ (> 0)',
        error: 'INVALID_INPUT'
      });
    }

    const memberCheck = await client.query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, currentUserId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên phòng này',
        error: 'FORBIDDEN'
      });
    }

    const membersRes = await client.query(
        'SELECT user_id FROM room_members WHERE room_id = $1 ORDER BY user_id ASC',
        [roomId]
    );

    // Áp dụng Strategy Pattern để tính toán phân chia
    const strategy = SplitStrategyFactory.getStrategy(splitType);
    const calculatedSplits = strategy.calculate(Number(amount), membersRes.rows, {
      splits,
      meters,
      unitPrice
    });

    const effectivePayerId = payerId || currentUserId;

    await client.query('BEGIN');

    const expenseRes = await client.query(
        `INSERT INTO expenses (room_id, title, amount, category, payer_id, split_type, version)
       VALUES ($1, $2, $3, $4, $5, $6, 1)
       RETURNING id, title, amount, category, payer_id AS "payerId", split_type AS "splitType", version, created_at AS "createdAt"`,
        [roomId, title.trim(), Number(amount), category, effectivePayerId, splitType.toUpperCase()]
    );

    const newExpense = expenseRes.rows[0];

    for (const item of calculatedSplits) {
      await client.query(
          `INSERT INTO expense_splits (expense_id, user_id, split_amount, metadata)
         VALUES ($1, $2, $3, $4)`,
          [newExpense.id, item.userId, item.splitAmount, JSON.stringify(item.metadata || {})]
      );
    }

    await client.query('COMMIT');

    // Xóa cache công nợ phòng khi có hóa đơn mới
    await deleteCache(getBalanceCacheKey(roomId));

    return res.status(201).json({
      success: true,
      message: 'Thêm khoản chi tiêu thành công',
      data: {
        ...newExpense,
        amount: Number(newExpense.amount),
        splits: calculatedSplits
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// 2. Cập nhật hóa đơn với Khóa lạc quan (Optimistic Locking)
async function updateExpense(req, res, next) {
  const client = await pool.connect();
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);
    const expenseId = parseInt(req.params.expenseId, 10);
    const { title, amount, category, splitType = 'EQUAL', splits, meters, unitPrice, version } = req.body;

    if (version === undefined || version === null) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu trường version để kiểm soát xung đột dữ liệu (Optimistic Locking)',
        error: 'MISSING_VERSION'
      });
    }

    const memberCheck = await client.query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, currentUserId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên phòng này',
        error: 'FORBIDDEN'
      });
    }

    const membersRes = await client.query(
        'SELECT user_id FROM room_members WHERE room_id = $1 ORDER BY user_id ASC',
        [roomId]
    );

    const strategy = SplitStrategyFactory.getStrategy(splitType);
    const calculatedSplits = strategy.calculate(Number(amount), membersRes.rows, {
      splits,
      meters,
      unitPrice
    });

    await client.query('BEGIN');

    // Kiểm tra và tăng version nguyên tử (Atomic Check-and-Increment)
    const updateRes = await client.query(
        `UPDATE expenses
       SET title = COALESCE($1, title),
           amount = $2,
           category = COALESCE($3, category),
           split_type = $4,
           version = version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND room_id = $6 AND version = $7
       RETURNING id, title, amount, category, split_type AS "splitType", version, updated_at AS "updatedAt"`,
        [title ? title.trim() : null, Number(amount), category, splitType.toUpperCase(), expenseId, roomId, Number(version)]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Dữ liệu hóa đơn đã bị thành viên khác chỉnh sửa trước đó. Vui lòng tải lại trang và thử lại.',
        error: 'OPTIMISTIC_LOCK_CONFLICT'
      });
    }

    // Cập nhật lại chi tiết chia tiền
    await client.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);
    for (const item of calculatedSplits) {
      await client.query(
          `INSERT INTO expense_splits (expense_id, user_id, split_amount, metadata)
         VALUES ($1, $2, $3, $4)`,
          [expenseId, item.userId, item.splitAmount, JSON.stringify(item.metadata || {})]
      );
    }

    await client.query('COMMIT');

    // Xóa cache công nợ phòng sau khi sửa hóa đơn
    await deleteCache(getBalanceCacheKey(roomId));

    return res.status(200).json({
      success: true,
      message: 'Cập nhật khoản chi tiêu thành công',
      data: {
        ...updateRes.rows[0],
        amount: Number(updateRes.rows[0].amount),
        splits: calculatedSplits
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// 3. Xem công nợ phòng: Cache-Aside Redis + Min-Cash-Flow + VietQR động
async function getBalances(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);

    const memberCheck = await query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, currentUserId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thuộc phòng trọ này',
        error: 'FORBIDDEN'
      });
    }

    const cacheKey = getBalanceCacheKey(roomId);

    // Bước 1 (Cache-Aside): Đọc từ Redis trước
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        source: 'REDIS_CACHE',
        data: cachedData
      });
    }

    // Bước 2 (Cache Miss): Truy vấn PostgreSQL
    const roomRes = await query('SELECT name FROM rooms WHERE id = $1', [roomId]);
    const roomName = roomRes.rows[0]?.name || `Phong ${roomId}`;

    const membersRes = await query(
        `SELECT u.id AS "userId", u.full_name AS "fullName",
              u.bank_bin AS "bankBin", u.bank_account AS "bankAccount"
       FROM room_members rm
       JOIN users u ON u.id = rm.user_id
       WHERE rm.room_id = $1`,
        [roomId]
    );

    const paidRes = await query(
        `SELECT payer_id, COALESCE(SUM(amount), 0) AS "totalPaid"
       FROM expenses
       WHERE room_id = $1
       GROUP BY payer_id`,
        [roomId]
    );

    const paidMap = {};
    let totalRoomExpense = 0;
    paidRes.rows.forEach((r) => {
      const amt = Number(r.totalPaid);
      paidMap[r.payer_id] = amt;
      totalRoomExpense += amt;
    });

    const owedRes = await query(
        `SELECT es.user_id, COALESCE(SUM(es.split_amount), 0) AS "totalOwed"
       FROM expense_splits es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.room_id = $1
       GROUP BY es.user_id`,
        [roomId]
    );

    const owedMap = {};
    owedRes.rows.forEach((r) => {
      owedMap[r.user_id] = Number(r.totalOwed);
    });

    const memberBalances = membersRes.rows.map((m) => {
      const paid = paidMap[m.userId] || 0;
      const owed = owedMap[m.userId] || 0;
      return {
        userId: m.userId,
        fullName: m.fullName,
        totalPaid: paid,
        totalOwed: owed,
        netBalance: paid - owed,
        bankBin: m.bankBin,
        bankAccount: m.bankAccount
      };
    });

    // Rút gọn giao dịch tối đa (N - 1) & sinh link VietQR động
    const simplifiedTransactions = simplifyDebtsWithVietQR(memberBalances, roomName);

    const responsePayload = {
      totalRoomExpense,
      memberBalances: memberBalances.map(({ bankBin, bankAccount, ...rest }) => rest),
      simplifiedTransactions
    };

    // Bước 3: Ghi ngược lại vào Redis (TTL = 5 phút)
    await setCache(cacheKey, responsePayload, 300);

    return res.status(200).json({
      success: true,
      source: 'POSTGRES_DB',
      data: responsePayload
    });
  } catch (err) {
    next(err);
  }
}
// 4. Lấy danh sách hóa đơn của phòng
async function getExpenses(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);

    const memberCheck = await query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, currentUserId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thuộc phòng trọ này',
        error: 'FORBIDDEN'
      });
    }

    const expensesRes = await query(
        `SELECT e.id, e.title, e.amount, e.category, e.payer_id AS "payerId",
              u.full_name AS "payerName", e.split_type AS "splitType",
              e.version, e.created_at AS "createdAt"
       FROM expenses e
       JOIN users u ON u.id = e.payer_id
       WHERE e.room_id = $1
       ORDER BY e.created_at DESC`,
        [roomId]
    );

    return res.status(200).json({
      success: true,
      data: expensesRes.rows.map((item) => ({
        ...item,
        amount: Number(item.amount)
      }))
    });
  } catch (err) {
    next(err);
  }
}

// 5. Xóa hóa đơn
async function deleteExpense(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);
    const expenseId = parseInt(req.params.expenseId, 10);

    const memberCheck = await query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, currentUserId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên phòng này',
        error: 'FORBIDDEN'
      });
    }

    const deleteRes = await query(
        'DELETE FROM expenses WHERE id = $1 AND room_id = $2 RETURNING id',
        [expenseId, roomId]
    );

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoản chi tiêu',
        error: 'NOT_FOUND'
      });
    }

    await deleteCache(getBalanceCacheKey(roomId));

    return res.status(200).json({
      success: true,
      message: 'Xóa khoản chi tiêu thành công'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createExpense,
  getExpenses,
  getRoomExpense: getExpenses, // Alias phòng trường hợp route gọi tên này
  updateExpense,
  deleteExpense,
  getBalances
};