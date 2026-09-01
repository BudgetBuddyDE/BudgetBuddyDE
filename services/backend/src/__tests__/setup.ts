import {resolve} from 'node:path';
import dotenv from 'dotenv';

dotenv.config({path: resolve(__dirname, '../../.env.test'), override: true});
