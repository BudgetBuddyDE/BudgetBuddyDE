import {config as loadEnv} from 'dotenv';
import {parseCliArgs} from './cli';
import {readConfigFromEnv} from './config';
import {fetchBudgetBuddyExport} from './export';
import {createCliLogger} from './logger';
import {fetchBudgetBuddyOverview, printPayments} from './overview';
import {serializeExport} from './serializer';

loadEnv();

export * from './auth';
export * from './cli';
export * from './config';
export * from './errors';
export * from './export';
export * from './logger';
export * from './overview';
export * from './serializer';
export * from './types';

export async function main(args = process.argv.slice(2)) {
  const command = parseCliArgs(args);
  const logger = createCliLogger(command.verbose);
  const config = readConfigFromEnv();

  if (args.length === 0) {
    const overview = await fetchBudgetBuddyOverview(config, logger);
    console.log(`BudgetBuddyDE API example using ${config.backendUrl}`);
    printPayments('Transactions', overview.transactions);
    printPayments('Recurring payments', overview.recurringPayments);
    return;
  }

  const result = await fetchBudgetBuddyExport(config, command, logger);
  logger.info('Serializing export result', {format: command.format});
  process.stdout.write(serializeExport(result, command.format));
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
