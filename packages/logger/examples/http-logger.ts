import {createLogger, type LogEntry, LogLevel, Transport, type TransportOptions} from '../src';

class HttpTransport extends Transport {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(
    options: TransportOptions & {
      endpoint: string;
      headers?: Record<string, string>;
    },
  ) {
    super(options);
    this.endpoint = options.endpoint;
    this.headers = options.headers || {};
  }

  protected async sendBatch(logs: LogEntry[]): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify({logs}),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

const logger = createLogger({
  label: 'ConsoleLogger',
  transports: [
    new HttpTransport({
      label: 'http-transport',
      endpoint: 'https://api.example.com/logs',
      headers: {Authorization: 'Bearer your-token'},
      batchSize: 15,
      debounceMs: 1500,
    }),
  ],
  level: LogLevel.INFO,
});

logger.info('This is an info message', {user: 'John Doe'});
