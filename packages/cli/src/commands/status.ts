import {Command} from '@oclif/core';

export default class StatusCommand extends Command {
  static description = 'Show the current CLI status.';

  async run(): Promise<void> {
    this.log('BudgetBuddyDE CLI is ready.');
  }
}
