const { query } = require('../config/db');

async function findByUserId(userId) {
  const result = await query(
    'SELECT * FROM profiles WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

async function upsert(userId, {
  faculty,
  cohort,
  campus,
  locationDetail,
  dormBuilding,
  district,
  phone,
  zalo,
  budget,
  sleepSchedule,
  cleanliness,
  noiseLevel,
  smoking,
  hasPet,
  bio
}) {
  const result = await query(
    `INSERT INTO profiles (
       user_id, faculty, cohort, campus, location_detail, dorm_building, district, phone, zalo, budget,
       sleep_schedule, cleanliness, noise_level, smoking, has_pet, bio, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) DO UPDATE SET
       faculty = COALESCE(EXCLUDED.faculty, profiles.faculty),
       cohort = COALESCE(EXCLUDED.cohort, profiles.cohort),
       campus = COALESCE(EXCLUDED.campus, profiles.campus),
       location_detail = COALESCE(EXCLUDED.location_detail, profiles.location_detail),
       dorm_building = COALESCE(EXCLUDED.dorm_building, profiles.dorm_building),
       district = COALESCE(EXCLUDED.district, profiles.district),
       phone = COALESCE(EXCLUDED.phone, profiles.phone),
       zalo = COALESCE(EXCLUDED.zalo, profiles.zalo),
       budget = COALESCE(EXCLUDED.budget, profiles.budget),
       sleep_schedule = COALESCE(EXCLUDED.sleep_schedule, profiles.sleep_schedule),
       cleanliness = COALESCE(EXCLUDED.cleanliness, profiles.cleanliness),
       noise_level = COALESCE(EXCLUDED.noise_level, profiles.noise_level),
       smoking = COALESCE(EXCLUDED.smoking, profiles.smoking),
       has_pet = COALESCE(EXCLUDED.has_pet, profiles.has_pet),
       bio = COALESCE(EXCLUDED.bio, profiles.bio),
       updated_at = CURRENT_TIMESTAMP
     RETURNING updated_at AS "updatedAt"`,
    [
      userId,
      faculty,
      cohort,
      campus,
      locationDetail,
      dormBuilding,
      district,
      phone,
      zalo,
      budget,
      sleepSchedule,
      cleanliness,
      noiseLevel,
      smoking,
      hasPet,
      bio
    ]
  );
  return result.rows[0];
}

async function findRoommates({ campus, faculty, cohort, dormBuilding, district }) {
  let sql = `
    SELECT u.id AS "userId", u.full_name AS "fullName", u.student_id AS "studentId",
           p.faculty, p.cohort, p.campus, p.location_detail AS "locationDetail",
           p.dorm_building AS "dormBuilding", p.district, p.phone, p.zalo,
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

  if (dormBuilding) {
    params.push(`%${dormBuilding}%`);
    sql += ` AND (p.dorm_building ILIKE $${params.length} OR p.location_detail ILIKE $${params.length})`;
  }

  if (district) {
    params.push(`%${district}%`);
    sql += ` AND (p.district ILIKE $${params.length} OR p.location_detail ILIKE $${params.length})`;
  }

  sql += ` ORDER BY p.updated_at DESC LIMIT 50`;

  const result = await query(sql, params);
  return result.rows;
}

module.exports = {
  findByUserId,
  upsert,
  findRoommates
};
