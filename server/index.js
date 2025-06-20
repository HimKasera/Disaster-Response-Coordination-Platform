import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import disasterRoutes from './routes/disasters.js';
import socialMediaRoutes from './routes/socialMedia.js';
import resourceRoutes from './routes/resources.js';
import geocodingRoutes from './routes/geocoding.js';
import verificationRoutes from './routes/verification.js';
import updatesRoutes from './routes/updates.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/disasters', authMiddleware, disasterRoutes);
app.use('/api/social-media', authMiddleware, socialMediaRoutes);
app.use('/api/resources', authMiddleware, resourceRoutes);
app.use('/api/geocoding', authMiddleware, geocodingRoutes);
app.use('/api/verification', authMiddleware, verificationRoutes);
app.use('/api/updates', authMiddleware, updatesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_disaster', (disasterId) => {
    socket.join(`disaster_${disasterId}`);
    console.log(`Client ${socket.id} joined disaster room: ${disasterId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Disaster Response Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };