import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './database/connection.js';
import { initializeDatabase } from './database/init.js';
import authRoutes from './routes/auth.js';
import athletesRoutes from './routes/athletes.js';
import sessionsRoutes from './routes/sessions.js';
import messagesRoutes from './routes/messages.js';
import performanceRoutes from './routes/performance.js';

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

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/athletes', athletesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/performance', performanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
    
    const PORT = process.env.PORT || 3001;
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
