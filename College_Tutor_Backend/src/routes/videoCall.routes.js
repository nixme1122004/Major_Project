const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/videoCall.controller');

router.post('/start-auto', auth, controller.startCallAuto);

module.exports = router;
