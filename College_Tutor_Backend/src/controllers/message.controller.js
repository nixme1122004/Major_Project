const pool = require('../config/db');
const { getIO } = require('../socket');

exports.sendMessage = async (req, res) => {
  try {
    const { room_id, message } = req.body;
    const sender_id = req.user.student_id;

    const [result] = await pool.query(
      `INSERT INTO messages (room_id, sender_id, message)
       VALUES (?, ?, ?)`,
      [room_id, sender_id, message]
    );

    const msgData = {
      message_id: result.insertId,
      room_id,
      sender_id,
      message,
      sent_at: new Date()
    };

    // Emit message to room
    getIO().to(`room_${room_id}`).emit('newMessage', msgData);

    res.status(201).json({
      message: 'Message sent',
      data: msgData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { receiver_id } = req.params;
    const caller_id = req.user.student_id;

    // 1. Find existing room
    const [rooms] = await pool.query(
      `SELECT room_id FROM chat_rooms 
       WHERE (student1_id = ? AND student2_id = ?) 
          OR (student1_id = ? AND student2_id = ?)`,
      [caller_id, receiver_id, receiver_id, caller_id]
    );

    let room_id;
    if (rooms.length > 0) {
      room_id = rooms[0].room_id;
    } else {
      // 2. Create room if it doesn't exist
      const [result] = await pool.query(
        `INSERT INTO chat_rooms (student1_id, student2_id) VALUES (?, ?)`,
        [caller_id, receiver_id]
      );
      room_id = result.insertId;
    }

    // 3. Fetch history
    const [rows] = await pool.query(
      `SELECT * FROM messages WHERE room_id = ? ORDER BY sent_at ASC`,
      [room_id]
    );

    res.json({ room_id, messages: rows });
  } catch (err) {
    console.error('Fetch msgs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
