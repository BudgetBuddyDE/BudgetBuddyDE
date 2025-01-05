import 'dotenv/config';

export function getLogLevel(): string {
  return process.env.LOG_LEVEL || 'info';
}
