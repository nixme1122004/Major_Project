const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');

router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'Protected route accessed',
    user: req.user
  });
});

module.exports = router;
