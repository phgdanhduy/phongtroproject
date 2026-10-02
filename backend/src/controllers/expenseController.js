const { pool, query } = require('../config/db');

async function createExpense(req, res, next) {
  const client = await pool.connect();
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);
    const { title, amount, category = 'LIVING', payerId } = req.body;

    if (!title || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên khoản chi và số tiền hợp lệ (> 0)',
        error: 'INVALID_INPUT'
      });
    }

    // Check if current user is in this room
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

    // Get all members of the room
    const membersRes = await client.query(
      'SELECT user_id FROM room_members WHERE room_id = $1',
      [roomId]
    );

    const members = membersRes.rows;
    if (members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phòng chưa có thành viên nào',
        error: 'EMPTY_ROOM'
      });
    }

    const effectivePayerId = payerId || currentUserId;
    const splitPerMember = Math.round(Number(amount) / members.length);

    await client.query('BEGIN');

    // Insert expense
    const expenseRes = await client.query(
      `INSERT INTO expenses (room_id, title, amount, category, payer_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, amount, category, payer_id AS "payerId", created_at AS "createdAt"`,
      [roomId, title.trim(), Number(amount), category, effectivePayerId]
    );

    const newExpense = expenseRes.rows[0];

    // Insert splits for each member
    for (const member of members) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, split_amount)
         VALUES ($1, $2, $3)`,
        [newExpense.id, member.user_id, splitPerMember]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Thêm khoản chi tiêu thành công',
      data: {
        id: newExpense.id,
        title: newExpense.title,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        payerId: newExpense.payerId,
        splitPerMember,
        createdAt: newExpense.createdAt
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function getExpenses(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);

    // Verify room access
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
      `SELECT e.id, e.title, e.amount, e.category, e.created_at AS "createdAt",
              u.id AS "payerId", u.full_name AS "payerFullName"
       FROM expenses e
       LEFT JOIN users u ON u.id = e.payer_id
       WHERE e.room_id = $1
       ORDER BY e.created_at DESC`,
      [roomId]
    );

    const data = expensesRes.rows.map(row => ({
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

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function getBalances(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);

    // Verify room access
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

    // Get all members
    const membersRes = await query(
      `SELECT u.id AS "userId", u.full_name AS "fullName"
       FROM room_members rm
       JOIN users u ON u.id = rm.user_id
       WHERE rm.room_id = $1`,
      [roomId]
    );

    // Get total paid by each member
    const paidRes = await query(
      `SELECT payer_id, COALESCE(SUM(amount), 0) AS "totalPaid"
       FROM expenses
       WHERE room_id = $1
       GROUP BY payer_id`,
      [roomId]
    );

    const paidMap = {};
    let totalRoomExpense = 0;
    paidRes.rows.forEach(r => {
      const amt = Number(r.totalPaid);
      paidMap[r.payer_id] = amt;
      totalRoomExpense += amt;
    });

    // Get total owed by each member in this room
    const owedRes = await query(
      `SELECT es.user_id, COALESCE(SUM(es.split_amount), 0) AS "totalOwed"
       FROM expense_splits es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.room_id = $1
       GROUP BY es.user_id`,
      [roomId]
    );

    const owedMap = {};
    owedRes.rows.forEach(r => {
      owedMap[r.user_id] = Number(r.totalOwed);
    });

    const memberBalances = membersRes.rows.map(m => {
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

    return res.status(200).json({
      success: true,
      data: {
        totalRoomExpense,
        memberBalances
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createExpense,
  getExpenses,
  getBalances
};
