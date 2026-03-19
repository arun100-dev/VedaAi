import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const tlsOptions = redisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {};

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 10000,
  lazyConnect: false,
  keepAlive: 10000,
  retryStrategy: (times: number) => Math.min(times * 500, 5000),
  ...tlsOptions,
};

export const redisConnection = new IORedis(redisUrl, redisOptions);

export const QUEUE_NAME = 'assessment-generation';

export const assessmentQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const assessmentQueueEvents = new QueueEvents(QUEUE_NAME, {
  connection: new IORedis(redisUrl, redisOptions),
});

export { redisUrl };
