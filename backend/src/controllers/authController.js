const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateToken } = require('../config/jwt');

const VNU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@vnu\.edu\.vn$/;

async function register(req, res, next) {
  try {
    const { email, password, fullName, studentId } = req.body;

    if (!email || !password || !fullName || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin (email, password, fullName, studentId)',
        error: 'MISSING_FIELDS'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!VNU_EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email phải có định dạng đuôi @vnu.edu.vn',
        error: 'INVALID_VNU_EMAIL'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
        error: 'WEAK_PASSWORD'
      });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký tài khoản',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUserRes = await query(
      `INSERT INTO users (email, password, full_name, student_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name AS "fullName", student_id AS "studentId"`,
      [trimmedEmail, hashedPassword, fullName.trim(), studentId.trim()]
    );

    const newUser = insertUserRes.rows[0];

    // Initialize default profile
    await query(
      `INSERT INTO profiles (user_id, campus, sleep_schedule, cleanliness, noise_level)
       VALUES ($1, 'HOA_LAC', 'NIGHT_OWL', 4, 'QUIET')`,
      [newUser.id]
    );

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      studentId: newUser.studentId
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: newUser,
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
        error: 'MISSING_CREDENTIALS'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const userRes = await query(
      `SELECT id, email, password, full_name AS "fullName", student_id AS "studentId"
       FROM users WHERE email = $1`,
      [trimmedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check if profile exists and has faculty filled
    const profileRes = await query(
      `SELECT faculty, campus FROM profiles WHERE user_id = $1`,
      [user.id]
    );
    const hasProfile = profileRes.rows.length > 0 && !!profileRes.rows[0].faculty;

    const token = generateToken({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      studentId: user.studentId
    });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          studentId: user.studentId,
          hasProfile
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};
