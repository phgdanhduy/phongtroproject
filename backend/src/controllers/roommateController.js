const { query } = require('../config/db');

async function getRoommates(req, res, next) {
  try {
    const { campus, faculty, cohort } = req.query;

    let sql = `
      SELECT u.id AS "userId", u.full_name AS "fullName", u.student_id AS "studentId",
             p.faculty, p.cohort, p.campus, p.location_detail AS "locationDetail",
             p.budget, p.sleep_schedule AS "sleepSchedule", p.cleanliness,
             p.noise_level AS "noiseLevel", p.smoking, p.has_pet AS "hasPet", p.bio
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN room_members rm ON rm.user_id = u.id
      WHERE rm.room_id IS NULL
    `;
    const params = [];

    if (campus) {
      params.push(campus);
      sql += ` AND p.campus = $${params.length}`;
    }

    if (faculty) {
      params.push(`%${faculty}%`);
      sql += ` AND p.faculty ILIKE $${params.length}`;
    }

    if (cohort) {
      params.push(cohort);
      sql += ` AND p.cohort = $${params.length}`;
    }

    sql += ` ORDER BY p.updated_at DESC LIMIT 50`;

    const result = await query(sql, params);

    const roommates = result.rows.map(row => ({
      userId: row.userId,
      fullName: row.fullName,
      studentId: row.studentId,
      faculty: row.faculty,
      cohort: row.cohort,
      campus: row.campus,
      locationDetail: row.locationDetail,
      budget: row.budget,
      habits: {
        sleepSchedule: row.sleepSchedule,
        cleanliness: row.cleanliness,
        noiseLevel: row.noiseLevel,
        smoking: row.smoking,
        hasPet: row.hasPet
      },
      bio: row.bio
    }));

    return res.status(200).json({
      success: true,
      data: roommates
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRoommates
};
