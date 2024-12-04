import React from 'react';

import {Feature} from '@/app.config';
import {AuthLayout, UnauthentificatedLayout, useAuthContext} from '@/features/Auth';

import {FeatureNotEnabled} from '../FeatureNotEnabled/FeatureNotEnabled.component';
import {isFeatureEnabled} from '../isFeatureEnabled';

/**
 * Higher-order component that wraps a component with a feature flag check.
 * If the feature is enabled, it renders the wrapped component. Otherwise, it renders a fallback component.
 *
 * @template P - The props type of the wrapped component.
 * @param {Feature} feature - The feature flag to check.
 * @param {React.ComponentType<P>} Component - The component to wrap.
 * @param {boolean} [wrapWithLayout=false] - Whether to wrap the fallback component with a layout component.
 * @returns {React.ComponentType<P & {isAuthenticated?: boolean}>} - The wrapped component.
 */
export function withFeatureFlag<P extends object>(
  feature: Feature,
  Component: React.ComponentType<P>,
  wrapWithLayout = false,
) {
  return function WrappedComponent(props: P & {isAuthenticated?: boolean}) {
    const {sessionUser} = useAuthContext();
    if (!isFeatureEnabled(feature)) {
      if (!wrapWithLayout) return <FeatureNotEnabled />;
      return sessionUser ? (
        <AuthLayout>
          <FeatureNotEnabled />
        </AuthLayout>
      ) : (
        <UnauthentificatedLayout>
          <FeatureNotEnabled />
        </UnauthentificatedLayout>
      );
    }
    return <Component {...props} />;
  };
}
