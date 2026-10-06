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

module.exports = {
  createExpense,
  getExpenses,
  getBalances
};
