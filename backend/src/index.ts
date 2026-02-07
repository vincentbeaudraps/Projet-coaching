import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './database/connection.js';
import { initializeDatabase } from './database/init.js';
import { errorMiddleware } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import athletesRoutes from './routes/athletes.js';
import sessionsRoutes from './routes/sessions.js';
import messagesRoutes from './routes/messages.js';
import performanceRoutes from './routes/performance.js';
import invitationsRoutes from './routes/invitations.js';
import activitiesRoutes from './routes/activities.js';
import platformsRoutes from './routes/platforms.js';
import notificationsRoutes from './routes/notifications.js';
import feedbackRoutes from './routes/feedback.js';
import goalsRoutes from './routes/goals.js';
import trainingPlansRoutes from './routes/training-plans.js';

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

dotenv.config();

const app: Express = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to API routes
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 login attempts per 15 minutes
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
});

// CORS - Configuration explicite
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/athletes', athletesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/platforms', platformsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/training-plans', trainingPlansRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler - doit être après toutes les routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware - doit être en dernier
app.use(errorMiddleware);

async function startServer() {
  try {
    // Try to connect to database
    try {
      await connectDB();
      console.log('Attempting to initialize database...');
      await initializeDatabase();
    } catch (dbError) {
      console.warn('Database connection warning:', dbError);
      console.log('Server starting without database. Please ensure PostgreSQL is running.');
    }
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
