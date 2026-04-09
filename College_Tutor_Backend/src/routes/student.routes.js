const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const studentController = require('../controllers/student.controller');

router.get('/profile', authenticateToken, studentController.getProfile);
router.put('/profile', authenticateToken, studentController.updateProfile);
router.get('/all', authenticateToken, studentController.getAllStudents);

router.post('/skill', authenticateToken, studentController.addSkill);

module.exports = router;
