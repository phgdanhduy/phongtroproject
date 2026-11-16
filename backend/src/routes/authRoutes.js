const express = require('express');
const { register, login } = require('../controllers/authController');
const { authRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', register);
router.post('/login', authRateLimiter, login);

module.exports = router;
