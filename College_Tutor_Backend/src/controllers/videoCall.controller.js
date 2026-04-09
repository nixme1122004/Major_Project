const pool = require('../config/db'); // ✅ ONLY ONCE

/* ===== START CALL (MANUAL ROOM) ===== */
exports.startCall = async (req, res) => {
  try {
    const { room_id, receiver_id: raw_receiver_id } = req.body;
    const caller_id = req.user.student_id;

    const receiver_id = typeof raw_receiver_id === 'string' && raw_receiver_id.startsWith('u') 
      ? parseInt(raw_receiver_id.substring(1)) 
      : parseInt(raw_receiver_id);

    const [result] = await pool.query(
      `INSERT INTO video_call_sessions
       (room_id, caller_id, receiver_id, status)
       VALUES (?, ?, ?, 'started')`,
      [room_id, caller_id, receiver_id]
    );

    res.status(201).json({
      call_id: result.insertId,
      message: 'Video call started'
    });

  } catch (error) {
    console.error('Start call error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* ===== AUTO CREATE ROOM + START CALL ===== */
exports.startCallAuto = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const caller_id = req.user.student_id;
    const { receiver_id: raw_receiver_id } = req.body;

    const receiver_id = typeof raw_receiver_id === 'string' && raw_receiver_id.startsWith('u') 
      ? parseInt(raw_receiver_id.substring(1)) 
      : parseInt(raw_receiver_id);

    await connection.beginTransaction();

    // 1️⃣ Find or create room
    const [rooms] = await connection.query(
      `SELECT room_id FROM chat_rooms
       WHERE (student1_id = ? AND student2_id = ?)
          OR (student1_id = ? AND student2_id = ?)`,
      [caller_id, receiver_id, receiver_id, caller_id]
    );

    let room_id;

    if (rooms.length > 0) {
      room_id = rooms[0].room_id;
    } else {
      const [roomResult] = await connection.query(
        `INSERT INTO chat_rooms (student1_id, student2_id)
         VALUES (?, ?)`,
        [caller_id, receiver_id]
      );
      room_id = roomResult.insertId;
    }

    // 2️⃣ Start video call
    const [callResult] = await connection.query(
      `INSERT INTO video_call_sessions
       (room_id, caller_id, receiver_id, status)
       VALUES (?, ?, ?, 'started')`,
      [room_id, caller_id, receiver_id]
    );

    await connection.commit();

    res.status(201).json({
      room_id,
      call_id: callResult.insertId,
      message: 'Chat room ready and video call started'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Auto call error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};