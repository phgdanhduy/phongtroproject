const { pool, query } = require('../config/db');

async function createExpenseWithSplits({ roomId, title, amount, category = 'LIVING', payerId, splitType = 'EQUAL', calculatedSplits }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expenseRes = await client.query(
      `INSERT INTO expenses (room_id, title, amount, category, payer_id, split_type, version)
       VALUES ($1, $2, $3, $4, $5, $6, 1)
       RETURNING id, room_id AS "roomId", title, amount, category, payer_id AS "payerId",
                 split_type AS "splitType", version, created_at AS "createdAt"`,
      [roomId, title, amount, category, payerId, splitType.toUpperCase()]
    );

    const newExpense = expenseRes.rows[0];

    for (const split of calculatedSplits) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, split_amount, metadata)
         VALUES ($1, $2, $3, $4)`,
        [newExpense.id, split.userId, split.splitAmount, JSON.stringify(split.metadata || {})]
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

async function updateExpenseWithSplits({ expenseId, roomId, title, amount, category, splitType, calculatedSplits, version }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(
      `UPDATE expenses
       SET title = COALESCE($1, title),
           amount = COALESCE($2, amount),
           category = COALESCE($3, category),
           split_type = COALESCE($4, split_type),
           version = version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND room_id = $6 AND version = $7
       RETURNING id, room_id AS "roomId", title, amount, category, payer_id AS "payerId",
                 split_type AS "splitType", version, updated_at AS "updatedAt", created_at AS "createdAt"`,
      [title ? title.trim() : null, amount ? Number(amount) : null, category || null, splitType ? splitType.toUpperCase() : null, expenseId, roomId, Number(version)]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const conflictErr = new Error('Dữ liệu hóa đơn đã bị thành viên khác chỉnh sửa trước đó. Vui lòng tải lại trang và thử lại.');
      conflictErr.statusCode = 409;
      conflictErr.errorCode = 'OPTIMISTIC_LOCK_CONFLICT';
      throw conflictErr;
    }

    const updatedExpense = updateRes.rows[0];

    // Cập nhật lại chi tiết phân chia tiền
    if (calculatedSplits && calculatedSplits.length > 0) {
      await client.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);
      for (const split of calculatedSplits) {
        await client.query(
          `INSERT INTO expense_splits (expense_id, user_id, split_amount, metadata)
           VALUES ($1, $2, $3, $4)`,
          [expenseId, split.userId, split.splitAmount, JSON.stringify(split.metadata || {})]
        );
      }
    }

    await client.query('COMMIT');
    return updatedExpense;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findById(expenseId, roomId) {
  const result = await query(
    `SELECT e.id, e.room_id AS "roomId", e.title, e.amount, e.category,
            e.split_type AS "splitType", e.version, e.created_at AS "createdAt", e.updated_at AS "updatedAt",
            u.id AS "payerId", u.full_name AS "payerFullName"
     FROM expenses e
     LEFT JOIN users u ON u.id = e.payer_id
     WHERE e.id = $1 AND ($2::int IS NULL OR e.room_id = $2)`,
    [expenseId, roomId || null]
  );
  return result.rows[0] || null;
}

async function findByRoomId(roomId) {
  const result = await query(
    `SELECT e.id, e.title, e.amount, e.category, e.split_type AS "splitType", e.version,
            e.created_at AS "createdAt", e.updated_at AS "updatedAt",
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

async function getSplitsByExpenseId(expenseId) {
  const result = await query(
    `SELECT es.id, es.user_id AS "userId", es.split_amount AS "splitAmount", es.metadata,
            u.full_name AS "fullName"
     FROM expense_splits es
     JOIN users u ON u.id = es.user_id
     WHERE es.expense_id = $1
     ORDER BY es.user_id ASC`,
    [expenseId]
  );
  return result.rows;
}

async function deleteById(expenseId, roomId) {
  const result = await query(
    'DELETE FROM expenses WHERE id = $1 AND room_id = $2 RETURNING id',
    [expenseId, roomId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createExpenseWithSplits,
  updateExpenseWithSplits,
  findById,
  findByRoomId,
  getTotalsPaidByRoomId,
  getTotalsOwedByRoomId,
  getSplitsByExpenseId,
  deleteById
};
