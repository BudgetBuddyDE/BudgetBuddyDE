import type { NextFunction, Request, Response } from 'express';
import chalk from 'chalk';

export type TLogType = 'LOG' | 'INFO' | 'WARN' | 'ERROR';

export enum ELogCategory {
  SETUP = 'setup',
}

export function logMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.includes('favicon') || req.path === '/status') return next();
  res.on('finish', async () => {
    const statusCode = res.statusCode;
    const type: TLogType =
      statusCode >= 200 && statusCode < 400
        ? 'LOG'
        : statusCode >= 400 && statusCode < 500
        ? 'WARN'
        : 'ERROR';
    const category = res.statusCode.toString();
    const message = {
      method: req.method,
      ip: req.ip,
      location: req.originalUrl,
      body: req.body,
      query: req.query,
      header: { authorization: req.headers.authorization },
    };

    log(type, category, message);
  });
  next();
}

export function log(
  type: TLogType,
  category: ELogCategory | string | number,
  message: string | object
) {
  const msg = typeof message == 'string' ? message : JSON.stringify(message);
  const time = new Date().toISOString();
  const section = `(${category})`;
  const tag = `[${type}:${time}]`;
  switch (type) {
    case 'LOG':
      console.log(chalk.bgGreen(tag), chalk.green(section, msg));
      break;
    case 'INFO':
      console.log(chalk.bgBlue(tag), chalk.blue(section, msg));
      break;
    case 'WARN':
      console.log(chalk.bgYellowBright(tag), chalk.yellowBright(section, msg));
      break;
    case 'ERROR':
      console.log(chalk.bgRed(tag), chalk.red(section, msg));
      break;
    default:
      console.log(tag, ' ', section, ' ', msg);
      break;
  }
}
