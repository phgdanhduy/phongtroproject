const express = require('express');
const { getRoommates, createRequest, getRequests, respondRequest } = require('../controllers/roommateController');
const { authenticate, optionalAuthenticate } = require('../middlewares/authMiddleware');
const { matchingRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.get('/', optionalAuthenticate, matchingRateLimiter, getRoommates);

router.post('/requests', authenticate, matchingRateLimiter, createRequest);
router.get('/requests', authenticate, matchingRateLimiter, getRequests);
router.put('/requests/:id', authenticate, respondRequest);

module.exports = router;
