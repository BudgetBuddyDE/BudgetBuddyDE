import {buildConsoleFormat, LevelConfig} from '@budgetbuddyde/logger';
import {createLogger, format} from 'winston';
import {config} from '../config';

export const logger = createLogger({
  levels: LevelConfig.levels,
  level: config.log.level,
  defaultMeta: config.log.defaultMeta,
  format: format.combine(
    format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}), // Add timestamp
    format.splat(), // For string interpolation
    // padLevel(5), // Pad level to 5 characters
    // format.colorize({level: true, colors: LevelConfig.colors}), // Colorize level
    buildConsoleFormat(config.service, config.log.hideMeta),
  ),
  transports: config.log.transports,
});
