import {resolve} from 'node:path';
import dotenv from 'dotenv';

dotenv.config({path: resolve(__dirname, '../../.env.test'), override: true});
// Deterministic credentials only for mocked unit-test infrastructure.
process.env.AUTH_SECRET = 'unit-test-secret-at-least-thirty-two-characters';
process.env.RESEND_API_KEY = 're_unit_test';
process.env.BASE_URL = 'http://localhost:9000';
process.env.AUTH_REDIS_URL = '';
