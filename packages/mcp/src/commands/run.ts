import {Command, Flags} from '@oclif/core';

export default class RunCommand extends Command {
  static description = 'Run the application with specified options.';

  static args = {};

  static flags = {
    type: Flags.option({
      options: ['stdio', 'http'] as const,
      default: 'stdio',
      description: 'Type of application to run',
    })(),
    port: Flags.integer({
      char: 'p',
      min: 1,
      default: 3070,
      description: 'Port to run the application on',
    }),
  };

  async run(): Promise<void> {
    const {flags} = await this.parse(RunCommand);

    this.log(`Running application in ${flags.type} mode on port ${flags.port}`);
  }
}
