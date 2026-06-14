const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/message.controller');

router.post('/send', auth, controller.sendMessage);
router.get('/:receiver_id', auth, controller.getMessages);

module.exports = router;
