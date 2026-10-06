const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const userRepository = require('../repositories/userRepository');
const { AppError } = require('../utils/errors');

const VNU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@vnu\.edu\.vn$/;

async function register({ email, password, fullName, studentId }) {
  if (!email || !password || !fullName || !studentId) {
    throw new AppError(
      'Vui lòng cung cấp đầy đủ thông tin (email, password, fullName, studentId)',
      400,
      'MISSING_FIELDS'
    );
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!VNU_EMAIL_REGEX.test(trimmedEmail)) {
    throw new AppError(
      'Email phải có định dạng đuôi @vnu.edu.vn',
      400,
      'INVALID_VNU_EMAIL'
    );
  }

  if (password.length < 6) {
    throw new AppError(
      'Mật khẩu phải có ít nhất 6 ký tự',
      400,
      'WEAK_PASSWORD'
    );
  }

  const existing = await userRepository.findByEmail(trimmedEmail);
  if (existing) {
    throw new AppError(
      'Email này đã được đăng ký tài khoản',
      400,
      'EMAIL_ALREADY_EXISTS'
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await userRepository.create({
    email: trimmedEmail,
    password: hashedPassword,
    fullName: fullName.trim(),
    studentId: studentId.trim()
  });

  const token = generateToken(newUser);

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      studentId: newUser.studentId
    },
    token
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError(
      'Vui lòng nhập email và mật khẩu',
      400,
      'MISSING_CREDENTIALS'
    );
  }

  const trimmedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(trimmedEmail);
  if (!user) {
    throw new AppError(
      'Email hoặc mật khẩu không chính xác',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(
      'Email hoặc mật khẩu không chính xác',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  const userWithProfile = await userRepository.getUserWithProfileAndRoom(user.id);
  const hasProfile = Boolean(userWithProfile && userWithProfile.faculty);

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      studentId: user.studentId,
      hasProfile
    },
    token
  };
}

module.exports = {
  register,
  login
};
