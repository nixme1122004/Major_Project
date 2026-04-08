const pool = require('../config/db');

/* ===== ADD SPECIALIZATION ===== */
exports.addSpecialization = async (req, res) => {
  try {
    const { specialization_id, proficiency } = req.body;
    const studentId = req.user.student_id;

    if (!specialization_id) {
      return res.status(400).json({
        message: 'specialization_id is required'
      });
    }

    await pool.query(
      `INSERT INTO student_specializations
       (student_id, specialization_id, proficiency)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       proficiency = VALUES(proficiency)`,
      [studentId, specialization_id, proficiency || 1]
    );

    res.status(201).json({
      message: 'Specialization added/updated successfully'
    });

  } catch (error) {
    console.error('Add specialization error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

/* ===== GET MY SPECIALIZATIONS ===== */
exports.getMySpecializations = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    const [rows] = await pool.query(
      `SELECT specialization_id, proficiency
       FROM student_specializations
       WHERE student_id = ?`,
      [studentId]
    );

    res.json(rows);

  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
};
