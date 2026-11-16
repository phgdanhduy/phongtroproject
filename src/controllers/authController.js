const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { email, password, fullName, studentId } = req.body;
    const result = await authService.register({ email, password, fullName, studentId });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};
