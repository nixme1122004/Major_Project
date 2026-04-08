const pool = require('../config/db');

/**
 * SEARCH TUTORS BY KEYWORD
 * - Same college
 * - Available students only
 * - Match specialization keyword
 * - Order by proficiency (high → low)
 */
exports.searchTutors = async (req, res) => {
  try {
    const { keyword } = req.query;
    const collegeId = req.user.college_id;

    if (!keyword) {
      return res.status(400).json({
        message: 'keyword query parameter is required'
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        s.student_id,
        s.name,
        s.department,
        sp.proficiency,
        spec.specialization_name,
        a.status_message,
        a.last_seen
      FROM students s
      JOIN student_specializations sp
        ON s.student_id = sp.student_id
      JOIN specializations spec
        ON sp.specialization_id = spec.specialization_id
      JOIN availability_status a
        ON s.student_id = a.student_id
      WHERE spec.specialization_name LIKE ?
        AND a.is_available = 1
        AND s.college_id = ?
      ORDER BY sp.proficiency DESC
      `,
      [`%${keyword}%`, collegeId]
    );

    res.json(rows);

  } catch (error) {
    console.error('Search tutors error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
};
