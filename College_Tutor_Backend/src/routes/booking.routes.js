const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All booking routes require authentication
router.use(authMiddleware);

router.post('/create', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.patch('/status/:booking_id', bookingController.updateBookingStatus);

module.exports = router;
