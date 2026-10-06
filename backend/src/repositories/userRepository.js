const { query } = require('../config/db');

async function findByEmail(email) {
  const result = await query(
    'SELECT id, email, password, full_name AS "fullName", student_id AS "studentId", created_at AS "createdAt" FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    'SELECT id, email, full_name AS "fullName", student_id AS "studentId", created_at AS "createdAt" FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function create({ email, password, fullName, studentId }) {
  const result = await query(
    `INSERT INTO users (email, password, full_name, student_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name AS "fullName", student_id AS "studentId"`,
    [email, password, fullName, studentId]
  );
  return result.rows[0];
}

async function getUserWithProfileAndRoom(userId) {
  const result = await query(
    `SELECT u.id, u.email, u.full_name AS "fullName", u.student_id AS "studentId",
            p.faculty, p.cohort, p.campus, p.location_detail AS "locationDetail",
            p.budget, p.sleep_schedule AS "sleepSchedule", p.cleanliness,
            p.noise_level AS "noiseLevel", p.smoking, p.has_pet AS "hasPet", p.bio,
            rm.room_id AS "roomId"
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN room_members rm ON rm.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  findByEmail,
  findById,
  create,
  getUserWithProfileAndRoom
};
