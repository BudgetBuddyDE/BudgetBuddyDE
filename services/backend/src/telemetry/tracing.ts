import {SpanStatusCode, trace, type Span} from '@opentelemetry/api';

export const backendTracer = trace.getTracer('budgetbuddyde-backend');

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  operation: (span: Span) => Promise<T>,
): Promise<T> {
  return backendTracer.startActiveSpan(name, {attributes}, async span => {
    try {
      return await operation(span);
    } catch (error) {
      const errorType = error instanceof Error ? error.name : 'UnknownError';
      span.recordException({name: errorType, message: errorType});
      span.setStatus({code: SpanStatusCode.ERROR});
      throw error;
    } finally {
      span.end();
    }
  });
}
