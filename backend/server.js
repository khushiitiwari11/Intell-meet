require('dotenv').config();
const connectDB = require('./config/db');

// --- DAY 26 IMPORTS ---
const Sentry = require("@sentry/node");
const client = require('prom-client');

(async () => {
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

  // --- 1. SENTRY INITIALIZATION ---
  // Must be initialized before any other middleware [cite: 38, 139]
  Sentry.init({ 
    dsn: process.env.SENTRY_BACKEND_DSN,
    tracesSampleRate: 1.0, 
  });

  // --- 2. PROMETHEUS METRICS SETUP ---
  // Tracks system health and concurrent participants 
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ timeout: 5000 });

  const activeMeetingsGauge = new client.Gauge({
    name: 'intellmeet_active_meetings',
    help: 'Total number of active concurrent meetings'
  });

  // Allowed Origins for CORS [cite: 57, 137]
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

  // --- MIDDLEWARE ORDER (CRITICAL) ---
  app.use(Sentry.Handlers.requestHandler()); // Sentry first 
  app.use(express.json());
  app.use(cookieParser());

  app.use(cors({
    origin: allowedOrigins,
    credentials: true 
  }));
  
  app.use(helmet());

  // --- 3. HEALTH CHECK & METRICS ROUTES ---
  // Automated endpoints for monitoring tools [cite: 38, 139]
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

  // Import Routes [cite: 58, 75]
  const authRoutes = require('./routes/authRoutes');
  const profileRoutes = require('./routes/profileRoutes'); 
  const meetingRoutes = require('./routes/meetingRoutes');

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes); 
  app.use('/api/meetings', meetingRoutes);

  // Sentry Error Handler (Must be after routes, before other error middleware) 
  app.use(Sentry.Handlers.errorHandler());
  
  app.get('/', (req, res) => {
    res.send('IntellMeet API is running with Observability...');
  });

  // Socket.io Logic with Metrics tracking
  io.on('connection', (socket) => {
    // Increment gauge on meeting join or connection [cite: 81]
    activeMeetingsGauge.inc();

    socket.on('disconnect', () => {
      activeMeetingsGauge.dec();
    });
  }); 

  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();