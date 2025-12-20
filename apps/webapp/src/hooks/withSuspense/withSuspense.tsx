import React from 'react';

export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent?: React.ComponentType,
) {
  return (props: P) => (
    <React.Suspense fallback={LoadingComponent ? <LoadingComponent /> : <p>Loading...</p>}>
      <Component {...props} />
    </React.Suspense>
  );
}
