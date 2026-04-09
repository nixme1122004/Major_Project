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

    // Find the receiver to notify them directly
    const [rooms] = await pool.query(
      `SELECT student1_id, student2_id FROM chat_rooms WHERE room_id = ?`,
      [room_id]
    );
    if (rooms.length > 0) {
      const room = rooms[0];
      // Use == since sender_id might be a string from JWT while db returns integer
      const receiver_id = room.student1_id == sender_id ? room.student2_id : room.student1_id;
      // Emit to BOTH receiver's personal room and the chat room in a single call to enable Socket.io deduplication
      getIO()
        .to(`room_user_${receiver_id}`)
        .to(`room_${room_id}`)
        .emit('newMessage', msgData);
    } else {
      // Fallback if room not found in query
      getIO().to(`room_${room_id}`).emit('newMessage', msgData);
    }

    res.status(201).json({
      message: 'Message sent',
      data: msgData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const student_id = req.user.student_id;

    const [rows] = await pool.query(
      `SELECT 
        cr.room_id,
        s.student_id as partner_id,
        s.name as partner_name,
        s.avatar as partner_avatar,
        m.message as last_message,
        m.sent_at as last_message_time
      FROM chat_rooms cr
      JOIN Students s ON (cr.student1_id = s.student_id OR cr.student2_id = s.student_id)
      LEFT JOIN messages m ON m.room_id = cr.room_id 
        AND m.message_id = (SELECT MAX(message_id) FROM messages WHERE room_id = cr.room_id)
      WHERE (cr.student1_id = ? OR cr.student2_id = ?)
        AND s.student_id != ?
      ORDER BY m.sent_at DESC`,
      [student_id, student_id, student_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { receiver_id: raw_receiver_id } = req.params;
    const caller_id = req.user.student_id;

    // Fix: Handle mock IDs like 'u1' from frontend
    const receiver_id = typeof raw_receiver_id === 'string' && raw_receiver_id.startsWith('u') 
      ? parseInt(raw_receiver_id.substring(1)) 
      : parseInt(raw_receiver_id);

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
