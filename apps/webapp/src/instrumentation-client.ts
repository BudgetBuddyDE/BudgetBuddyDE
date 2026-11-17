import {publicEnv} from './env';

if (publicEnv.NEXT_PUBLIC_OTEL_ENDPOINT?.trim()) {
  void import('./instrumentation.client');
}
