const expenseService = require('../services/expenseService');

async function createExpense(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const data = await expenseService.createExpense(req.user.id, roomId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Thêm khoản chi tiêu thành công',
      data
    });
  } catch (err) {
    next(err);
  }
}

async function updateExpense(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const expenseId = parseInt(req.params.expenseId, 10);
    const data = await expenseService.updateExpense(req.user.id, roomId, expenseId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật khoản chi tiêu thành công',
      data
    });
  } catch (err) {
    if (err.errorCode === 'OPTIMISTIC_LOCK_CONFLICT' || err.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: err.message,
        error: 'OPTIMISTIC_LOCK_CONFLICT'
      });
    }
    next(err);
  }
}

async function getExpenses(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const data = await expenseService.getExpenses(req.user.id, roomId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function getBalances(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const data = await expenseService.getBalances(req.user.id, roomId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const expenseId = parseInt(req.params.expenseId, 10);
    const data = await expenseService.deleteExpense(req.user.id, roomId, expenseId);

    return res.status(200).json({
      success: true,
      message: 'Xóa khoản chi tiêu thành công',
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenses,
  getBalances
};
