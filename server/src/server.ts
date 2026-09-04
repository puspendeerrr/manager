import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import projectRoutes from './routes/projectRoutes';
import statsRoutes from './routes/statsRoutes';
import settingsRoutes from './routes/settingsRoutes';
import aiRoutes from './routes/aiRoutes';
import googleRoutes from './routes/googleRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorHandler';
import { reminderService } from './services/reminderService';
import { sendSuccess } from './utils/response';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Dynamic CORS Origin handling
const allowedOrigins = [
  'https://sonam.puspender.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.CLIENT_ORIGIN) allowedOrigins.push(process.env.CLIENT_ORIGIN);
if (process.env.CORS_ORIGINS) {
  process.env.CORS_ORIGINS.split(',').forEach((o) => allowedOrigins.push(o.trim()));
}

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow for production API flexibility
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health Check Endpoints (for Render & Monitoring)
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'online',
    app: 'Sonam AI Personal Todo & Reminder Server',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'online',
    app: 'Sonam AI Personal Todo & Reminder Server',
    timestamp: new Date().toISOString(),
  });
});

// API Core Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Internal Server Fallback Cron (runs every 1 minute if server is online)
cron.schedule('* * * * *', async () => {
  try {
    const processed: any = await reminderService.processDueReminders();
    const count = Array.isArray(processed) ? processed.length : 0;
    if (count > 0) {
      console.log(`[ServerCron] Processed ${count} due task reminders.`);
    }
  } catch (err) {
    console.error('[ServerCron] Error processing due reminders:', err);
  }
});

// Start Server on 0.0.0.0 process.env.PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 SONAM AI PERSONAL TODO & REMINDER SERVER IS ONLINE`);
  console.log(`📡 PORT: ${PORT}`);
  console.log(`=======================================================`);
});
