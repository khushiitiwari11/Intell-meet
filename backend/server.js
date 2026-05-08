require('dotenv').config();
const connectDB = require('./config/db');

// --- DAY 26 IMPORTS (Observability) ---
const Sentry = require("@sentry/node");
const client = require('prom-client');

(async () => {
  // 1. Connect to MongoDB before starting the server
  await connectDB();
  
  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const helmet = require('helmet');
  const http = require('http');
  const cookieParser = require('cookie-parser');
  const { Server } = require('socket.io');

  const app = express();
  const server = http.createServer(app);

  // --- 2. SENTRY INITIALIZATION ---
  Sentry.init({ 
    dsn: process.env.SENTRY_BACKEND_DSN,
    tracesSampleRate: 1.0, 
  });

  // --- 3. PROMETHEUS METRICS SETUP ---
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ timeout: 5000 });

  const activeMeetingsGauge = new client.Gauge({
    name: 'intellmeet_active_meetings',
    help: 'Total number of active concurrent meetings'
  });

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

  // --- 4. MIDDLEWARE ORDER (CRITICAL) ---
  app.use(express.json());
  app.use(cookieParser()); // Required for secure HTTP-only cookies
  
  app.use(cors({
    origin: allowedOrigins,
    credentials: true 
  }));
  
  app.use(helmet());

  // --- 5. HEALTH CHECK & METRICS ROUTES ---
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'UP',
      uptime: process.uptime(),
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });

  // --- 6. API ROUTES ---
  const authRoutes = require('./routes/authRoutes');
  const profileRoutes = require('./routes/profileRoutes'); 
  const meetingRoutes = require('./routes/meetingRoutes');
  const taskRoutes = require('./routes/taskRoutes');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes); 
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/tasks', taskRoutes);    

  // --- 7. SENTRY ERROR HANDLER ---
  // Must be after routes, before other error middleware
  Sentry.setupExpressErrorHandler(app);
  
  app.get('/', (req, res) => {
    res.send('IntellMeet API is running with Observability...');
  });

  // --- 8. WEBRTC & SOCKET.IO SIGNALING LOGIC ---
  io.on('connection', (socket) => {
    // Prometheus Metric: Increment active connections
    activeMeetingsGauge.inc();
    console.log(`Socket connected: ${socket.id}`);

    // Room Joining
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId);
      
      // Store IDs on the socket for disconnect handling
      socket.userId = userId; 
      socket.roomId = roomId;
    });

    // WebRTC Call Offers
    socket.on('offer', (payload) => {
      socket.to(payload.roomId).emit('offer', payload);
    });

    // WebRTC Call Answers
    socket.on('answer', (payload) => {
      socket.to(payload.roomId).emit('answer', payload);
    });

    // ICE Candidate Routing (Network paths)
    socket.on('ice-candidate', (payload) => {
      socket.to(payload.roomId).emit('ice-candidate', payload);
    });

    // Chat Messages
    socket.on('send-message', (payload) => {
      socket.to(payload.roomId).emit('receive-message', payload);
    });

    // Handle Disconnects
    socket.on('disconnect', () => {
      // Prometheus Metric: Decrement active connections
      activeMeetingsGauge.dec();
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Notify the room so the disconnected user's video feed is removed
      if (socket.roomId && socket.userId) {
        socket.to(socket.roomId).emit('user-disconnected', socket.userId);
      }
    });
  }); 

  // --- 9. START SERVER ---
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();