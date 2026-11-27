const transactionRoutes = ['/api/transaction', '/api/category', '/api/budget', '/api/insights'] as const;

const dependencies: Record<string, readonly string[]> = {
  '/api/category': [...transactionRoutes, '/api/recurringPayment'],
  '/api/paymentMethod': [...transactionRoutes, '/api/paymentMethod', '/api/recurringPayment'],
  '/api/transaction': transactionRoutes,
  '/api/recurringPayment': ['/api/recurringPayment', '/api/budget'],
};

export function mutationCacheRoutes(routePath: string): readonly string[] {
  return dependencies[routePath] ?? [routePath];
}
