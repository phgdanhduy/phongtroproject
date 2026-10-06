const { query } = require('../config/db');

async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    const userRes = await query(
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

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
        error: 'USER_NOT_FOUND'
      });
    }

    const row = userRes.rows[0];
    const data = {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      studentId: row.studentId,
      profile: {
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
      },
      roomId: row.roomId || null
    };

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      faculty,
      cohort,
      campus,
      locationDetail,
      budget,
      habits = {},
      bio
    } = req.body;

    const {
      sleepSchedule = 'NIGHT_OWL',
      cleanliness = 4,
      noiseLevel = 'QUIET',
      smoking = false,
      hasPet = false
    } = habits;

    await query(
      `INSERT INTO profiles (
         user_id, faculty, cohort, campus, location_detail, budget,
         sleep_schedule, cleanliness, noise_level, smoking, has_pet, bio, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         faculty = COALESCE(EXCLUDED.faculty, profiles.faculty),
         cohort = COALESCE(EXCLUDED.cohort, profiles.cohort),
         campus = COALESCE(EXCLUDED.campus, profiles.campus),
         location_detail = COALESCE(EXCLUDED.location_detail, profiles.location_detail),
         budget = COALESCE(EXCLUDED.budget, profiles.budget),
         sleep_schedule = COALESCE(EXCLUDED.sleep_schedule, profiles.sleep_schedule),
         cleanliness = COALESCE(EXCLUDED.cleanliness, profiles.cleanliness),
         noise_level = COALESCE(EXCLUDED.noise_level, profiles.noise_level),
         smoking = COALESCE(EXCLUDED.smoking, profiles.smoking),
         has_pet = COALESCE(EXCLUDED.has_pet, profiles.has_pet),
         bio = COALESCE(EXCLUDED.bio, profiles.bio),
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        faculty || null,
        cohort || null,
        campus || 'HOA_LAC',
        locationDetail || null,
        budget || 1500000,
        sleepSchedule,
        cleanliness,
        noiseLevel,
        smoking,
        hasPet,
        bio || null
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: {
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateProfile
};
