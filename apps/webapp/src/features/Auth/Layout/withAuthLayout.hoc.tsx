import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';

import {FullPageLoader} from '@/components/Loading';

import {useAuthContext} from '../Auth.context';
import {AuthLayout} from './Auth.layout';

/**
 * **IMPORTANT**
 *
 * Need to be wrapped by the **AuthProvider** from **src/core/Auth/Auth.context**
 */
export function withAuthLayout<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P & {isAuthenticated?: boolean}) {
    const {pathname} = useLocation();
    const {loading, sessionUser} = useAuthContext();

    const loginRedirectUrl = React.useMemo(() => {
      const query = new URLSearchParams({
        callbackUrl: pathname,
      });
      return '/sign-in?' + query;
    }, [pathname]);

    if (loading) return <FullPageLoader />;

    if (!sessionUser) return <Navigate to={loginRedirectUrl} />;
    return (
      <AuthLayout>
        <Component {...props} />
      </AuthLayout>
    );
  };
}
