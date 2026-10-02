const express = require('express');
const { getRoommates } = require('../controllers/roommateController');

const router = express.Router();

router.get('/', getRoommates);

module.exports = router;
