import dotenv from 'dotenv';
import {afterAll} from 'vitest';
import {pool} from '../db/pool';
import {getRedisClient} from '../db/redis';

// Load test environment variables
dotenv.config({path: '.env.test'});

// Close connections after all tests
afterAll(async () => {
  // Close database pool
  await pool.end();

  // Close Redis connection
  const redis = getRedisClient();
  await redis.quit();
});
