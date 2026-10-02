require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query, initDB } = require('../config/db');

async function seedData() {
  try {
    console.log('🌱 Đang khởi tạo dữ liệu mẫu (Seed Data)...');
    await initDB();

    const hashedPassword = await bcrypt.hash('Password123@', 10);

    const users = [
      { email: 'student1@vnu.edu.vn', fullName: 'Nguyễn Văn A', studentId: '22020001' },
      { email: 'student2@vnu.edu.vn', fullName: 'Trần Văn B', studentId: '22020002' },
      { email: 'student3@vnu.edu.vn', fullName: 'Lê Thị C', studentId: '22020003' },
      { email: 'student4@vnu.edu.vn', fullName: 'Phạm Văn D', studentId: '22020004' },
      { email: 'student5@vnu.edu.vn', fullName: 'Hoàng Minh E', studentId: '22020005' },
    ];

    for (const u of users) {
      await query(
        `INSERT INTO users (email, password, full_name, student_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [u.email, hashedPassword, u.fullName, u.studentId]
      );
    }

    // Seed profiles
    const profiles = [
      {
        email: 'student1@vnu.edu.vn',
        faculty: 'Công nghệ Thông tin',
        cohort: 'K67',
        campus: 'HOA_LAC',
        locationDetail: 'Ký túc xá QGHN-01',
        budget: 1500000,
        sleepSchedule: 'NIGHT_OWL',
        cleanliness: 4,
        noiseLevel: 'QUIET',
        bio: 'Sinh viên năm 3, sống ngăn nắp, thích không gian yên tĩnh học tập.'
      },
      {
        email: 'student2@vnu.edu.vn',
        faculty: 'Công nghệ Thông tin',
        cohort: 'K67',
        campus: 'HOA_LAC',
        locationDetail: 'Tòa A2 KTX Hòa Lạc',
        budget: 1500000,
        sleepSchedule: 'NIGHT_OWL',
        cleanliness: 4,
        noiseLevel: 'QUIET',
        bio: 'Tìm bạn ở chung KTX Hòa Lạc, cùng học CNTT.'
      },
      {
        email: 'student3@vnu.edu.vn',
        faculty: 'Kinh tế & Quản lý',
        cohort: 'K68',
        campus: 'HOA_LAC',
        locationDetail: 'Tòa A1 KTX Hòa Lạc',
        budget: 1200000,
        sleepSchedule: 'EARLY',
        cleanliness: 5,
        noiseLevel: 'NORMAL',
        bio: 'Thói quen sinh hoạt điều độ, vui vẻ hòa đồng.'
      },
      {
        email: 'student4@vnu.edu.vn',
        faculty: 'Trường Ngoại ngữ',
        cohort: 'K67',
        campus: 'NOI_THANH',
        locationDetail: 'Khu vực Cầu Giấy (bán kính < 2km)',
        budget: 2500000,
        sleepSchedule: 'NIGHT_OWL',
        cleanliness: 4,
        noiseLevel: 'NORMAL',
        bio: 'Tìm bạn ghép thuê chung cư mini quanh Xuân Thủy - Cầu Giấy.'
      },
      {
        email: 'student5@vnu.edu.vn',
        faculty: 'Khoa Luật',
        cohort: 'K66',
        campus: 'NOI_THANH',
        locationDetail: 'Khu vực Mễ Trì / Nam Từ Liêm',
        budget: 2000000,
        sleepSchedule: 'EARLY',
        cleanliness: 4,
        noiseLevel: 'QUIET',
        bio: 'Cần tìm phòng yên tĩnh ôn thi tốt nghiệp.'
      }
    ];

    for (const p of profiles) {
      const uRes = await query('SELECT id FROM users WHERE email = $1', [p.email]);
      if (uRes.rows.length > 0) {
        const userId = uRes.rows[0].id;
        await query(
          `INSERT INTO profiles (
             user_id, faculty, cohort, campus, location_detail, budget,
             sleep_schedule, cleanliness, noise_level, smoking, has_pet, bio
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, $10)
           ON CONFLICT (user_id) DO UPDATE SET
             faculty = EXCLUDED.faculty,
             cohort = EXCLUDED.cohort,
             campus = EXCLUDED.campus,
             location_detail = EXCLUDED.location_detail,
             budget = EXCLUDED.budget,
             sleep_schedule = EXCLUDED.sleep_schedule,
             cleanliness = EXCLUDED.cleanliness,
             noise_level = EXCLUDED.noise_level,
             bio = EXCLUDED.bio`,
          [
            userId,
            p.faculty,
            p.cohort,
            p.campus,
            p.locationDetail,
            p.budget,
            p.sleepSchedule,
            p.cleanliness,
            p.noiseLevel,
            p.bio
          ]
        );
      }
    }

    console.log('✅ Seed dữ liệu mẫu thành công!');
    console.log('Tài khoản mẫu: student1@vnu.edu.vn / Password123@');
    console.log('Tài khoản mẫu: student2@vnu.edu.vn / Password123@');
  } catch (err) {
    console.error('❌ Lỗi khi seed dữ liệu:', err);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedData();
}

module.exports = seedData;
