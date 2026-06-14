const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const availabilityRoutes = require('./routes/availability.routes');
const specializationRoutes = require('./routes/specialization.routes');
const searchRoutes = require('./routes/search.routes');
// const skillsRoutes = require('./routes/skills.routes'); // only if file exists

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working perfectly 🚀" });
});
app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/search', searchRoutes);
// app.use('/api/skills', skillsRoutes);

const videoCallRoutes = require('./routes/videoCall.routes');
app.use('/api/video-call', videoCallRoutes);

const messageRoutes = require('./routes/message.routes');
app.use('/api/messages', messageRoutes);

module.exports = app;
