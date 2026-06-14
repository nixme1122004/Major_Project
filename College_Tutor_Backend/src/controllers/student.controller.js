const pool = require('../config/db');

exports.addSkill = async (req, res) => {
  const { student_id, specialization_id, proficiency } = req.body;

  await pool.query(
    `INSERT INTO student_specializations
     (student_id, specialization_id, proficiency)
     VALUES ($1,$2,$3)`,
    [student_id, specialization_id, proficiency]
  );

  res.json({ message: 'Skill added successfully' });
};
