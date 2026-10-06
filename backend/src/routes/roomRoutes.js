const express = require('express');
const {
  createRoom,
  getMyRoom,
  updateRoom,
  addMember,
  deleteRoom,
  leaveRoom,
  getRoomInvitations
} = require('../controllers/roomController');
const { createExpense, getExpenses, getBalances } = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả các route phòng và chi tiêu đều yêu cầu đăng nhập
router.use(authenticate);

// Room routes
router.post('/', createRoom);
router.get('/my-room', getMyRoom);
router.get('/my', getMyRoom);
router.put('/:roomId', updateRoom);
router.get('/:roomId/invitations', getRoomInvitations);
router.post('/:roomId/members', addMember);
router.delete('/:roomId', deleteRoom);
router.post('/:roomId/leave', leaveRoom);

// Expense routes
router.post('/:roomId/expenses', createExpense);
router.get('/:roomId/expenses', getExpenses);
router.get('/:roomId/balances', getBalances);

module.exports = router;
