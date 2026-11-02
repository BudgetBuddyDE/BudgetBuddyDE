import {shutdownLogging} from '@budgetbuddyde/logger/node';
import {shutdownTracing} from './tracer';

let shutdownPromise: Promise<void> | undefined;

/** Flushes logs and traces within one shared five-second shutdown window. */
export function shutdownTelemetry(): Promise<void> {
  if (!shutdownPromise) {
    const timeout = new Promise<void>(resolve => {
      const timer = setTimeout(resolve, 5000);
      timer.unref?.();
    });
    shutdownPromise = Promise.race([
      Promise.allSettled([shutdownLogging(), shutdownTracing()]).then(() => undefined),
      timeout,
    ]);
  }
  return shutdownPromise;
}
