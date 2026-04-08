const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const {
  updateAvailability,
  getMyAvailability,
  getAvailableStudents
} = require('../controllers/availability.controller');

// update own availability
router.post('/update', authenticateToken, updateAvailability);

// get own availability
router.get('/me', authenticateToken, getMyAvailability);

// get all available students (online only)
router.get('/available', authenticateToken, getAvailableStudents);

module.exports = router;

router.post('/update', authenticateToken, updateAvailability);
router.get('/me', authenticateToken, getMyAvailability);
router.get('/available', authenticateToken, getAvailableStudents);
