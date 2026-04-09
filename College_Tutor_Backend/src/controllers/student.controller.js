const pool = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const [rows] = await pool.query('SELECT * FROM Students WHERE student_id = ?', [studentId]);
    
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = rows[0];
    delete user.password_hash;
    
    // Parse skills from JSON column
    if (user.skills_json) {
      try {
        const skills = typeof user.skills_json === 'string' ? JSON.parse(user.skills_json) : user.skills_json;
        user.skillsOffered = skills.offered || [];
        user.skillsWanted = skills.wanted || [];
      } catch (e) {
        user.skillsOffered = [];
        user.skillsWanted = [];
      }
    } else {
      user.skillsOffered = [];
      user.skillsWanted = [];
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const { name, bio, location, avatar, skillsOffered, skillsWanted, department, year } = req.body;

    const skills_json = JSON.stringify({
      offered: skillsOffered || [],
      wanted: skillsWanted || []
    });

    await pool.query(
      'UPDATE Students SET name = ?, bio = ?, location = ?, avatar = ?, skills_json = ?, department = ?, year = ? WHERE student_id = ?',
      [name, bio, location, avatar, skills_json, department, year, studentId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addSkill = async (req, res) => {
  const { student_id, specialization_id, proficiency } = req.body;

  await pool.query(
    `INSERT INTO student_specializations
     (student_id, specialization_id, proficiency)
     VALUES (?, ?, ?)`,
    [student_id, specialization_id, proficiency]
  );

  res.json({ message: 'Skill added successfully' });
};

exports.getAllStudents = async (req, res) => {
  try {
    const currentId = req.user.student_id;
    const [rows] = await pool.query(
      `SELECT student_id, name, avatar, bio, location, department, skills_json FROM Students WHERE student_id != ?`,
      [currentId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch all users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
