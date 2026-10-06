const userService = require('../services/userService');

async function getMe(req, res, next) {
  try {
    const data = await userService.getMe(req.user.id);
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
    const data = await userService.updateProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateProfile
};
