const { pool, query } = require('../config/db');

async function createExpenseWithSplits({ roomId, title, amount, category, payerId, memberIds, splitPerMember }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expenseRes = await client.query(
      `INSERT INTO expenses (room_id, title, amount, category, payer_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, amount, category, payer_id AS "payerId", created_at AS "createdAt"`,
      [roomId, title, amount, category, payerId]
    );

    const newExpense = expenseRes.rows[0];

    for (const memberId of memberIds) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, split_amount)
         VALUES ($1, $2, $3)`,
        [newExpense.id, memberId, splitPerMember]
      );
    }

    await client.query('COMMIT');
    return newExpense;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findByRoomId(roomId) {
  const result = await query(
    `SELECT e.id, e.title, e.amount, e.category, e.created_at AS "createdAt",
            u.id AS "payerId", u.full_name AS "payerFullName"
     FROM expenses e
     LEFT JOIN users u ON u.id = e.payer_id
     WHERE e.room_id = $1
     ORDER BY e.created_at DESC`,
    [roomId]
  );
  return result.rows;
}

async function getTotalsPaidByRoomId(roomId) {
  const result = await query(
    `SELECT payer_id, COALESCE(SUM(amount), 0) AS "totalPaid"
     FROM expenses
     WHERE room_id = $1
     GROUP BY payer_id`,
    [roomId]
  );
  return result.rows;
}

async function getTotalsOwedByRoomId(roomId) {
  const result = await query(
    `SELECT es.user_id, COALESCE(SUM(es.split_amount), 0) AS "totalOwed"
     FROM expense_splits es
     JOIN expenses e ON e.id = es.expense_id
     WHERE e.room_id = $1
     GROUP BY es.user_id`,
    [roomId]
  );
  return result.rows;
}

module.exports = {
  createExpenseWithSplits,
  findByRoomId,
  getTotalsPaidByRoomId,
  getTotalsOwedByRoomId
};
