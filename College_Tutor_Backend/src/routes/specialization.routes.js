const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');

const {
  addSpecialization,
  getMySpecializations
} = require('../controllers/specialization.controller');

router.post('/add', authenticateToken, addSpecialization);
router.get('/me', authenticateToken, getMySpecializations);

module.exports = router;
