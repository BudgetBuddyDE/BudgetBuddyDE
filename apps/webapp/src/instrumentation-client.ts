if (process.env.NEXT_PUBLIC_OTEL_ENDPOINT) {
  void import('./instrumentation.client');
}
