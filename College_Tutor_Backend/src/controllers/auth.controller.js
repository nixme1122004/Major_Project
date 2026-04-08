const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* ================= REGISTER ================= */
exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password, college_id, department, year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing name, email, or password' });
    }

    // Bypass strict college domain checking for the demo
    // Automatically fallback to NULL if no college mapped
    const finalCollegeId = college_id || null;

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT student_id FROM students WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO students
       (name, email, password_hash, college_id, department, year)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, finalCollegeId, department || 'General', year || 1]
    );

    res.status(201).json({ message: 'Student registered successfully' });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* ================= LOGIN ================= */
exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM students WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const student = rows[0];

    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        student_id: student.student_id,
        college_id: student.college_id,
        email: student.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
