import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { Worker } from 'bullmq';

dotenv.config();

import assignmentRoutes from './routes/assignments';
import authRoutes from './routes/auth';
import { wsManager } from './config/websocket';
import { redisConnection, QUEUE_NAME } from './config/queue';
import { generateAssessment } from './services/openaiService';
import { AssignmentModel } from './models/Assignment';

const app = express();
const server = http.createServer(app);

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'VedaAI Backend', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

wsManager.initialize(server);

// Inline BullMQ Worker - runs inside the same process, no paid plan needed
function startInlineWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { assignmentId, input } = job.data;
      console.log(`🔄 Processing job ${job.id} for assignment ${assignmentId}`);

      await AssignmentModel.findByIdAndUpdate(assignmentId, {
        status: 'processing',
        jobId: job.id,
      });

      await job.updateProgress(10);

      try {
        const generatedPaper = await generateAssessment(
          input,
          async (progress: number, message: string) => {
            await job.updateProgress(progress);
            await job.log(message);
          }
        );

        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          status: 'completed',
          generatedPaper,
        });

        await job.updateProgress(100);
        console.log(`✅ Job ${job.id} completed`);
        return { assignmentId, generatedPaper };
      } catch (error: any) {
        await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'failed' });
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => console.log(`✅ Job ${job.id} done`));
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message));
  console.log('🔧 Inline worker started');
}

async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    startInlineWorker();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 VedaAI Backend running on port ${PORT}`);
      console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
