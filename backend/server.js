require('dotenv').config();
const connectDB = require('./config/db');

(async () => {
  await connectDB();
  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const helmet = require('helmet');
  const http = require('http');
  const cookieParser = require('cookie-parser'); // <-- 1. ADD THIS IMPORT
  const { Server } = require('socket.io');

  const app = express();
  const server = http.createServer(app);

  const allowedOrigins = [
    "http://localhost:5173", 
    "https://intell-meet.vercel.app", 
    /\.vercel\.app$/ 
  ];

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true 
    }
  });

  // Middleware Order is CRITICAL
  app.use(express.json());
  app.use(cookieParser()); // <-- 2. ADD THIS BEFORE CORS AND ROUTES

  app.use(cors({
    origin: allowedOrigins, // Using the array we defined above
    credentials: true 
  }));
  
  app.use(helmet());

  // Import Routes
  const authRoutes = require('./routes/authRoutes');
  const profileRoutes = require('./routes/profileRoutes'); 
  const meetingRoutes = require('./routes/meetingRoutes');

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes); 
  app.use('/api/meetings', meetingRoutes);
  
  app.get('/', (req, res) => {
    res.send('IntellMeet API is running...');
  });

  // Socket.io Logic...
  io.on('connection', (socket) => {
    // ... (rest of your socket code)
  }); 

  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();