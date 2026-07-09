import {buildConsoleFormat, LevelConfig} from '@budgetbuddyde/logger';
import {createLogger, format, transports, type Logger} from 'winston';

const stderrLevels = Object.keys(LevelConfig.levels);

export type CliLogger = Pick<Logger, 'debug' | 'info'>;

export function createCliLogger(verbose = false): Logger {
  return createLogger({
    levels: LevelConfig.levels,
    level: verbose ? 'debug' : 'info',
    defaultMeta: {service: '@budgetbuddyde/example-api-key-client'},
    format: format.combine(
      format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
      format.splat(),
      format.colorize({level: true, colors: LevelConfig.colors}),
      buildConsoleFormat('api-key-export', true),
    ),
    transports: [new transports.Console({stderrLevels})],
  });
}
