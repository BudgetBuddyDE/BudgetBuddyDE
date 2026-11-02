import {shutdownLogging} from '@budgetbuddyde/logger/node';
import {shutdownTelemetry} from '../telemetry';
import {shutdownTracing} from '../tracer';

vi.mock('@budgetbuddyde/logger/node', () => ({shutdownLogging: vi.fn().mockResolvedValue(undefined)}));
vi.mock('../tracer', () => ({shutdownTracing: vi.fn().mockResolvedValue(undefined)}));

it('flushes central logs and traces during coordinated shutdown', async () => {
  await shutdownTelemetry();
  expect(shutdownLogging).toHaveBeenCalledOnce();
  expect(shutdownTracing).toHaveBeenCalledOnce();
});
