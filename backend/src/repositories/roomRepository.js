const { query } = require('../config/db');

async function findById(id) {
  const result = await query(
    'SELECT id, name, campus, address_or_block AS "addressOrBlock", created_by AS "createdBy", created_at AS "createdAt" FROM rooms WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findByUserId(userId) {
  const result = await query(
    `SELECT r.id, r.name, r.campus, r.address_or_block AS "addressOrBlock", r.created_by AS "createdBy", r.created_at AS "createdAt"
     FROM rooms r
     JOIN room_members rm ON rm.room_id = r.id
     WHERE rm.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function findMember(roomId, userId) {
  const result = await query(
    'SELECT id, room_id AS "roomId", user_id AS "userId", role, joined_at AS "joinedAt" FROM room_members WHERE room_id = $1 AND user_id = $2',
    [roomId, userId]
  );
  return result.rows[0] || null;
}

async function findMemberAnyRoom(userId) {
  const result = await query(
    'SELECT id, room_id AS "roomId", user_id AS "userId", role FROM room_members WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

async function findMembersByRoomId(roomId) {
  const result = await query(
    `SELECT u.id AS "userId", u.full_name AS "fullName", u.student_id AS "studentId", u.email, rm.role, rm.joined_at AS "joinedAt"
     FROM room_members rm
     JOIN users u ON u.id = rm.user_id
     WHERE rm.room_id = $1
     ORDER BY rm.role ASC, rm.joined_at ASC`,
    [roomId]
  );
  return result.rows;
}

async function create({ name, campus, addressOrBlock, createdBy }) {
  const result = await query(
    `INSERT INTO rooms (name, campus, address_or_block, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, campus, address_or_block AS "addressOrBlock", created_at AS "createdAt"`,
    [name, campus, addressOrBlock, createdBy]
  );
  return result.rows[0];
}

async function addMember(roomId, userId, role = 'MEMBER') {
  const result = await query(
    `INSERT INTO room_members (room_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (room_id, user_id) DO NOTHING
     RETURNING id, room_id AS "roomId", user_id AS "userId", role`,
    [roomId, userId, role]
  );
  return result.rows[0];
}

async function removeMember(roomId, userId) {
  await query(
    'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
    [roomId, userId]
  );
}

async function updateMemberRole(roomId, userId, role) {
  await query(
    'UPDATE room_members SET role = $1 WHERE room_id = $2 AND user_id = $3',
    [role, roomId, userId]
  );
}

async function updateRoom(roomId, { name, campus, addressOrBlock }) {
  const result = await query(
    `UPDATE rooms
     SET name = COALESCE($1, name),
         campus = COALESCE($2, campus),
         address_or_block = COALESCE($3, address_or_block)
     WHERE id = $4
     RETURNING id, name, campus, address_or_block AS "addressOrBlock"`,
    [name, campus, addressOrBlock, roomId]
  );
  return result.rows[0] || null;
}

async function deleteRoom(roomId) {
  await query('DELETE FROM rooms WHERE id = $1', [roomId]);
}

module.exports = {
  findById,
  findByUserId,
  findMember,
  findMemberAnyRoom,
  findMembersByRoomId,
  create,
  addMember,
  removeMember,
  updateMemberRole,
  updateRoom,
  deleteRoom
};
