import {config} from './config';
import {setupTracing} from './tracer';

setupTracing(config.service);
