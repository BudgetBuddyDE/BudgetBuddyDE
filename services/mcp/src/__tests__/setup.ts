import {resolve} from 'node:path';
import dotenv from 'dotenv';

dotenv.config({path: resolve(__dirname, '../../.env.test'), override: true});

// Global test setup – silence console output during tests
vi.spyOn(console, 'table').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});
