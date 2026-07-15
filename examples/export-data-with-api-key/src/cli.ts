import {InvalidCliArgumentError} from './errors';
import {exportEntities, exportFormats, type ExportCommand, type ExportEntity, type ExportFormat} from './types';

function isExportEntity(value: string): value is ExportEntity {
  return exportEntities.includes(value as ExportEntity);
}

function isExportFormat(value: string): value is ExportFormat {
  return exportFormats.includes(value as ExportFormat);
}

export function parseCliArgs(args: string[]): ExportCommand {
  const command: ExportCommand = {entity: 'all', format: 'json', verbose: false};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];

    if (arg === '--verbose' || arg === '-v') {
      command.verbose = true;
      continue;
    }

    if (arg === '--entity' || arg === '-e') {
      if (!value || (!isExportEntity(value) && value !== 'all')) {
        throw new InvalidCliArgumentError(`--entity must be one of: all, ${exportEntities.join(', ')}`);
      }
      command.entity = value;
      index += 1;
      continue;
    }

    if (arg === '--format' || arg === '-f') {
      if (!value || !isExportFormat(value)) {
        throw new InvalidCliArgumentError(`--format must be one of: ${exportFormats.join(', ')}`);
      }
      command.format = value;
      index += 1;
      continue;
    }

    if (arg === '--id') {
      if (!value) throw new InvalidCliArgumentError('--id requires a value');
      command.id = value;
      index += 1;
      continue;
    }

    throw new InvalidCliArgumentError(`Unknown argument: ${arg}`);
  }

  if (command.entity === 'all' && command.id) {
    throw new InvalidCliArgumentError('--id can only be used with a single --entity');
  }

  return command;
}
