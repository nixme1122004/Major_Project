const express = require('express');
const router = express.Router();

const authenticateToken = require('../middlewares/auth.middleware');
const { searchTutors } = require('../controllers/search.controller');

router.get('/tutors', authenticateToken, searchTutors);

module.exports = router;
