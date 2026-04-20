require('dotenv').config();
const connectDB = require('./config/db');

(async () => {
  await connectDB();
  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const helmet = require('helmet');
  const http = require('http');
  const { Server } = require('socket.io');

  const app = express();
  const server = http.createServer(app);

  // 1. Define the VIP List (Allowed Origins)
  const allowedOrigins = [
    "http://localhost:5173", 
    "https://intell-meet.vercel.app", 
    "https://intell-meet-riq2.vercel.app", 
    "https://intell-meet-r09pega1o-khushiitiwari11s-projects.vercel.app",
    "https://intell-meet-git-main-khushiitiwari11s-projects.vercel.app" 
  ];

  // 2. Initialize Socket.io (Update CORS here)
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true // Crucial for secure connections
    }
  });

  // Middleware
  app.use(express.json());
  
  // 3. Initialize Express (Update CORS here)
  app.use(cors({
    origin: allowedOrigins,
    credentials: true // Crucial for accepting the secure cookies
  }));
  
  app.use(helmet());

  // Import Routes
  const authRoutes = require('./routes/authRoutes');
  const profileRoutes = require('./routes/profileRoutes'); 
  const meetingRoutes = require('./routes/meetingRoutes');

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes); 
  app.use('/api/meetings', meetingRoutes);
  
  // Basic Route for testing
  app.get('/', (req, res) => {
    res.send('IntellMeet API is running...');
  });

  // Socket.io Connection & WebRTC Signaling Logic
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // 1. User joins a specific meeting room
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      
      // Broadcast to everyone else in the room that a new user joined
      socket.to(roomId).emit('user-connected', userId);

      // 2. WebRTC Signaling: Relay Offers
      socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', payload);
      });

      // 3. WebRTC Signaling: Relay Answers
      socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', payload);
      });

      // 4. WebRTC Signaling: Relay ICE Candidates
      socket.on('ice-candidate', (incoming) => {
        io.to(incoming.target).emit('ice-candidate', incoming.candidate);
      });
      
      socket.on('send-message', (payload) => {
        // Broadcast the message to everyone else in this specific room
        socket.to(roomId).emit('receive-message', payload);
      });
    
      socket.on('draw-line', (drawData) => {
        // Instantly forward the X/Y coordinates to everyone else in the room
        socket.to(roomId).emit('draw-line', drawData);
      });

      // Handle user leaving the call
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        socket.to(roomId).emit('user-disconnected', userId);
      });
    });
  }); 

  // Start Server
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();