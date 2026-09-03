import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

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
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'online',
    app: 'Sonam AI Personal Todo & Reminder Server',
    timestamp: new Date().toISOString(),
  });
});

// API Core Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Background Reminder Cron Worker (runs every 1 minute)
cron.schedule('* * * * *', async () => {
  try {
    const processed: any = await reminderService.processDueReminders();
    const count = Array.isArray(processed) ? processed.length : 0;
    if (count > 0) {
      console.log(`[ReminderCron] Processed ${count} due task reminders.`);
    }
  } catch (err) {
    console.error('[ReminderCron] Error processing due reminders:', err);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SONAM AI PERSONAL TODO & REMINDER SERVER IS ONLINE`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);

  // Start 10-second Persistent Repeating Reminder Background Worker
  setInterval(async () => {
    try {
      const notifs: any = await reminderService.processReminders();
      const count = Array.isArray(notifs) ? notifs.length : 0;
      if (count > 0) {
        console.log(`[ReminderWorker] Delivered ${count} persistent reminder notification(s).`);
      }
    } catch (err: any) {
      console.error('[ReminderWorker] Processing error:', err.message);
    }
  }, 10000);
});
