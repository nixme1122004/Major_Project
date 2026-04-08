const express = require('express');
const router = express.Router();

const {
  loginStudent,
  registerStudent
} = require('../controllers/auth.controller');

router.post('/login', loginStudent);
router.post('/register', registerStudent);

module.exports = router;
