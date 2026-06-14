const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');

const {
  addSkill,
  getMySkills
} = require('../controllers/skills.controller');

router.post('/add', authenticateToken, addSkill);
router.get('/me', authenticateToken, getMySkills);

module.exports = router;
