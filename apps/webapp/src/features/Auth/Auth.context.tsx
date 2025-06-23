import {type Session, type User} from 'better-auth';
import React from 'react';

import {authClient} from '@/auth';
import {logger} from '@/logger';
import {pb} from '@/pocketbase.ts';

export interface IAuthContext {
  loading: boolean;
  session: {session: Session; user: User} | null;
  fileToken: string | null;
  setSession: React.Dispatch<React.SetStateAction<IAuthContext['session']>>;
  getSession: () => ReturnType<typeof authClient.getSession>;
  revalidateSession: () => ReturnType<typeof authClient.getSession>;
  logout: () => Promise<void>;
}

export const AuthContext = React.createContext({} as IAuthContext);

export function useAuthContext() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}

export type AuthProviderProps = React.PropsWithChildren;

const authLogger = logger.child({label: 'AuthContext'});

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [loading, setLoading] = React.useState(true);
  const [fileToken, setFileToken] = React.useState<IAuthContext['fileToken']>(null);
  const [session, setSession] = React.useState<IAuthContext['session']>(null);

  /**
   * @deprecated
   */
  const retrieveFileToken = async () => {
    try {
      const token = await pb.files.getToken();
      setFileToken(token);
    } catch (e) {
      authLogger.error('message' in (e as any) ? ((e as any).message as string) : "Something wen't wrong", e);
    }
  };

  const retrieveCurrentSession = async () => {
    setLoading(true);
    try {
      const result = await authClient.getSession();
      if (result.error) {
        authLogger.error('Error retrieving BetterAuth session:', result.error);
      }
      const session = result.data;
      authLogger.debug('Retrieved BetterAuth session:', session);

      setSession(session);
    } catch (e) {
      authLogger.error('message' in (e as any) ? ((e as any).message as string) : "Something wen't wrong", e);
      setSession(null);
    }

    setLoading(false);
  };

  const getSession = async () => {
    await authClient.getSession();
  };

  const revalidateSession = async () => {
    const result = await authClient.getSession();
    if (result.error) {
      authLogger.error('Error revalidating session:', result.error);
      return;
    }
    setSession(result.data);
  };

  const logout = async () => {
    await authClient.signOut();
    authLogger.debug('User logged out');
    setSession(null);
  };

  React.useLayoutEffect(() => {
    retrieveCurrentSession();
    return () => {
      setSession(null);
      authLogger.debug('Auth session cleared');
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{loading, session: session, fileToken, getSession, revalidateSession, setSession, logout}}
      children={children}
    />
  );
};
