import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { redisConnection, QUEUE_NAME } from '../config/queue';
import { AssignmentModel } from '../models/Assignment';
import { generateAssessment } from '../services/openaiService';
import { AssignmentInput } from '../types';

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
  await mongoose.connect(uri);
  console.log('✅ Worker connected to MongoDB');
}

async function processJob(job: Job) {
  const { assignmentId, input }: { assignmentId: string; input: AssignmentInput } = job.data;

  console.log(`🔄 Processing job ${job.id} for assignment ${assignmentId}`);

  // Update status to processing
  await AssignmentModel.findByIdAndUpdate(assignmentId, {
    status: 'processing',
    jobId: job.id,
  });

  await job.updateProgress(10);

  try {
    const generatedPaper = await generateAssessment(
      input,
      async (progress, message) => {
        await job.updateProgress(progress);
        await job.log(message);
      }
    );

    // Store result
    await AssignmentModel.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      generatedPaper,
    });

    await job.updateProgress(100);

    return { assignmentId, generatedPaper };
  } catch (error: any) {
    await AssignmentModel.findByIdAndUpdate(assignmentId, {
      status: 'failed',
    });
    throw error;
  }
}

async function startWorker() {
  await connectDB();

  const worker = new Worker(QUEUE_NAME, processJob, {
    connection: redisConnection,
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
  });

  console.log('🚀 VedaAI Worker started, waiting for jobs...');
}

startWorker().catch(console.error);
