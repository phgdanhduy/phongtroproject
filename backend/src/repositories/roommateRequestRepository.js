const { query } = require('../config/db');

async function findPendingRequest(senderId, receiverId) {
  const result = await query(
    `SELECT id FROM roommate_requests
     WHERE sender_id = $1 AND receiver_id = $2 AND status = 'PENDING'`,
    [senderId, receiverId]
  );
  return result.rows[0] || null;
}

async function findPendingRoomInvite(receiverId, roomId) {
  const result = await query(
    `SELECT id FROM roommate_requests
     WHERE receiver_id = $1 AND room_id = $2 AND status = 'PENDING'`,
    [receiverId, roomId]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    'SELECT id, sender_id AS "senderId", receiver_id AS "receiverId", room_id AS "roomId", status, message, created_at AS "createdAt" FROM roommate_requests WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function create({ senderId, receiverId, roomId, message, status = 'PENDING' }) {
  const result = await query(
    `INSERT INTO roommate_requests (sender_id, receiver_id, room_id, message, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", room_id AS "roomId", status, message, created_at AS "createdAt"`,
    [senderId, receiverId, roomId, message, status]
  );
  return result.rows[0];
}

async function findReceivedRequests(receiverId) {
  const result = await query(
    `SELECT rr.id, rr.status, rr.message, rr.created_at AS "createdAt",
            u.id AS "senderId", u.full_name AS "senderName", u.student_id AS "senderStudentId", u.email AS "senderEmail",
            p.faculty AS "senderFaculty", p.cohort AS "senderCohort", p.campus AS "senderCampus",
            COALESCE(r.id, cur_rm.room_id) AS "roomId",
            COALESCE(r.name, cur_r.name) AS "roomName"
     FROM roommate_requests rr
     JOIN users u ON u.id = rr.sender_id
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN rooms r ON r.id = rr.room_id
     LEFT JOIN room_members cur_rm ON (cur_rm.user_id = rr.receiver_id AND rr.status = 'ACCEPTED')
     LEFT JOIN rooms cur_r ON cur_r.id = cur_rm.room_id
     WHERE rr.receiver_id = $1
     ORDER BY rr.created_at DESC`,
    [receiverId]
  );
  return result.rows;
}

async function findSentRequests(senderId) {
  const result = await query(
    `SELECT rr.id, rr.status, rr.message, rr.created_at AS "createdAt",
            u.id AS "receiverId", u.full_name AS "receiverName", u.student_id AS "receiverStudentId", u.email AS "receiverEmail",
            p.faculty AS "receiverFaculty", p.cohort AS "receiverCohort", p.campus AS "receiverCampus",
            COALESCE(r.id, cur_rm.room_id) AS "roomId",
            COALESCE(r.name, cur_r.name) AS "roomName"
     FROM roommate_requests rr
     JOIN users u ON u.id = rr.receiver_id
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN rooms r ON r.id = rr.room_id
     LEFT JOIN room_members cur_rm ON (cur_rm.user_id = rr.sender_id AND rr.status = 'ACCEPTED')
     LEFT JOIN rooms cur_r ON cur_r.id = cur_rm.room_id
     WHERE rr.sender_id = $1
     ORDER BY rr.created_at DESC`,
    [senderId]
  );
  return result.rows;
}

async function findRoomPendingInvitations(roomId) {
  const result = await query(
    `SELECT rr.id, rr.receiver_id AS "receiverId", rr.status, rr.created_at AS "createdAt",
            u.full_name AS "receiverName", u.email AS "receiverEmail", u.student_id AS "receiverStudentId"
     FROM roommate_requests rr
     JOIN users u ON u.id = rr.receiver_id
     WHERE rr.room_id = $1 AND rr.status = 'PENDING'
     ORDER BY rr.created_at DESC`,
    [roomId]
  );
  return result.rows;
}

async function updateStatus(id, status, roomId = null) {
  if (roomId) {
    const result = await query(
      `UPDATE roommate_requests SET status = $1, room_id = $2 WHERE id = $3
       RETURNING id, status, room_id AS "roomId"`,
      [status, roomId, id]
    );
    return result.rows[0];
  } else {
    const result = await query(
      `UPDATE roommate_requests SET status = $1 WHERE id = $2
       RETURNING id, status`,
      [status, id]
    );
    return result.rows[0];
  }
}

module.exports = {
  findPendingRequest,
  findPendingRoomInvite,
  findById,
  create,
  findReceivedRequests,
  findSentRequests,
  findRoomPendingInvitations,
  updateStatus
};
