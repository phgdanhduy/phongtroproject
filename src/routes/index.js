const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roommateRoutes = require('./roommateRoutes');
const roomRoutes = require('./roomRoutes');

const { authenticate } = require('../middlewares/authMiddleware');
const { createExpense } = require('../controllers/expenseController');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VNU Living & Expense Hub API is healthy',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roommates', roommateRoutes);
router.use('/matching', roommateRoutes);
router.use('/rooms', roomRoutes);

module.exports = router;
