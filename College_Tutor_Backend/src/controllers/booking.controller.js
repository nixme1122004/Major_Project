const pool = require('../config/db');
const { getIO } = require('../socket');

exports.createBooking = async (req, res) => {
  try {
    const { teacher_id, learner_id, initiator_id, skill_name, skill_id, milestones, start_time, end_time } = req.body;

    // Convert numeric IDs if they come from frontend as 'u3'
    const cleanId = (id) => typeof id === 'string' && id.startsWith('u') ? parseInt(id.substring(1)) : parseInt(id);
    
    const t_id = cleanId(teacher_id);
    const l_id = cleanId(learner_id);
    const i_id = cleanId(initiator_id);

    const [result] = await pool.query(
      `INSERT INTO bookings (teacher_id, learner_id, initiator_id, skill_name, skill_id, milestones, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [t_id, l_id, i_id, skill_name, skill_id, JSON.stringify(milestones), start_time, end_time]
    );

    const newBooking = {
      booking_id: result.insertId,
      teacher_id: t_id,
      learner_id: l_id,
      initiator_id: i_id,
      skill_name,
      skill_id,
      milestones,
      status: 'pending',
      start_time,
      end_time,
      created_at: new Date()
    };

    // 📣 Real-time notification: Notify the "OTHER" person (not the initiator)
    const receiver_id = i_id === t_id ? l_id : t_id;
    
    getIO().to(`user_${receiver_id}`).emit('new-request', {
      booking: newBooking,
      from_name: req.user.name
    });

    res.status(201).json({
      message: 'Booking request sent successfully',
      data: newBooking
    });

  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const student_id = req.user.student_id;

    const [rows] = await pool.query(
      `SELECT b.*, 
        t.name as teacher_name, t.avatar as teacher_avatar,
        l.name as learner_name, l.avatar as learner_avatar
       FROM bookings b
       JOIN Students t ON b.teacher_id = t.student_id
       JOIN Students l ON b.learner_id = l.student_id
       WHERE b.teacher_id = ? OR b.learner_id = ?
       ORDER BY b.created_at DESC`,
      [student_id, student_id]
    );

    // Parse JSON milestones
    const bookings = rows.map(r => ({
      ...r,
      milestones: r.milestones ? JSON.parse(r.milestones) : []
    }));

    res.json(bookings);
  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const student_id = req.user.student_id;

    // Security: Only the teacher or learner (depending on context) can update status
    // For simplicity, let's assume any involved party can update for now, or refine later
    const [result] = await pool.query(
      `UPDATE bookings SET status = ? WHERE booking_id = ? AND (teacher_id = ? OR learner_id = ?)`,
      [status, booking_id, student_id, student_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found or access denied' });
    }

    // Notify the other person about the status change
    const [bookingRows] = await pool.query('SELECT * FROM bookings WHERE booking_id = ?', [booking_id]);
    if (bookingRows.length > 0) {
      const booking = bookingRows[0];
      const other_id = student_id === booking.teacher_id ? booking.learner_id : booking.teacher_id;
      
      getIO().to(`user_${other_id}`).emit('booking-status-updated', {
        booking_id,
        status,
        updated_by: student_id
      });
    }

    res.json({ message: `Booking ${status}` });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
