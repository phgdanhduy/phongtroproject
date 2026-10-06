const express = require('express');
const { getRoommates, createRequest, getRequests, respondRequest } = require('../controllers/roommateController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getRoommates);

router.post('/requests', authenticate, createRequest);
router.get('/requests', authenticate, getRequests);
router.put('/requests/:id', authenticate, respondRequest);

module.exports = router;
