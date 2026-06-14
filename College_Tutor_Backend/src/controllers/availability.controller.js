const pool = require('../config/db');

/* ===== UPDATE AVAILABILITY ===== */
exports.updateAvailability = async (req, res) => {
  try {
    const { is_available, status_message } = req.body;
    const studentId = req.user.student_id;

    if (typeof is_available !== 'boolean') {
      return res.status(400).json({
        message: 'is_available must be true or false'
      });
    }

    await pool.query(
      `INSERT INTO availability_status
       (student_id, is_available, status_message, last_seen)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       is_available = VALUES(is_available),
       status_message = VALUES(status_message),
       last_seen = NOW()`,
      [studentId, is_available ? 1 : 0, status_message || null]
    );

    res.json({
      message: 'Availability updated successfully'
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* ===== GET MY AVAILABILITY ===== */
exports.getMyAvailability = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    const [rows] = await pool.query(
      `SELECT is_available, status_message, last_seen
       FROM availability_status
       WHERE student_id = ?`,
      [studentId]
    );

    if (rows.length === 0) {
      return res.json({
        is_available: false,
        status_message: null
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* ===== GET AVAILABLE STUDENTS ===== */
exports.getAvailableStudents = async (req, res) => {
  try {
    const collegeId = req.user.college_id;

    const [rows] = await pool.query(
      `SELECT s.student_id, s.name, s.department,
              a.is_available, a.status_message
       FROM students s
       JOIN availability_status a ON s.student_id = a.student_id
       WHERE a.is_available = 1
       AND s.college_id = ?`,
      [collegeId]
    );

    res.json(rows);

  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
